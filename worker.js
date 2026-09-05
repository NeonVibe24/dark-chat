const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...CORS_HEADERS
    }
  });
}

function text(data, status = 200) {
  return new Response(data, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      ...CORS_HEADERS
    }
  });
}


/* =========================================================
   PASSWORD HASH
========================================================= */

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   RANDOM TOKEN
========================================================= */

function randomToken() {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   RANDOM CALL ID
========================================================= */

function randomCallId() {
  const bytes = new Uint8Array(16);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initDatabase(db) {

  await db.batch([

    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `),

    db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        FOREIGN KEY (user_id)
          REFERENCES users(id)
      )
    `),

    db.prepare(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        UNIQUE(user1_id, user2_id),
        FOREIGN KEY (user1_id)
          REFERENCES users(id),
        FOREIGN KEY (user2_id)
          REFERENCES users(id)
      )
    `),

    db.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        FOREIGN KEY (conversation_id)
          REFERENCES conversations(id),
        FOREIGN KEY (sender_id)
          REFERENCES users(id),
        FOREIGN KEY (receiver_id)
          REFERENCES users(id)
      )
    `),

    db.prepare(`
      CREATE TABLE IF NOT EXISTS call_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_id TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        signal_type TEXT NOT NULL,
        signal_data TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (sender_id)
          REFERENCES users(id),
        FOREIGN KEY (receiver_id)
          REFERENCES users(id)
      )
    `)

  ]);


  /* =======================================================
     PROFILE PHOTO MIGRATION
  ======================================================= */

  const columns =
    await db
      .prepare(`PRAGMA table_info(users)`)
      .all();

  const hasProfilePhoto =
    (columns.results || []).some(
      column => column.name === "profile_photo"
    );


  if (!hasProfilePhoto) {

    await db
      .prepare(`
        ALTER TABLE users
        ADD COLUMN profile_photo TEXT
      `)
      .run();

  }

}


/* =========================================================
   AUTH USER
========================================================= */

async function getUserFromRequest(request, env) {

  if (!env.DB) {
    return null;
  }

  const auth =
    request.headers.get("Authorization");

  if (
    !auth ||
    !auth.startsWith("Bearer ")
  ) {
    return null;
  }

  const token =
    auth.substring(7).trim();

  if (!token) {
    return null;
  }

  const user =
    await env.DB
      .prepare(`
        SELECT
          users.id,
          users.username,
          users.email,
          users.profile_photo
        FROM sessions
        INNER JOIN users
          ON users.id = sessions.user_id
        WHERE sessions.token = ?
        LIMIT 1
      `)
      .bind(token)
      .first();

  return user || null;
}


/* =========================================================
   CONVERSATION
========================================================= */

async function getConversation(
  db,
  userA,
  userB
) {

  const a = Math.min(
    Number(userA),
    Number(userB)
  );

  const b = Math.max(
    Number(userA),
    Number(userB)
  );

  return await db
    .prepare(`
      SELECT
        id,
        user1_id,
        user2_id
      FROM conversations
      WHERE user1_id = ?
      AND user2_id = ?
      LIMIT 1
    `)
    .bind(a, b)
    .first();
}


async function createConversation(
  db,
  userA,
  userB
) {

  const a = Math.min(
    Number(userA),
    Number(userB)
  );

  const b = Math.max(
    Number(userA),
    Number(userB)
  );

  await db
    .prepare(`
      INSERT OR IGNORE INTO conversations
      (
        user1_id,
        user2_id
      )
      VALUES (?, ?)
    `)
    .bind(a, b)
    .run();

  return await getConversation(
    db,
    a,
    b
  );
}


