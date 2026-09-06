/* ============================================================
   DARK CHAT - CLOUDFLARE WORKER
   ============================================================

   FEATURES
   ------------------------------------------------------------
   - Register / Login / Logout
   - Username + Password authentication
   - Existing Email login support
   - Session authentication
   - Profile photo upload / delete
   - Private 1-to-1 text messages
   - Private Inbox
   - Private unread message notification count
   - Mark private messages as read
   - One shared Public Group Chat
   - Click another user's avatar/name in Group Chat
     -> Private Chat
   - NO user-created groups
   - NO group name/avatar creation
   - NO voice/video calls
   - Frontend assets served through Cloudflare Assets
   ============================================================ */


/* ============================================================
   CORS
============================================================ */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};


/* ============================================================
   RESPONSE HELPERS
============================================================ */

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );
}


function text(
  data,
  status = 200,
  contentType = "text/plain; charset=utf-8"
) {

  return new Response(
    data,
    {
      status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType
      }
    }
  );
}


/* ============================================================
   PASSWORD HASH
============================================================ */

async function hashPassword(password) {

  const data =
    new TextEncoder().encode(password);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return [...new Uint8Array(hash)]
    .map(
      b =>
        b
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


/* ============================================================
   RANDOM TOKEN
============================================================ */

function randomToken() {

  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return [...bytes]
    .map(
      b =>
        b
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


/* ============================================================
   DATABASE INITIALIZATION
============================================================ */

let databaseInitPromise = null;


async function initDatabase(db) {

  if (!databaseInitPromise) {

    databaseInitPromise =
      initializeDatabase(db)
        .catch(error => {

          databaseInitPromise = null;

          throw error;

        });

  }

  return databaseInitPromise;
}


async function initializeDatabase(db) {

  /* ----------------------------------------------------------
     USERS
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `).run();


  /* ----------------------------------------------------------
     PROFILE PHOTO MIGRATION
  ---------------------------------------------------------- */

  const userColumns =
    await db
      .prepare(`
        PRAGMA table_info(users)
      `)
      .all();

  const columns =
    userColumns.results || [];

  const hasProfilePhoto =
    columns.some(
      column =>
        column.name === "profile_photo"
    );


  if (!hasProfilePhoto) {

    await db.prepare(`
      ALTER TABLE users
      ADD COLUMN profile_photo TEXT
    `).run();

  }


  /* ----------------------------------------------------------
     SESSIONS
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user_id INTEGER NOT NULL,

      token TEXT NOT NULL UNIQUE,

      FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `).run();


  /* ----------------------------------------------------------
     PRIVATE CONVERSATIONS
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user1_id INTEGER NOT NULL,

      user2_id INTEGER NOT NULL,

      UNIQUE(user1_id, user2_id),

      FOREIGN KEY(user1_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      FOREIGN KEY(user2_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `).run();


  /* ----------------------------------------------------------
     PRIVATE MESSAGES

     created_at was added for:
     - inbox last message time
     - message time
     - sorting
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      conversation_id INTEGER NOT NULL,

      sender_id INTEGER NOT NULL,

      receiver_id INTEGER NOT NULL,

      message TEXT NOT NULL,

      created_at INTEGER NOT NULL,

      FOREIGN KEY(conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

      FOREIGN KEY(sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      FOREIGN KEY(receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `).run();


  /* ----------------------------------------------------------
     PRIVATE MESSAGE created_at MIGRATION

     Existing database may already have messages table
     without created_at.

     SQLite allows adding a nullable column.
  ---------------------------------------------------------- */

  const messageColumns =
    await db
      .prepare(`
        PRAGMA table_info(messages)
      `)
      .all();

  const messageColumnList =
    messageColumns.results || [];

  const hasMessageCreatedAt =
    messageColumnList.some(
      column =>
        column.name === "created_at"
    );


  if (!hasMessageCreatedAt) {

    await db.prepare(`
      ALTER TABLE messages
      ADD COLUMN created_at INTEGER
    `).run();

  }


  /*
   * Old messages have no created_at.
   * Use 0 instead of leaving NULL.
   */

  try {

    await db.prepare(`
      UPDATE messages

      SET created_at = 0

      WHERE created_at IS NULL
    `).run();

  } catch (error) {

    console.error(
      "MESSAGE CREATED_AT MIGRATION ERROR:",
      error
    );

  }


  /* ----------------------------------------------------------
     PRIVATE MESSAGE READ STATE

     Stores the last private message ID that a user
     has read from another user.
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS private_message_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user_id INTEGER NOT NULL,

      other_user_id INTEGER NOT NULL,

      last_read_message_id INTEGER NOT NULL DEFAULT 0,

      UNIQUE(user_id, other_user_id),

      FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      FOREIGN KEY(other_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `).run();


  /* ----------------------------------------------------------
     PUBLIC GROUP CHAT
  ---------------------------------------------------------- */

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS global_group_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      sender_id INTEGER NOT NULL,

      message TEXT NOT NULL,

      created_at INTEGER NOT NULL,

      FOREIGN KEY(sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `).run();


  /* ----------------------------------------------------------
     INDEXES
  ---------------------------------------------------------- */

  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_sessions_token
      ON sessions(token)
    `).run();

  } catch (error) {

    console.error(
      "SESSION INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_conversation
      ON messages(conversation_id)
    `).run();

  } catch (error) {

    console.error(
      "MESSAGE INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_receiver
      ON messages(receiver_id, id)
    `).run();

  } catch (error) {

    console.error(
      "RECEIVER MESSAGE INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_sender_receiver
      ON messages(sender_id, receiver_id, id)
    `).run();

  } catch (error) {

    console.error(
      "SENDER RECEIVER INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_created
      ON messages(created_at)
    `).run();

  } catch (error) {

    console.error(
      "MESSAGE CREATED INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_private_reads_user
      ON private_message_reads(user_id, other_user_id)
    `).run();

  } catch (error) {

    console.error(
      "PRIVATE READ INDEX ERROR:",
      error
    );

  }


  try {

    await db.prepare(`
      CREATE INDEX IF NOT EXISTS
      idx_group_messages_created
      ON global_group_messages(created_at)
    `).run();

  } catch (error) {

    console.error(
      "GROUP INDEX ERROR:",
      error
    );

  }

}


/* ============================================================
   USER FORMATTER
============================================================ */

function formatUser(row) {

  if (!row) {
    return null;
  }

  return {

    id:
      Number(row.id),

    username:
      row.username || "",

    email:
      row.email || "",

    profile_photo:
      row.profile_photo ||
      null

  };
}


/* ============================================================
   PRIVATE MESSAGE TIME
============================================================ */

function formatPrivateMessage(row) {

  if (!row) {
    return null;
  }


  const rawCreatedAt =
    row.created_at;


  let createdAt = null;


  if (
    rawCreatedAt !== null &&
    rawCreatedAt !== undefined &&
    rawCreatedAt !== ""
  ) {

    const number =
      Number(
        rawCreatedAt
      );


    if (
      Number.isFinite(number) &&
      number > 0
    ) {

      createdAt =
        new Date(
          number
        ).toISOString();

    }

  }


  return {

    id:
      Number(row.id),

    conversation_id:
      Number(row.conversation_id),

    sender_id:
      Number(row.sender_id),

    receiver_id:
      Number(row.receiver_id),

    message:
      row.message || "",

    created_at:
      createdAt,

    sender_username:
      row.sender_username || "",

    sender_email:
      row.sender_email || "",

    sender_profile_photo:
      row.sender_profile_photo ||
      null,

    sender: {

      id:
        Number(row.sender_id),

      username:
        row.sender_username || "",

      email:
        row.sender_email || "",

      profile_photo:
        row.sender_profile_photo ||
        null

    }

  };
}


/* ============================================================
   AUTHENTICATION
============================================================ */

async function getUserFromRequest(
  request,
  db
) {

  const auth =
    request.headers.get(
      "Authorization"
    );


  if (!auth) {
    return null;
  }


  if (
    !auth.startsWith(
      "Bearer "
    )
  ) {

    return null;

  }


  const token =
    auth
      .slice(7)
      .trim();


  if (!token) {
    return null;
  }


  const result =
    await db.prepare(`
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


  return formatUser(result);
}


/* ============================================================
   PRIVATE CONVERSATION
============================================================ */

async function getConversation(
  db,
  userA,
  userB
) {

  const first =
    Math.min(
      Number(userA),
      Number(userB)
    );

  const second =
    Math.max(
      Number(userA),
      Number(userB)
    );


  return await db.prepare(`
    SELECT *

    FROM conversations

    WHERE user1_id = ?

      AND user2_id = ?

    LIMIT 1
  `)
    .bind(
      first,
      second
    )
    .first();
}


async function createConversation(
  db,
  userA,
  userB
) {

  const first =
    Math.min(
      Number(userA),
      Number(userB)
    );

  const second =
    Math.max(
      Number(userA),
      Number(userB)
    );


  await db.prepare(`
    INSERT OR IGNORE INTO conversations
    (
      user1_id,
      user2_id
    )

    VALUES (?, ?)
  `)
    .bind(
      first,
      second
    )
    .run();


  return await getConversation(
    db,
    first,
    second
  );
}


/* ============================================================
   GROUP MESSAGE FORMATTER
============================================================ */

function formatGroupMessage(row) {

  if (!row) {
    return null;
  }


  const createdAt =
    Number(row.created_at);


  const isoDate =
    Number.isFinite(createdAt) &&
    createdAt > 0
      ? new Date(createdAt).toISOString()
      : null;


  return {

    id:
      Number(row.id),

    sender_id:
      Number(row.sender_id),

    message:
      row.message || "",

    created_at:
      isoDate,

    sender_username:
      row.sender_username || "",

    sender_profile_photo:
      row.sender_profile_photo ||
      null,

    sender: {

      id:
        Number(row.sender_id),

      username:
        row.sender_username || "",

      email:
        row.sender_email || "",

      profile_photo:
        row.sender_profile_photo ||
        null

    }

  };
}


/* ============================================================
   MAIN WORKER
============================================================ */

export default {

  async fetch(
    request,
    env
  ) {

    try {

      /* ======================================================
         CORS PREFLIGHT
      ====================================================== */

      if (
        request.method ===
        "OPTIONS"
      ) {

        return new Response(
          null,
          {
            status: 204,
            headers:
              CORS_HEADERS
          }
        );

      }


      const url =
        new URL(request.url);

      const path =
        url.pathname;

      const method =
        request.method;


      /* ======================================================
         FRONTEND ASSETS
      ====================================================== */

      if (
        !path.startsWith("/api/")
      ) {

        if (env.ASSETS) {

          return env.ASSETS.fetch(
            request
          );

        }


        return text(
          "Dark Chat Worker is running.",
          200
        );

      }


      /* ======================================================
         DATABASE BINDING CHECK
      ====================================================== */

      if (!env.DB) {

        return json(
          {
            success: false,
            error:
              "Database binding is missing."
          },
          500
        );

      }


      /* ======================================================
         DATABASE INITIALIZATION
      ====================================================== */

      await initDatabase(
        env.DB
      );


      /* ======================================================
         HEALTH
      ====================================================== */

      if (
        path === "/api/health" &&
        method === "GET"
      ) {

        return json({

          success: true,

          status: "ok",

          app:
            "Dark Chat"

        });

      }


      /* ======================================================
         REGISTER
      ====================================================== */

      if (
        path === "/api/register" &&
        method === "POST"
      ) {

        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const username =
          String(
            body.username || ""
          ).trim();


        const password =
          String(
            body.password || ""
          );


        let email =
          String(
            body.email || ""
          )
            .trim()
            .toLowerCase();


        if (
          !username ||
          !password
        ) {

          return json(
            {
              success: false,
              error:
                "Username and password are required."
            },
            400
          );

        }


        if (
          username.length < 2
        ) {

          return json(
            {
              success: false,
              error:
                "Username is too short."
            },
            400
          );

        }


        if (
          username.length > 50
        ) {

          return json(
            {
              success: false,
              error:
                "Username is too long."
            },
            400
          );

        }


        if (
          password.length < 4
        ) {

          return json(
            {
              success: false,
              error:
                "Password is too short."
            },
            400
          );

        }


        if (
          password.length > 500
        ) {

          return json(
            {
              success: false,
              error:
                "Password is too long."
            },
            400
          );

        }


        const existingUsername =
          await env.DB.prepare(`
            SELECT id

            FROM users

            WHERE username = ? COLLATE NOCASE

            LIMIT 1
          `)
            .bind(username)
            .first();


        if (existingUsername) {

          return json(
            {
              success: false,
              error:
                "Username already exists."
            },
            409
          );

        }


        if (email) {

          const existingEmail =
            await env.DB.prepare(`
              SELECT id

              FROM users

              WHERE email = ?

              LIMIT 1
            `)
              .bind(email)
              .first();


          if (existingEmail) {

            return json(
              {
                success: false,
                error:
                  "Email already exists."
              },
              409
            );

          }

        } else {

          email =
            `user_${Date.now()}_${randomToken().slice(0, 12)}@local.darkchat`;

        }


        const passwordHash =
          await hashPassword(
            password
          );


        let userId;


        try {

          const result =
            await env.DB.prepare(`
              INSERT INTO users
              (
                username,
                email,
                password
              )

              VALUES (?, ?, ?)
            `)
              .bind(
                username,
                email,
                passwordHash
              )
              .run();


          userId =
            Number(
              result.meta.last_row_id
            );


        } catch (error) {

          console.error(
            "REGISTER INSERT ERROR:",
            error
          );


          return json(
            {
              success: false,
              error:
                "Registration failed.",
              detail:
                error.message
            },
            500
          );

        }


        const token =
          randomToken();


        try {

          await env.DB.prepare(`
            INSERT INTO sessions
            (
              user_id,
              token
            )

            VALUES (?, ?)
          `)
            .bind(
              userId,
              token
            )
            .run();

        } catch (error) {

          console.error(
            "SESSION CREATE ERROR:",
            error
          );


          return json(
            {
              success: false,
              error:
                "Account created, but login session could not be created.",
              detail:
                error.message
            },
            500
          );

        }


        const user =
          await env.DB.prepare(`
            SELECT

              id,

              username,

              email,

              profile_photo

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(userId)
            .first();


        return json(
          {

            success: true,

            token,

            user:
              formatUser(user)

          },
          201
        );

      }


      /* ======================================================
         LOGIN
      ====================================================== */

      if (
        path === "/api/login" &&
        method === "POST"
      ) {

        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const username =
          String(
            body.username || ""
          ).trim();


        const email =
          String(
            body.email || ""
          )
            .trim()
            .toLowerCase();


        const password =
          String(
            body.password || ""
          );


        if (
          (!username && !email) ||
          !password
        ) {

          return json(
            {
              success: false,
              error:
                "Username/email and password are required."
            },
            400
          );

        }


        const passwordHash =
          await hashPassword(
            password
          );


        let user = null;


        if (email) {

          user =
            await env.DB.prepare(`
              SELECT

                id,

                username,

                email,

                profile_photo

              FROM users

              WHERE email = ?

                AND password = ?

              LIMIT 1
            `)
              .bind(
                email,
                passwordHash
              )
              .first();

        }


        if (
          !user &&
          username
        ) {

          user =
            await env.DB.prepare(`
              SELECT

                id,

                username,

                email,

                profile_photo

              FROM users

              WHERE username = ? COLLATE NOCASE

                AND password = ?

              LIMIT 1
            `)
              .bind(
                username,
                passwordHash
              )
              .first();

        }


        if (!user) {

          return json(
            {
              success: false,
              error:
                "Invalid username/email or password."
            },
            401
          );

        }


        const token =
          randomToken();


        await env.DB.prepare(`
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

          user:
            formatUser(user)

        });

      }


      /* ======================================================
         LOGOUT
      ====================================================== */

      if (
        path === "/api/logout" &&
        method === "POST"
      ) {

        const auth =
          request.headers.get(
            "Authorization"
          );


        if (
          auth &&
          auth.startsWith(
            "Bearer "
          )
        ) {

          const token =
            auth
              .slice(7)
              .trim();


          if (token) {

            await env.DB.prepare(`
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


      /* ======================================================
         CURRENT USER
      ====================================================== */

      if (
        path === "/api/me" &&
        method === "GET"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!user) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        return json({

          success: true,

          user

        });

      }


      /* ======================================================
         PROFILE PHOTO - UPLOAD
      ====================================================== */

      if (
        path === "/api/profile/photo" &&
        method === "POST"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!user) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const photo =
          String(
            body.profile_photo ||
            body.photo ||
            ""
          ).trim();


        if (!photo) {

          return json(
            {
              success: false,
              error:
                "Photo is required."
            },
            400
          );

        }


        if (
          photo.length >
          5_000_000
        ) {

          return json(
            {
              success: false,
              error:
                "Photo is too large."
            },
            400
          );

        }


        await env.DB.prepare(`
          UPDATE users

          SET profile_photo = ?

          WHERE id = ?
        `)
          .bind(
            photo,
            user.id
          )
          .run();


        const updatedUser =
          await env.DB.prepare(`
            SELECT

              id,

              username,

              email,

              profile_photo

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(user.id)
            .first();


        return json({

          success: true,

          user:
            formatUser(
              updatedUser
            )

        });

      }


      /* ======================================================
         PROFILE PHOTO - DELETE
      ====================================================== */

      if (
        path === "/api/profile/photo" &&
        method === "DELETE"
      ) {

        const user =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!user) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        await env.DB.prepare(`
          UPDATE users

          SET profile_photo = NULL

          WHERE id = ?
        `)
          .bind(user.id)
          .run();


        const updatedUser =
          await env.DB.prepare(`
            SELECT

              id,

              username,

              email,

              profile_photo

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(user.id)
            .first();


        return json({

          success: true,

          user:
            formatUser(
              updatedUser
            )

        });

      }


      /* ======================================================
         USERS
      ====================================================== */

      if (
        path === "/api/users" &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const result =
          await env.DB.prepare(`
            SELECT

              id,

              username,

              email,

              profile_photo

            FROM users

            WHERE id != ?

            ORDER BY
              username COLLATE NOCASE ASC
          `)
            .bind(
              currentUser.id
            )
            .all();


        return json({

          success: true,

          users:
            (
              result.results || []
            ).map(formatUser)

        });

      }


      /* ======================================================
         USER BY ID
      ====================================================== */

      const userMatch =
        path.match(
          /^\/api\/users\/(\d+)$/
        );


      if (
        userMatch &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const userId =
          Number(
            userMatch[1]
          );


        const user =
          await env.DB.prepare(`
            SELECT

              id,

              username,

              email,

              profile_photo

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(userId)
            .first();


        if (!user) {

          return json(
            {
              success: false,
              error:
                "User not found."
            },
            404
          );

        }


        return json({

          success: true,

          user:
            formatUser(user)

        });

      }


      /* ======================================================
         CREATE PRIVATE CONVERSATION
      ====================================================== */

      if (
        path === "/api/conversations" &&
        method === "POST"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const otherUserId =
          Number(
            body.user_id
          );


        if (
          !Number.isInteger(
            otherUserId
          ) ||
          otherUserId <= 0
        ) {

          return json(
            {
              success: false,
              error:
                "Invalid user_id."
            },
            400
          );

        }


        if (
          otherUserId ===
          currentUser.id
        ) {

          return json(
            {
              success: false,
              error:
                "You cannot create a chat with yourself."
            },
            400
          );

        }


        const otherUser =
          await env.DB.prepare(`
            SELECT id

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(
              otherUserId
            )
            .first();


        if (!otherUser) {

          return json(
            {
              success: false,
              error:
                "User not found."
            },
            404
          );

        }


        const conversation =
          await createConversation(
            env.DB,
            currentUser.id,
            otherUserId
          );


        return json({

          success: true,

          conversation

        });

      }


      /* ======================================================
         CONVERSATIONS
      ====================================================== */

      if (
        path === "/api/conversations" &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const result =
          await env.DB.prepare(`
            SELECT

              c.id,

              c.user1_id,

              c.user2_id,


              CASE
                WHEN c.user1_id = ?
                THEN u2.id
                ELSE u1.id
              END AS other_user_id,


              CASE
                WHEN c.user1_id = ?
                THEN u2.username
                ELSE u1.username
              END AS other_username,


              CASE
                WHEN c.user1_id = ?
                THEN u2.email
                ELSE u1.email
              END AS other_email,


              CASE
                WHEN c.user1_id = ?
                THEN u2.profile_photo
                ELSE u1.profile_photo
              END AS other_profile_photo,


              (
                SELECT COUNT(*)

                FROM messages m

                WHERE m.conversation_id = c.id

                  AND m.receiver_id = ?

                  AND m.id >
                    COALESCE(
                      (
                        SELECT last_read_message_id

                        FROM private_message_reads pmr

                        WHERE pmr.user_id = ?

                          AND pmr.other_user_id =
                            CASE
                              WHEN c.user1_id = ?
                              THEN c.user2_id
                              ELSE c.user1_id
                            END

                        LIMIT 1
                      ),
                      0
                    )
              ) AS unread_count,


              (
                SELECT m.message

                FROM messages m

                WHERE m.conversation_id = c.id

                ORDER BY m.id DESC

                LIMIT 1
              ) AS last_message,


              (
                SELECT m.id

                FROM messages m

                WHERE m.conversation_id = c.id

                ORDER BY m.id DESC

                LIMIT 1
              ) AS last_message_id,


              (
                SELECT m.created_at

                FROM messages m

                WHERE m.conversation_id = c.id

                ORDER BY m.id DESC

                LIMIT 1
              ) AS last_message_at


            FROM conversations c


            INNER JOIN users u1
              ON u1.id = c.user1_id


            INNER JOIN users u2
              ON u2.id = c.user2_id


            WHERE
              c.user1_id = ?

              OR

              c.user2_id = ?


            ORDER BY

              COALESCE(
                (
                  SELECT m.id

                  FROM messages m

                  WHERE m.conversation_id = c.id

                  ORDER BY m.id DESC

                  LIMIT 1
                ),
                0
              ) DESC,

              c.id DESC
          `)
            .bind(
              currentUser.id,
              currentUser.id,
              currentUser.id,
              currentUser.id,

              currentUser.id,
              currentUser.id,

              currentUser.id,

              currentUser.id,
              currentUser.id
            )
            .all();


        const conversations =
          (
            result.results || []
          ).map(row => ({

            id:
              Number(row.id),

            user1_id:
              Number(row.user1_id),

            user2_id:
              Number(row.user2_id),

            other_user_id:
              Number(row.other_user_id),

            other_username:
              row.other_username || "",

            other_email:
              row.other_email || "",

            other_profile_photo:
              row.other_profile_photo ||
              null,

            unread_count:
              Number(
                row.unread_count || 0
              ),

            last_message:
              row.last_message ||
              "",

            last_message_id:
              row.last_message_id
                ? Number(
                    row.last_message_id
                  )
                : null,

            last_message_at:
              row.last_message_at
                ? new Date(
                    Number(
                      row.last_message_at
                    )
                  ).toISOString()
                : null

          }));


        return json({

          success: true,

          conversations

        });

      }


      /* ======================================================
         PRIVATE INBOX

         IMPORTANT:
         The frontend app.js calls:

           GET /api/messages/inbox

         We also support:

           GET /api/inbox

         Returns:
         - users
         - inbox
         - total_unread
         - unread_count
      ====================================================== */

      if (
        (
          path === "/api/messages/inbox" ||
          path === "/api/inbox"
        ) &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        /*
         * Find the latest incoming message
         * from each user.
         *
         * This makes the profile inbox show
         * users who have actually sent a
         * private message to the current user.
         */

        const result =
          await env.DB.prepare(`
            SELECT

              u.id
                AS sender_id,

              u.username
                AS sender_username,

              u.email
                AS sender_email,

              u.profile_photo
                AS sender_profile_photo,


              latest.message
                AS last_message,

              latest.id
                AS last_message_id,

              latest.created_at
                AS last_message_at,

              latest.conversation_id
                AS conversation_id,


              (
                SELECT COUNT(*)

                FROM messages unread

                WHERE unread.sender_id = u.id

                  AND unread.receiver_id = ?

                  AND unread.id >
                    COALESCE(
                      (
                        SELECT last_read_message_id

                        FROM private_message_reads pmr

                        WHERE pmr.user_id = ?

                          AND pmr.other_user_id = u.id

                        LIMIT 1
                      ),
                      0
                    )
              ) AS unread_count


            FROM users u


            INNER JOIN (

              SELECT

                m.sender_id,

                m.receiver_id,

                m.id,

                m.message,

                m.created_at,

                m.conversation_id


              FROM messages m


              INNER JOIN (

                SELECT

                  sender_id,

                  MAX(id) AS max_id

                FROM messages

                WHERE receiver_id = ?

                GROUP BY sender_id

              ) latest_ids

                ON latest_ids.max_id = m.id


              WHERE m.receiver_id = ?

            ) latest

              ON latest.sender_id = u.id


            WHERE u.id != ?


            ORDER BY

              latest.id DESC
          `)
            .bind(
              currentUser.id,
              currentUser.id,

              currentUser.id,
              currentUser.id,

              currentUser.id
            )
            .all();


        const inbox =
          (
            result.results || []
          ).map(row => {

            const createdAt =
              Number(
                row.last_message_at
              );


            const lastMessageAt =
              Number.isFinite(
                createdAt
              ) &&
              createdAt > 0
                ? new Date(
                    createdAt
                  ).toISOString()
                : null;


            const unreadCount =
              Number(
                row.unread_count || 0
              );


            return {

              /*
               * app.js supports id
               */

              id:
                Number(
                  row.sender_id
                ),


              user_id:
                Number(
                  row.sender_id
                ),


              sender_id:
                Number(
                  row.sender_id
                ),


              username:
                row.sender_username ||
                "",


              sender_username:
                row.sender_username ||
                "",


              email:
                row.sender_email ||
                "",


              sender_email:
                row.sender_email ||
                "",


              profile_photo:
                row.sender_profile_photo ||
                null,


              sender_profile_photo:
                row.sender_profile_photo ||
                null,


              last_message:
                row.last_message ||
                "",


              last_message_id:
                Number(
                  row.last_message_id
                ),


              last_message_at:
                lastMessageAt,


              created_at:
                lastMessageAt,


              conversation_id:
                Number(
                  row.conversation_id
                ),


              unread_count:
                unreadCount,


              unread:
                unreadCount,


              sender: {

                id:
                  Number(
                    row.sender_id
                  ),

                username:
                  row.sender_username ||
                  "",

                email:
                  row.sender_email ||
                  "",

                profile_photo:
                  row.sender_profile_photo ||
                  null

              }

            };

          });


        const totalUnread =
          inbox.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.unread_count || 0
              ),
            0
          );


        return json({

          success: true,

          total_unread:
            totalUnread,

          unread_count:
            totalUnread,

          users:
            inbox,

          inbox:
            inbox

        });

      }


      /* ======================================================
         MARK PRIVATE MESSAGES AS READ

         Frontend app.js calls:

           POST /api/messages/read

         We also support:

           POST /api/inbox/read

         Body:
         {
           "user_id": 123,
           "message_id": 456
         }

         message_id is optional.
      ====================================================== */

      if (
        (
          path === "/api/messages/read" ||
          path === "/api/inbox/read"
        ) &&
        method === "POST"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const otherUserId =
          Number(
            body.user_id
          );


        let messageId =
          Number(
            body.message_id || 0
          );


        if (
          !Number.isInteger(
            otherUserId
          ) ||
          otherUserId <= 0
        ) {

          return json(
            {
              success: false,
              error:
                "Invalid user_id."
            },
            400
          );

        }


        if (
          otherUserId ===
          currentUser.id
        ) {

          return json(
            {
              success: false,
              error:
                "Invalid user_id."
            },
            400
          );

        }


        const otherUser =
          await env.DB.prepare(`
            SELECT id

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(
              otherUserId
            )
            .first();


        if (!otherUser) {

          return json(
            {
              success: false,
              error:
                "User not found."
            },
            404
          );

        }


        /* ----------------------------------------------------
           If message_id wasn't supplied,
           use latest received message.
        ---------------------------------------------------- */

        if (
          !Number.isInteger(
            messageId
          ) ||
          messageId <= 0
        ) {

          const latest =
            await env.DB.prepare(`
              SELECT id

              FROM messages

              WHERE sender_id = ?

                AND receiver_id = ?

              ORDER BY id DESC

              LIMIT 1
            `)
              .bind(
                otherUserId,
                currentUser.id
              )
              .first();


          if (latest) {

            messageId =
              Number(
                latest.id
              );

          } else {

            messageId = 0;

          }

        }


        /* ----------------------------------------------------
           Validate supplied message_id.
        ---------------------------------------------------- */

        if (
          messageId > 0
        ) {

          const targetMessage =
            await env.DB.prepare(`
              SELECT id

              FROM messages

              WHERE id = ?

                AND sender_id = ?

                AND receiver_id = ?

              LIMIT 1
            `)
              .bind(
                messageId,
                otherUserId,
                currentUser.id
              )
              .first();


          if (!targetMessage) {

            return json(
              {
                success: false,
                error:
                  "Message not found."
              },
              404
            );

          }

        }


        /* ----------------------------------------------------
           Save / update read state.
        ---------------------------------------------------- */

        await env.DB.prepare(`
          INSERT INTO private_message_reads
          (
            user_id,
            other_user_id,
            last_read_message_id
          )

          VALUES (?, ?, ?)

          ON CONFLICT(user_id, other_user_id)

          DO UPDATE SET
            last_read_message_id =
              CASE

                WHEN excluded.last_read_message_id >
                     private_message_reads.last_read_message_id

                THEN excluded.last_read_message_id

                ELSE private_message_reads.last_read_message_id

              END
        `)
          .bind(
            currentUser.id,
            otherUserId,
            messageId
          )
          .run();


        return json({

          success: true,

          user_id:
            currentUser.id,

          other_user_id:
            otherUserId,

          last_read_message_id:
            messageId

        });

      }


      /* ======================================================
         PRIVATE SEND MESSAGE
      ====================================================== */

      if (
        path === "/api/messages" &&
        method === "POST"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const receiverId =
          Number(
            body.receiver_id
          );


        const message =
          String(
            body.message || ""
          ).trim();


        if (
          !Number.isInteger(
            receiverId
          ) ||
          receiverId <= 0
        ) {

          return json(
            {
              success: false,
              error:
                "Invalid receiver_id."
            },
            400
          );

        }


        if (!message) {

          return json(
            {
              success: false,
              error:
                "Message cannot be empty."
            },
            400
          );

        }


        if (
          message.length >
          10000
        ) {

          return json(
            {
              success: false,
              error:
                "Message is too long."
            },
            400
          );

        }


        if (
          receiverId ===
          currentUser.id
        ) {

          return json(
            {
              success: false,
              error:
                "You cannot send a private message to yourself."
            },
            400
          );

        }


        const receiver =
          await env.DB.prepare(`
            SELECT id

            FROM users

            WHERE id = ?

            LIMIT 1
          `)
            .bind(
              receiverId
            )
            .first();


        if (!receiver) {

          return json(
            {
              success: false,
              error:
                "Receiver not found."
            },
            404
          );

        }


        const conversation =
          await createConversation(
            env.DB,
            currentUser.id,
            receiverId
          );


        if (!conversation) {

          return json(
            {
              success: false,
              error:
                "Could not create conversation."
            },
            500
          );

        }


        const createdAt =
          Date.now();


        const result =
          await env.DB.prepare(`
            INSERT INTO messages
            (
              conversation_id,
              sender_id,
              receiver_id,
              message,
              created_at
            )

            VALUES (?, ?, ?, ?, ?)
          `)
            .bind(
              conversation.id,
              currentUser.id,
              receiverId,
              message,
              createdAt
            )
            .run();


        const messageId =
          Number(
            result.meta.last_row_id
          );


        const savedMessage =
          await env.DB.prepare(`
            SELECT

              m.id,

              m.conversation_id,

              m.sender_id,

              m.receiver_id,

              m.message,

              m.created_at,

              u.username
                AS sender_username,

              u.email
                AS sender_email,

              u.profile_photo
                AS sender_profile_photo

            FROM messages m

            INNER JOIN users u
              ON u.id = m.sender_id

            WHERE m.id = ?

            LIMIT 1
          `)
            .bind(
              messageId
            )
            .first();


        return json({

          success: true,

          message:
            formatPrivateMessage(
              savedMessage
            )

        }, 201);

      }


      /* ======================================================
         PRIVATE GET MESSAGES
      ====================================================== */

      if (
        path === "/api/messages" &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const targetId =
          Number(
            url.searchParams.get(
              "user_id"
            )
          );


        if (
          !Number.isInteger(
            targetId
          ) ||
          targetId <= 0
        ) {

          return json(
            {
              success: false,
              error:
                "Invalid user_id."
            },
            400
          );

        }


        if (
          targetId ===
          currentUser.id
        ) {

          return json({

            success: true,

            messages: []

          });

        }


        const conversation =
          await getConversation(
            env.DB,
            currentUser.id,
            targetId
          );


        if (!conversation) {

          return json({

            success: true,

            messages: []

          });

        }


        const result =
          await env.DB.prepare(`
            SELECT

              m.id,

              m.conversation_id,

              m.sender_id,

              m.receiver_id,

              m.message,

              m.created_at,

              u.username
                AS sender_username,

              u.email
                AS sender_email,

              u.profile_photo
                AS sender_profile_photo

            FROM messages m

            INNER JOIN users u
              ON u.id = m.sender_id

            WHERE
              m.conversation_id = ?

            ORDER BY
              m.id ASC

            LIMIT 500
          `)
            .bind(
              conversation.id
            )
            .all();


        const messages =
          (
            result.results || []
          ).map(
            formatPrivateMessage
          );


        return json({

          success: true,

          messages

        });

      }


      /* ======================================================
         DELETE PRIVATE MESSAGE
      ====================================================== */

      const privateDeleteMatch =
        path.match(
          /^\/api\/messages\/(\d+)$/
        );


      if (
        privateDeleteMatch &&
        method === "DELETE"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const messageId =
          Number(
            privateDeleteMatch[1]
          );


        const message =
          await env.DB.prepare(`
            SELECT

              id,

              sender_id,

              receiver_id

            FROM messages

            WHERE id = ?

            LIMIT 1
          `)
            .bind(
              messageId
            )
            .first();


        if (!message) {

          return json(
            {
              success: false,
              error:
                "Message not found."
            },
            404
          );

        }


        if (
          Number(message.sender_id) !==
            Number(currentUser.id) &&

          Number(message.receiver_id) !==
            Number(currentUser.id)
        ) {

          return json(
            {
              success: false,
              error:
                "You cannot delete this message."
            },
            403
          );

        }


        await env.DB.prepare(`
          DELETE FROM messages

          WHERE id = ?
        `)
          .bind(
            messageId
          )
          .run();


        return json({

          success: true

        });

      }


      /* ======================================================
         PUBLIC GROUP INFO
      ====================================================== */

      if (
        path === "/api/group" &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        return json({

          success: true,

          group: {

            id:
              "global",

            name:
              "Public Group Chat",

            status:
              "Everyone"

          }

        });

      }


      /* ======================================================
         PUBLIC GROUP - GET MESSAGES
      ====================================================== */

      if (
        path === "/api/group/messages" &&
        method === "GET"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const result =
          await env.DB.prepare(`
            SELECT

              gm.id,

              gm.sender_id,

              gm.message,

              gm.created_at,

              u.username
                AS sender_username,

              u.email
                AS sender_email,

              u.profile_photo
                AS sender_profile_photo

            FROM global_group_messages gm

            INNER JOIN users u
              ON u.id = gm.sender_id

            ORDER BY
              gm.id ASC

            LIMIT 200
          `)
            .all();


        const messages =
          (
            result.results || []
          )
            .map(
              formatGroupMessage
            );


        return json({

          success: true,

          messages

        });

      }


      /* ======================================================
         PUBLIC GROUP - SEND MESSAGE
      ====================================================== */

      if (
        path === "/api/group/messages" &&
        method === "POST"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        let body;


        try {

          body =
            await request.json();

        } catch {

          return json(
            {
              success: false,
              error:
                "Invalid JSON."
            },
            400
          );

        }


        const message =
          String(
            body.message || ""
          ).trim();


        if (!message) {

          return json(
            {
              success: false,
              error:
                "Message cannot be empty."
            },
            400
          );

        }


        if (
          message.length >
          10000
        ) {

          return json(
            {
              success: false,
              error:
                "Message is too long."
            },
            400
          );

        }


        const createdAt =
          Date.now();


        const result =
          await env.DB.prepare(`
            INSERT INTO global_group_messages
            (
              sender_id,
              message,
              created_at
            )

            VALUES (?, ?, ?)
          `)
            .bind(
              currentUser.id,
              message,
              createdAt
            )
            .run();


        const messageId =
          Number(
            result.meta.last_row_id
          );


        const savedMessage =
          await env.DB.prepare(`
            SELECT

              gm.id,

              gm.sender_id,

              gm.message,

              gm.created_at,

              u.username
                AS sender_username,

              u.email
                AS sender_email,

              u.profile_photo
                AS sender_profile_photo

            FROM global_group_messages gm

            INNER JOIN users u
              ON u.id = gm.sender_id

            WHERE gm.id = ?

            LIMIT 1
          `)
            .bind(
              messageId
            )
            .first();


        return json({

          success: true,

          message:
            formatGroupMessage(
              savedMessage
            )

        }, 201);

      }


      /* ======================================================
         DELETE GROUP MESSAGE
      ====================================================== */

      const groupDeleteMatch =
        path.match(
          /^\/api\/group\/messages\/(\d+)$/
        );


      if (
        groupDeleteMatch &&
        method === "DELETE"
      ) {

        const currentUser =
          await getUserFromRequest(
            request,
            env.DB
          );


        if (!currentUser) {

          return json(
            {
              success: false,
              error:
                "Unauthorized."
            },
            401
          );

        }


        const messageId =
          Number(
            groupDeleteMatch[1]
          );


        const message =
          await env.DB.prepare(`
            SELECT

              id,

              sender_id

            FROM global_group_messages

            WHERE id = ?

            LIMIT 1
          `)
            .bind(
              messageId
            )
            .first();


        if (!message) {

          return json(
            {
              success: false,
              error:
                "Message not found."
            },
            404
          );

        }


        if (
          Number(message.sender_id) !==
          Number(currentUser.id)
        ) {

          return json(
            {
              success: false,
              error:
                "You can only delete your own message."
            },
            403
          );

        }


        await env.DB.prepare(`
          DELETE FROM global_group_messages

          WHERE id = ?
        `)
          .bind(
            messageId
          )
          .run();


        return json({

          success: true

        });

      }


      /* ======================================================
         OLD USER-CREATED GROUP API DISABLED
      ====================================================== */

      if (
        path === "/api/groups" ||
        path.startsWith(
          "/api/groups/"
        )
      ) {

        return json(
          {
            success: false,
            error:
              "User-created groups are disabled. Use Public Group Chat."
          },
          404
        );

      }


      /* ======================================================
         VOICE / VIDEO CALL API DISABLED
      ====================================================== */

      if (
        path === "/api/call" ||
        path.startsWith(
          "/api/call/"
        ) ||
        path === "/api/calls" ||
        path.startsWith(
          "/api/calls/"
        )
      ) {

        return json(
          {
            success: false,
            error:
              "Voice and video calls are disabled."
          },
          404
        );

      }


      /* ======================================================
         UNKNOWN API
      ====================================================== */

      return json(
        {
          success: false,
          error:
            "API endpoint not found."
        },
        404
      );


    } catch (error) {

      console.error(
        "WORKER ERROR:",
        error
      );


      return json(
        {
          success: false,

          error:
            "Internal server error.",

          detail:
            error?.message ||
            String(error)

        },
        500
      );

    }

  }

};
