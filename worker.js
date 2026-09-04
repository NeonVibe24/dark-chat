export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // CORS
    // =========================================================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=UTF-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // =========================================================
    // Helpers
    // =========================================================
    const json = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders
      });
    };

    const getBody = async () => {
      try {
        return await request.json();
      } catch {
        return null;
      }
    };

    const generateToken = () => {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);

      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    };

    // =========================================================
    // Password hashing
    // =========================================================
    const hashPassword = async (password) => {
      const data = new TextEncoder().encode(password);

      const hash = await crypto.subtle.digest(
        "SHA-256",
        data
      );

      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    };

    // =========================================================
    // Database initialization
    // =========================================================
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user1_id INTEGER NOT NULL,
          user2_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user1_id, user2_id),
          FOREIGN KEY (user1_id) REFERENCES users(id),
          FOREIGN KEY (user2_id) REFERENCES users(id)
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id),
          FOREIGN KEY (sender_id) REFERENCES users(id),
          FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
      `).run();

    } catch (error) {
      console.error("Database initialization error:", error);
    }

    // =========================================================
    // AUTH
    // =========================================================
    const getAuthUser = async () => {
      const auth = request.headers.get("Authorization");

      if (!auth) {
        return null;
      }

      const token = auth.startsWith("Bearer ")
        ? auth.substring(7)
        : auth;

      if (!token) {
        return null;
      }

      try {
        const user = await env.DB.prepare(`
          SELECT
            users.id,
            users.username,
            users.email
          FROM sessions
          INNER JOIN users
            ON users.id = sessions.user_id
          WHERE sessions.token = ?
        `)
        .bind(token)
        .first();

        return user || null;

      } catch {
        return null;
      }
    };

    // =========================================================
    // API
    // =========================================================

    // ---------------------------------------------------------
    // REGISTER
    // ---------------------------------------------------------
    if (
      request.method === "POST" &&
      url.pathname === "/api/register"
    ) {
      const body = await getBody();

      if (!body) {
        return json({
          error: "Invalid JSON"
        }, 400);
      }

      const username = String(body.username || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!username || !email || !password) {
        return json({
          error: "All fields are required"
        }, 400);
      }

      if (username.length < 2) {
        return json({
          error: "Username must be at least 2 characters"
        }, 400);
      }

      if (password.length < 6) {
        return json({
          error: "Password must be at least 6 characters"
        }, 400);
      }

      if (!email.includes("@")) {
        return json({
          error: "Invalid email address"
        }, 400);
      }

      try {
        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        )
          .bind(email)
          .first();

        if (existing) {
          return json({
            error: "Email already exists"
          }, 409);
        }

        const passwordHash = await hashPassword(password);

        const result = await env.DB.prepare(`
          INSERT INTO users
          (username, email, password)
          VALUES (?, ?, ?)
        `)
          .bind(
            username,
            email,
            passwordHash
          )
          .run();

        return json({
          success: true,
          user: {
            id: result.meta.last_row_id,
            username,
            email
          }
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Registration failed"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // LOGIN
    // ---------------------------------------------------------
    if (
      request.method === "POST" &&
      url.pathname === "/api/login"
    ) {
      const body = await getBody();

      if (!body) {
        return json({
          error: "Invalid JSON"
        }, 400);
      }

      const email = String(body.email || "")
        .trim()
        .toLowerCase();

      const password = String(body.password || "");

      if (!email || !password) {
        return json({
          error: "Email and password are required"
        }, 400);
      }

      try {
        const passwordHash = await hashPassword(password);

        const user = await env.DB.prepare(`
          SELECT
            id,
            username,
            email
          FROM users
          WHERE email = ?
          AND password = ?
        `)
          .bind(
            email,
            passwordHash
          )
          .first();

        if (!user) {
          return json({
            error: "Invalid email or password"
          }, 401);
        }

        const token = generateToken();

        await env.DB.prepare(`
          INSERT INTO sessions
          (user_id, token)
          VALUES (?, ?)
        `)
          .bind(
            user.id,
            token
          )
          .run();

        return json({
          success: true,
          token,
          user
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Login failed"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // LOGOUT
    // ---------------------------------------------------------
    if (
      request.method === "POST" &&
      url.pathname === "/api/logout"
    ) {
      const auth = request.headers.get("Authorization");

      if (auth) {
        const token = auth.startsWith("Bearer ")
          ? auth.substring(7)
          : auth;

        try {
          await env.DB.prepare(
            "DELETE FROM sessions WHERE token = ?"
          )
            .bind(token)
            .run();
        } catch {}
      }

      return json({
        success: true
      });
    }

    // ---------------------------------------------------------
    // CURRENT USER
    // ---------------------------------------------------------
    if (
      request.method === "GET" &&
      url.pathname === "/api/me"
    ) {
      const user = await getAuthUser();

      if (!user) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      return json({
        success: true,
        user
      });
    }

    // ---------------------------------------------------------
    // USERS
    // ---------------------------------------------------------
    if (
      request.method === "GET" &&
      url.pathname === "/api/users"
    ) {
      try {
        const currentUser = await getAuthUser();

        const { results } = await env.DB.prepare(`
          SELECT
            id,
            username,
            email,
            created_at
          FROM users
          ORDER BY username COLLATE NOCASE ASC
        `).all();

        const users = results.map(user => ({
          ...user,
          is_current_user:
            currentUser
              ? user.id === currentUser.id
              : false
        }));

        return json({
          success: true,
          users
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to fetch users"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // GET USER BY ID
    // ---------------------------------------------------------
    if (
      request.method === "GET" &&
      url.pathname.startsWith("/api/users/")
    ) {
      const userId = Number(
        url.pathname.split("/").pop()
      );

      if (!userId) {
        return json({
          error: "Invalid user ID"
        }, 400);
      }

      try {
        const user = await env.DB.prepare(`
          SELECT
            id,
            username,
            email,
            created_at
          FROM users
          WHERE id = ?
        `)
          .bind(userId)
          .first();

        if (!user) {
          return json({
            error: "User not found"
          }, 404);
        }

        return json({
          success: true,
          user
        });

      } catch (error) {
        return json({
          error: "Failed to fetch user"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // CREATE / GET CONVERSATION
    // ---------------------------------------------------------
    if (
      request.method === "POST" &&
      url.pathname === "/api/conversations"
    ) {
      const currentUser = await getAuthUser();

      if (!currentUser) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      const body = await getBody();

      const otherUserId = Number(
        body?.user_id
      );

      if (!otherUserId) {
        return json({
          error: "user_id is required"
        }, 400);
      }

      if (otherUserId === currentUser.id) {
        return json({
          error: "You cannot chat with yourself"
        }, 400);
      }

      try {
        const otherUser = await env.DB.prepare(
          "SELECT id, username, email FROM users WHERE id = ?"
        )
          .bind(otherUserId)
          .first();

        if (!otherUser) {
          return json({
            error: "User not found"
          }, 404);
        }

        const user1 = Math.min(
          currentUser.id,
          otherUserId
        );

        const user2 = Math.max(
          currentUser.id,
          otherUserId
        );

        let conversation = await env.DB.prepare(`
          SELECT *
          FROM conversations
          WHERE user1_id = ?
          AND user2_id = ?
        `)
          .bind(user1, user2)
          .first();

        if (!conversation) {
          const result = await env.DB.prepare(`
            INSERT INTO conversations
            (user1_id, user2_id)
            VALUES (?, ?)
          `)
            .bind(user1, user2)
            .run();

          conversation = {
            id: result.meta.last_row_id,
            user1_id: user1,
            user2_id: user2
          };
        }

        return json({
          success: true,
          conversation,
          other_user: otherUser
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to create conversation"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // CONVERSATION LIST
    // ---------------------------------------------------------
    if (
      request.method === "GET" &&
      url.pathname === "/api/conversations"
    ) {
      const currentUser = await getAuthUser();

      if (!currentUser) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      try {
        const { results } = await env.DB.prepare(`
          SELECT
            c.id,
            c.created_at,

            CASE
              WHEN c.user1_id = ?
              THEN c.user2_id
              ELSE c.user1_id
            END AS other_user_id,

            u.username AS other_username,
            u.email AS other_email,

            (
              SELECT m.message
              FROM messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.id DESC
              LIMIT 1
            ) AS last_message,

            (
              SELECT m.created_at
              FROM messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.id DESC
              LIMIT 1
            ) AS last_message_time

          FROM conversations c

          INNER JOIN users u
            ON u.id =
              CASE
                WHEN c.user1_id = ?
                THEN c.user2_id
                ELSE c.user1_id
              END

          WHERE c.user1_id = ?
             OR c.user2_id = ?

          ORDER BY
            COALESCE(last_message_time, c.created_at)
            DESC
        `)
          .bind(
            currentUser.id,
            currentUser.id,
            currentUser.id,
            currentUser.id
          )
          .all();

        return json({
          success: true,
          conversations: results
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to fetch conversations"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // SEND MESSAGE
    // ---------------------------------------------------------
    if (
      request.method === "POST" &&
      url.pathname === "/api/messages"
    ) {
      const currentUser = await getAuthUser();

      if (!currentUser) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      const body = await getBody();

      const receiverId = Number(
        body?.receiver_id
      );

      const message = String(
        body?.message || ""
      ).trim();

      if (!receiverId || !message) {
        return json({
          error: "receiver_id and message are required"
        }, 400);
      }

      if (receiverId === currentUser.id) {
        return json({
          error: "You cannot send a message to yourself"
        }, 400);
      }

      if (message.length > 5000) {
        return json({
          error: "Message is too long"
        }, 400);
      }

      try {
        const receiver = await env.DB.prepare(
          "SELECT id FROM users WHERE id = ?"
        )
          .bind(receiverId)
          .first();

        if (!receiver) {
          return json({
            error: "Receiver not found"
          }, 404);
        }

        const user1 = Math.min(
          currentUser.id,
          receiverId
        );

        const user2 = Math.max(
          currentUser.id,
          receiverId
        );

        let conversation = await env.DB.prepare(`
          SELECT id
          FROM conversations
          WHERE user1_id = ?
          AND user2_id = ?
        `)
          .bind(user1, user2)
          .first();

        if (!conversation) {
          const result = await env.DB.prepare(`
            INSERT INTO conversations
            (user1_id, user2_id)
            VALUES (?, ?)
          `)
            .bind(user1, user2)
            .run();

          conversation = {
            id: result.meta.last_row_id
          };
        }

        const result = await env.DB.prepare(`
          INSERT INTO messages
          (
            conversation_id,
            sender_id,
            receiver_id,
            message
          )
          VALUES (?, ?, ?, ?)
        `)
          .bind(
            conversation.id,
            currentUser.id,
            receiverId,
            message
          )
          .run();

        const newMessage = await env.DB.prepare(`
          SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.receiver_id,
            m.message,
            m.created_at,

            sender.username AS sender_username,
            receiver.username AS receiver_username

          FROM messages m

          INNER JOIN users sender
            ON sender.id = m.sender_id

          INNER JOIN users receiver
            ON receiver.id = m.receiver_id

          WHERE m.id = ?
        `)
          .bind(result.meta.last_row_id)
          .first();

        return json({
          success: true,
          message: newMessage
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to send message"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // GET MESSAGES
    //
    // /api/messages?user_id=2
    // ---------------------------------------------------------
    if (
      request.method === "GET" &&
      url.pathname === "/api/messages"
    ) {
      const currentUser = await getAuthUser();

      if (!currentUser) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      const otherUserId = Number(
        url.searchParams.get("user_id")
      );

      if (!otherUserId) {
        return json({
          error: "user_id is required"
        }, 400);
      }

      if (otherUserId === currentUser.id) {
        return json({
          error: "Invalid user"
        }, 400);
      }

      try {
        const user1 = Math.min(
          currentUser.id,
          otherUserId
        );

        const user2 = Math.max(
          currentUser.id,
          otherUserId
        );

        const conversation = await env.DB.prepare(`
          SELECT id
          FROM conversations
          WHERE user1_id = ?
          AND user2_id = ?
        `)
          .bind(user1, user2)
          .first();

        if (!conversation) {
          return json({
            success: true,
            conversation_id: null,
            messages: []
          });
        }

        const { results } = await env.DB.prepare(`
          SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.receiver_id,
            m.message,
            m.created_at,

            sender.username AS sender_username,
            receiver.username AS receiver_username

          FROM messages m

          INNER JOIN users sender
            ON sender.id = m.sender_id

          INNER JOIN users receiver
            ON receiver.id = m.receiver_id

          WHERE m.conversation_id = ?

          ORDER BY m.id ASC
        `)
          .bind(conversation.id)
          .all();

        return json({
          success: true,
          conversation_id: conversation.id,
          messages: results
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to fetch messages"
        }, 500);
      }
    }

    // ---------------------------------------------------------
    // DELETE MESSAGE
    // ---------------------------------------------------------
    if (
      request.method === "DELETE" &&
      url.pathname.startsWith("/api/messages/")
    ) {
      const currentUser = await getAuthUser();

      if (!currentUser) {
        return json({
          error: "Unauthorized"
        }, 401);
      }

      const messageId = Number(
        url.pathname.split("/").pop()
      );

      if (!messageId) {
        return json({
          error: "Invalid message ID"
        }, 400);
      }

      try {
        const message = await env.DB.prepare(`
          SELECT id, sender_id
          FROM messages
          WHERE id = ?
        `)
          .bind(messageId)
          .first();

        if (!message) {
          return json({
            error: "Message not found"
          }, 404);
        }

        if (message.sender_id !== currentUser.id) {
          return json({
            error: "You can only delete your own messages"
          }, 403);
        }

        await env.DB.prepare(
          "DELETE FROM messages WHERE id = ?"
        )
          .bind(messageId)
          .run();

        return json({
          success: true
        });

      } catch (error) {
        console.error(error);

        return json({
          error: "Failed to delete message"
        }, 500);
      }
    }

    // =========================================================
    // HEALTH CHECK
    // =========================================================
    if (
      request.method === "GET" &&
      url.pathname === "/api/health"
    ) {
      try {
        await env.DB.prepare(
          "SELECT 1"
        ).first();

        return json({
          success: true,
          database: true,
          service: "dark-chat"
        });

      } catch {
        return json({
          success: false,
          database: false,
          service: "dark-chat"
        }, 500);
      }
    }

    // =========================================================
    // FRONTEND ASSETS
    // =========================================================
    try {
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response("Not Found", {
        status: 404
      });
    }
  }
};