/* =========================================================
   WORKER
========================================================= */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);


    /* =====================================================
       CORS
    ===================================================== */

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });

    }


    try {

      /* ===================================================
         HEALTH
      =================================================== */

      if (
        url.pathname === "/api/health" &&
        request.method === "GET"
      ) {

        if (!env.DB) {

          return json({
            success: false,
            database: false,
            service: "dark-chat",
            error: "D1 binding DB not found"
          }, 500);

        }

        await initDatabase(env.DB);

        return json({
          success: true,
          database: true,
          service: "dark-chat"
        });

      }


      /* ===================================================
         REGISTER
      =================================================== */

      if (
        url.pathname === "/api/register" &&
        request.method === "POST"
      ) {

        if (!env.DB) {

          return json({
            success: false,
            error: "Database is not connected"
          }, 500);

        }

        await initDatabase(env.DB);

        const body =
          await request.json();

        const username =
          String(body.username || "").trim();

        const email =
          String(body.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(body.password || "");


        if (
          !username ||
          !email ||
          !password
        ) {

          return json({
            success: false,
            error:
              "Username, email and password are required"
          }, 400);

        }


        if (password.length < 6) {

          return json({
            success: false,
            error:
              "Password must be at least 6 characters"
          }, 400);

        }


        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
            .bind(email)
            .first();


        if (existing) {

          return json({
            success: false,
            error: "Email already exists"
          }, 409);

        }


        const passwordHash =
          await hashPassword(password);


        const result =
          await env.DB
            .prepare(`
              INSERT INTO users
              (
                username,
                email,
                password,
                profile_photo
              )
              VALUES (?, ?, ?, NULL)
            `)
            .bind(
              username,
              email,
              passwordHash
            )
            .run();


        return json({
          success: true,
          user_id: result.meta.last_row_id
        });

      }


      /* ===================================================
         LOGIN
      =================================================== */

      if (
        url.pathname === "/api/login" &&
        request.method === "POST"
      ) {

        if (!env.DB) {

          return json({
            success: false,
            error: "Database is not connected"
          }, 500);

        }

        await initDatabase(env.DB);

        const body =
          await request.json();

        const email =
          String(body.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(body.password || "");


        if (!email || !password) {

          return json({
            success: falsconst          error:
              "Email and password are required"
          }, 400);

        }


        const user =
          await env.DB
            .prepare(`
              SELECT
                id,
                username,
                email,
                password,
                profile_photo
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
            .bind(email)
            .first();


        if (!user) {

          return json({
            success: false,
            error:
              "Invalid email or password"
          }, 401);

        }


        const passwordHash =
          await hashPassword(password);


        if (user.password !== passwordHash) {

          return json({
            success: false,
            error:
              "Invalid email or password"
          }, 401);

        }


        const token =
          randomToken();


        await env.DB
          .prepare(`
            INSERT INTO sessions
            (
              user_id,
              token
            )
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
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profile_photo:
              user.profile_photo || null
          }
        });

      }


      /* ===================================================
         LOGOUT
      =================================================== */

      if (
        url.pathname === "/api/logout" &&
        request.method === "POST"
      ) {

        const auth =
          request.headers.get("Authorization");

        if (
          auth &&
          auth.startsWith("Bearer ")
        ) {

          const token =
            auth.substring(7).trim();

          if (token) {

            await env.DB
              .prepare(`
                DELETE FROM sessions
                WHERE token = ?
              `)
              .bind(token)
              .run();

          }

        }


        return json({
          success: true
        });

      }


      /* ===================================================
         CURRENT USER
      =================================================== */

      if (
        url.pathname === "/api/me" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        return json({
          success: true,
          user
        });

      }


      /* ===================================================
         PROFILE PHOTO
      =================================================== */

      if (
        url.pathname === "/api/profile/photo" &&
        request.method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const profilePhoto =
          body.profile_photo;


        if (
          profilePhoto !== null &&
          typeof profilePhoto !== "string"
        ) {

          return json({
            success: false,
            error: "Invalid profile photo"
          }, 400);

        }


        if (
          typeof profilePhoto === "string" &&
          profilePhoto.length > 1400000
        ) {

          return json({
            success: false,
            error: "Profile photo is too large"
          }, 413);

        }


        if (
          typeof profilePhoto === "string" &&
          !profilePhoto.startsWith("data:image/")
        ) {

          return json({
            success: false,
            error:
              "Profile photo must be an image"
          }, 400);

        }


        await env.DB
          .prepare(`
            UPDATE users
            SET profile_photo = ?
            WHERE id = ?
          `)
          .bind(
            profilePhoto || null,
            user.id
          )
          .run();


        return json({
          success: true,
          profile_photo:
            profilePhoto || null
        });

      }


      /* ===================================================
         DELETE PROFILE PHOTO
      =================================================== */

      if (
        url.pathname === "/api/profile/photo" &&
        request.method === "DELETE"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        await env.DB
          .prepare(`
            UPDATE users
            SET profile_photo = NULL
            WHERE id = ?
          `)
          .bind(user.id)
          .run();


        return json({
          success: true,
          profile_photo: null
        });

      }


      /* ===================================================
         USER LIST
      =================================================== */

      if (
        url.pathname === "/api/users" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const users =
          await env.DB
            .prepare(`
              SELECT
                id,
                username,
                email,
                profile_photo
              FROM users
              WHERE id != ?
              ORDER BY username COLLATE NOCASE ASC
            `)
            .bind(user.id)
            .all();


        return json({
          success: true,
          users:
            users.results || []
        });

      }


      /* ===================================================
         SINGLE USER
      =================================================== */

      if (
        url.pathname.startsWith("/api/users/") &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const id =
          Number(
            url.pathname.split("/").pop()
          );


        if (!id) {

          return json({
            success: false,
            error: "Invalid user ID"
          }, 400);

        }


        const target =
          await env.DB
            .prepare(`
              SELECT
                id,
                username,
                email,
                profile_photo
              FROM users
              WHERE id = ?
              LIMIT 1
            `)
            .bind(id)
            .first();


        if (!target) {

          return json({
            success: false,
            error: "User not found"
          }, 404);

        }


        return json({
          success: true,
          user: target
        });

      }


      /* ===================================================
         CREATE CONVERSATION
      =================================================== */

      if (
        url.pathname === "/api/conversations" &&
        request.method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const receiverId =
          Number(body.user_id);


        if (
          !receiverId ||
          receiverId === user.id
        ) {

          return json({
            success: false,
            error: "Invalid user ID"
          }, 400);

        }


        const receiver =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE id = ?
              LIMIT 1
            `)
            .bind(receiverId)
            .first();


        if (!receiver) {

          return json({
            success: false,
            error: "User not found"
          }, 404);

        }


        const conversation =
          await createConversation(
            env.DB,
            user.id,
            receiverId
          );


        return json({
          success: true,
          conversation
        });

      }


      /* ===================================================
         GET CONVERSATIONS
      =================================================== */

      if (
        url.pathname === "/api/conversations" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const conversations =
          await env.DB
            .prepare(`
              SELECT
                id,
                user1_id,
                user2_id
              FROM conversations
              WHERE
                user1_id = ?
                OR user2_id = ?
              ORDER BY id DESC
            `)
            .bind(
              user.id,
              user.id
            )
            .all();


        return json({
          success: true,
          conversations:
            conversations.results || []
        });

      }


      /* ===================================================
         SEND MESSAGE
      =================================================== */

      if (
        url.pathname === "/api/messages" &&
        request.method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const receiverId =
          Number(body.receiver_id);

        const message =
          String(body.message || "").trim();


        if (
          !receiverId ||
          !message
        ) {

          return json({
            success: false,
            error:
              "Receiver and message are required"
          }, 400);

        }


        if (receiverId === user.id) {

          return json({
            success: false,
            error:
              "You cannot message yourself"
          }, 400);

        }


        const receiver =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE id = ?
              LIMIT 1
            `)
            .bind(receiverId)
            .first();


        if (!receiver) {

          return json({
            success: false,
            error: "Receiver not found"
          }, 404);

        }


        const conversation =
          await createConversation(
            env.DB,
            user.id,
            receiverId
          );


        if (!conversation) {

          return json({
            success: false,
            error:
              "Could not create conversation"
          }, 500);

        }


        await env.DB
          .prepare(`
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
            user.id,
            receiverId,
            message
          )
          .run();


        return json({
          success: true
        });

      }


      /* ===================================================
         GET MESSAGES
      =================================================== */

      if (
        url.pathname === "/api/messages" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const otherUserId =
          Number(
            url.searchParams.get("user_id")
          );


        if (!otherUserId) {

          return json({
            success: false,
            error:
              "user_id is required"
          }, 400);

        }


        const conversation =
          await getConversation(
            env.DB,
            user.id,
            otherUserId
          );


        if (!conversation) {

          return json({
            success: true,
            messages: []
          });

        }


        const messages =
          await env.DB
            .prepare(`
              SELECT
                id,
                conversation_id,
                sender_id,
                receiver_id,
                message
              FROM messages
              WHERE conversation_id = ?
              ORDER BY id ASC
            `)
            .bind(conversation.id)
            .all();


        return json({
          success: true,
          messages:
            messages.results || []
        });

      }


      /* ===================================================
         DELETE MESSAGE
      =================================================== */

      if (
        url.pathname.startsWith("/api/messages/") &&
        request.method === "DELETE"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const id =
          Number(
            url.pathname.split("/").pop()
          );


        if (!id) {

          return json({
            success: false,
            error:
              "Invalid message ID"
          }, 400);

        }


        const result =
          await env.DB
            .prepare(`
              DELETE FROM messages
              WHERE id = ?
              AND sender_id = ?
            `)
            .bind(
              id,
              user.id
            )
            .run();


        return json({
          success: true,
          deleted:
            result.meta.changes > 0
        });

      }


      /* ===================================================
         SEND CALL SIGNAL
      =================================================== */

      if (
        url.pathname === "/api/calls/signal" &&
        request.method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const receiverId =
          Number(body.receiver_id);

        const signalType =
          String(
            body.signal_type || ""
          ).trim();

        let signalData =
          body.signal_data;

        let callId =
          String(
            body.call_id || ""
          ).trim();


        if (!callId) {
          callId = randomCallId();
        }


        const allowedTypes = [
          "offer",
          "answer",
          "ice-candidate",
          "reject",
          "end",
          "busy"
        ];


        if (!receiverId) {

          return json({
            success: false,
            error:
              "receiver_id is required"
          }, 400);

        }


        if (receiverId === user.id) {

          return json({
            success: false,
            error:
              "Invalid receiver"
          }, 400);

        }


        if (
          !allowedTypes.includes(signalType)
        ) {

          return json({
            success: false,
            error:
              "Invalid signal type"
          }, 400);

        }


        const receiver =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE id = ?
              LIMIT 1
            `)
            .bind(receiverId)
            .first();


        if (!receiver) {

          return json({
            success: false,
            error:
              "Receiver not found"
          }, 404);

        }


        if (
          signalData !== null &&
          signalData !== undefined &&
          typeof signalData !== "string"
        ) {

          signalData =
            JSON.stringify(signalData);

        }


        if (
          typeof signalData === "string" &&
          signalData.length > 500000
        ) {

          return json({
            success: false,
            error:
              "Signal data is too large"
          }, 413);

        }


        const createdAt =
          Date.now();


        const result =
          await env.DB
            .prepare(`
              INSERT INTO call_signals
              (
                call_id,
                sender_id,
                receiver_id,
                signal_type,
                signal_data,
                created_at
              )
              VALUES (?, ?, ?, ?, ?, ?)
            `)
            .bind(
              callId,
              user.id,
              receiverId,
              signalType,
              signalData || null,
              createdAt
            )
            .run();


        return json({
          success: true,
          id: result.meta.last_row_id,
          call_id: callId,
          created_at: createdAt
        });

      }


      /* ===================================================
         GET CALL SIGNALS
      =================================================== */

      if (
        url.pathname === "/api/calls/signals" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const callId =
          String(
            url.searchParams.get("call_id") || ""
          ).trim();


        if (!callId) {

          return json({
            success: false,
            error:
              "call_id is required"
          }, 400);

        }


        const signals =
          await env.DB
            .prepare(`
              SELECT
                cs.id,
                cs.call_id,
                cs.sender_id,
                cs.receiver_id,
                cs.signal_type,
                cs.signal_data,
                cs.created_at,

                u.username AS sender_username,
                u.email AS sender_email,
                u.profile_photo AS sender_profile_photo

              FROM call_signals cs

              INNER JOIN users u
                ON u.id = cs.sender_id

              WHERE
                cs.call_id = ?
                AND
                cs.receiver_id = ?

              ORDER BY cs.id ASC
            `)
            .bind(
              callId,
              user.id
            )
            .all();


        const result =
          (signals.results || []).map(signal => ({
            id: signal.id,
            call_id: signal.call_id,
            sender_id: signal.sender_id,
            receiver_id: signal.receiver_id,
            signal_type: signal.signal_type,
            signal_data: signal.signal_data,
            created_at: signal.created_at,

            sender: {
              id: signal.sender_id,
              username: signal.sender_username,
              email: signal.sender_email,
              profile_photo:
                signal.sender_profile_photo || null
            }
          }));


        return json({
          success: true,
          signals: result
        });

      }


      /* ===================================================
         DELETE CALL SIGNALS
      =================================================== */

      if (
        url.pathname === "/api/calls/signals" &&
        request.method === "DELETE"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const callId =
          String(
            url.searchParams.get("call_id") || ""
          ).trim();


        if (!callId) {

          return json({
            success: false,
            error:
              "call_id is required"
          }, 400);

        }


        await env.DB
          .prepare(`
            DELETE FROM call_signals
            WHERE
              call_id = ?
              AND
              (
                sender_id = ?
                OR
                receiver_id = ?
              )
          `)
          .bind(
            callId,
            user.id,
            user.id
          )
          .run();


        return json({
          success: true
        });

      }


      /* ===================================================
         INCOMING CALLS
      =================================================== */

      if (
        url.pathname === "/api/calls/incoming" &&
        request.method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const sinceParam =
          url.searchParams.get("since");

        const since =
          sinceParam !== null
            ? Number(sinceParam) || 0
            : Date.now() - 30000;


        const calls =
          await env.DB
            .prepare(`
              SELECT
                cs.id,
                cs.call_id,
                cs.sender_id,
                cs.receiver_id,
                cs.signal_type,
                cs.signal_data,
                cs.created_at,

                u.username AS sender_username,
                u.email AS sender_email,
                u.profile_photo AS sender_profile_photo

              FROM call_signals cs

              INNER JOIN users u
                ON u.id = cs.sender_id

              WHERE
                cs.receiver_id = ?
                AND cs.signal_type = 'offer'
                AND cs.created_at >= ?

              ORDER BY cs.id DESC
              LIMIT 20
            `)
            .bind(
              user.id,
              since
            )
            .all();


        const result =
          (calls.results || []).map(call => {

            let offerData = null;

            try {

              offerData =
                call.signal_data
                  ? JSON.parse(call.signal_data)
                  : null;

            } catch {

              offerData =
                call.signal_data;

            }


            return {
              id: call.id,
              call_id: call.call_id,
              sender_id: call.sender_id,
              receiver_id: call.receiver_id,
              signal_type: call.signal_type,
              signal_data: call.signal_data,
              created_at: call.created_at,

              sender: {
                id: call.sender_id,
                username: call.sender_username,
                email: call.sender_email,
                profile_photo:
                  call.sender_profile_photo || null
              },

              offer: offerData
            };

          });


        return json({
          success: true,
          calls: result
        });

      }


      /* ===================================================
         CLEAN OLD CALL SIGNALS
      =================================================== */

      if (
        url.pathname === "/api/calls/cleanup" &&
        request.method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env
          );


        if (!user) {

          return json({
            success: false,
            error: "Unauthorized"
          }, 401);

        }


        const oldTime =
          Date.now() - (60 * 60 * 1000);


        await env.DB
          .prepare(`
            DELETE FROM call_signals
            WHERE
              created_at < ?
              AND
              (
                sender_id = ?
                OR
                receiver_id = ?
              )
          `)
          .bind(
            oldTime,
            user.id,
            user.id
          )
          .run();


        return json({
          success: true
        });

      }


      /* ===================================================
         UNKNOWN API
      =================================================== */

      if (
        url.pathname.startsWith("/api/")
      ) {

        return json({
          success: false,
          error:
            "API endpoint not found",
          path:
            url.pathname
        }, 404);

      }


      /* ===================================================
         FRONTEND
      =================================================== */

      if (env.ASSETS) {

        return env.ASSETS.fetch(request);

      }


      return text(
        "Dark Chat Worker is running!"
      );


    } catch (error) {

      console.error(
        "Dark Chat Error:",
        error
      );


      return json({
        success: false,
        error:
          error?.message ||
          "Internal Server Error"
      }, 500);

    }

  }

};
