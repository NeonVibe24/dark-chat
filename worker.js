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

  const data =
    new TextEncoder().encode(password);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hash)
  )
    .map(
      b => b.toString(16).padStart(2, "0")
    )
    .join("");
}


/* =========================================================
   RANDOM TOKEN
========================================================= */

function randomToken() {

  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(
      b => b.toString(16).padStart(2, "0")
    )
    .join("");
}


/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initDatabase(db) {

  await db.batch([

    /* =====================================================
       USERS
    ===================================================== */

    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `),

    /* =====================================================
       SESSIONS
    ===================================================== */

    db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        FOREIGN KEY (user_id)
          REFERENCES users(id)
      )
    `),

    /* =====================================================
       PRIVATE CONVERSATIONS
    ===================================================== */

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

    /* =====================================================
       PRIVATE MESSAGES
    ===================================================== */

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

    /* =====================================================
       GROUPS
    ===================================================== */

    db.prepare(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        creator_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (creator_id)
          REFERENCES users(id)
      )
    `),

    /* =====================================================
       GROUP MEMBERS
    ===================================================== */

    db.prepare(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at INTEGER NOT NULL,
        UNIQUE(group_id, user_id),
        FOREIGN KEY (group_id)
          REFERENCES groups(id)
          ON DELETE CASCADE,
        FOREIGN KEY (user_id)
          REFERENCES users(id)
      )
    `),

    /* =====================================================
       GROUP MESSAGES
    ===================================================== */

    db.prepare(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (group_id)
          REFERENCES groups(id)
          ON DELETE CASCADE,
        FOREIGN KEY (sender_id)
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
      column =>
        column.name === "profile_photo"
    );


  if (!hasProfilePhoto) {

    await db
      .prepare(`
        ALTER TABLE users
        ADD COLUMN profile_photo TEXT
      `)
      .run();

  }


  /* =======================================================
     OLD CALL SYSTEM
     Remove old call table because calls are no longer used.
  ======================================================= */

  try {

    await db
      .prepare(`
        DROP TABLE IF EXISTS call_signals
      `)
      .run();

  } catch (error) {

    console.log(
      "Old call_signals cleanup skipped:",
      error?.message
    );

  }

}


/* =========================================================
   AUTH USER
========================================================= */

async function getUserFromRequest(
  request,
  env
) {

  if (!env.DB) {
    return null;
  }

  const auth =
    request.headers.get(
      "Authorization"
    );

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
   PRIVATE CONVERSATION
========================================================= */

async function getConversation(
  db,
  userA,
  userB
) {

  const a =
    Math.min(
      Number(userA),
      Number(userB)
    );

  const b =
    Math.max(
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

  const a =
    Math.min(
      Number(userA),
      Number(userB)
    );

  const b =
    Math.max(
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
   GROUP HELPERS
========================================================= */

async function isGroupMember(
  db,
  groupId,
  userId
) {

  const member =
    await db
      .prepare(`
        SELECT id
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        LIMIT 1
      `)
      .bind(
        groupId,
        userId
      )
      .first();

  return !!member;
}


async function getGroup(
  db,
  groupId
) {

  return await db
    .prepare(`
      SELECT
        g.id,
        g.name,
        g.creator_id,
        g.created_at,

        u.username AS creator_username,
        u.email AS creator_email,
        u.profile_photo AS creator_profile_photo

      FROM groups g

      INNER JOIN users u
        ON u.id = g.creator_id

      WHERE g.id = ?

      LIMIT 1
    `)
    .bind(groupId)
    .first();
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

    if (
      request.method === "OPTIONS"
    ) {

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
            error:
              "D1 binding DB not found"
          }, 500);

        }

        await initDatabase(
          env.DB
        );

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
            error:
              "Database is not connected"
          }, 500);

        }

        await initDatabase(
          env.DB
        );

        const body =
          await request.json();

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


        if (
          password.length < 6
        ) {

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
            error:
              "Email already exists"
          }, 409);

        }


        const passwordHash =
          await hashPassword(
            password
          );


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
          user_id:
            result.meta.last_row_id
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
            error:
              "Database is not connected"
          }, 500);

        }

        await initDatabase(
          env.DB
        );

        const body =
          await request.json();

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
          !email ||
          !password
        ) {

          return json({
            success: false,
            error:
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
          await hashPassword(
            password
          );


        if (
          user.password !==
          passwordHash
        ) {

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
              user.profile_photo ||
              null
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
          request.headers.get(
            "Authorization"
          );

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
            error:
              "Unauthorized"
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
            error:
              "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const profilePhoto =
          body.profile_photo;


        if (
          profilePhoto !== null &&
          typeof profilePhoto !==
            "string"
        ) {

          return json({
            success: false,
            error:
              "Invalid profile photo"
          }, 400);

        }


        if (
          typeof profilePhoto ===
            "string" &&
          profilePhoto.length >
            1400000
        ) {

          return json({
            success: false,
            error:
              "Profile photo is too large"
          }, 413);

        }


        if (
          typeof profilePhoto ===
            "string" &&
          !profilePhoto.startsWith(
            "data:image/"
          )
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
            error:
              "Unauthorized"
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
            error:
              "Unauthorized"
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
              ORDER BY
                username COLLATE NOCASE ASC
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
        url.pathname.startsWith(
          "/api/users/"
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const id =
          Number(
            url.pathname
              .split("/")
              .pop()
          );


        if (!id) {

          return json({
            success: false,
            error:
              "Invalid user ID"
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
            error:
              "User not found"
          }, 404);

        }


        return json({
          success: true,
          user: target
        });

      }


      /* ===================================================
         CREATE PRIVATE CONVERSATION
      =================================================== */

      if (
        url.pathname ===
          "/api/conversations" &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const receiverId =
          Number(
            body.user_id
          );


        if (
          !receiverId ||
          receiverId === user.id
        ) {

          return json({
            success: false,
            error:
              "Invalid user ID"
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
              "User not found"
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
         GET PRIVATE CONVERSATIONS
      =================================================== */

      if (
        url.pathname ===
          "/api/conversations" &&
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
            error:
              "Unauthorized"
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
         SEND PRIVATE MESSAGE
      =================================================== */

      if (
        url.pathname ===
          "/api/messages" &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const receiverId =
          Number(
            body.receiver_id
          );

        const message =
          String(
            body.message || ""
          ).trim();


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


        if (
          receiverId === user.id
        ) {

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
            error:
              "Receiver not found"
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


        const result =
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
          success: true,
          message_id:
            result.meta.last_row_id
        });

      }


      /* ===================================================
         GET PRIVATE MESSAGES
      =================================================== */

      if (
        url.pathname ===
          "/api/messages" &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const otherUserId =
          Number(
            url.searchParams.get(
              "user_id"
            )
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
            .bind(
              conversation.id
            )
            .all();


        return json({
          success: true,
          messages:
            messages.results || []
        });

      }


      /* ===================================================
         DELETE PRIVATE MESSAGE
      =================================================== */

      if (
        url.pathname.startsWith(
          "/api/messages/"
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const id =
          Number(
            url.pathname
              .split("/")
              .pop()
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
         CREATE GROUP
      =================================================== */

      if (
        url.pathname ===
          "/api/groups" &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const body =
          await request.json();

        const name =
          String(
            body.name || ""
          ).trim();


        if (!name) {

          return json({
            success: false,
            error:
              "Group name is required"
          }, 400);

        }


        if (name.length > 100) {

          return json({
            success: false,
            error:
              "Group name is too long"
          }, 400);

        }


        const createdAt =
          Date.now();


        const result =
          await env.DB
            .prepare(`
              INSERT INTO groups
              (
                name,
                creator_id,
                created_at
              )
              VALUES (?, ?, ?)
            `)
            .bind(
              name,
              user.id,
              createdAt
            )
            .run();


        const groupId =
          result.meta.last_row_id;


        await env.DB
          .prepare(`
            INSERT INTO group_members
            (
              group_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, ?)
          `)
          .bind(
            groupId,
            user.id,
            createdAt
          )
          .run();


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        return json({
          success: true,
          group
        });

      }


      /* ===================================================
         GET GROUP LIST
      =================================================== */

      if (
        url.pathname ===
          "/api/groups" &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groups =
          await env.DB
            .prepare(`
              SELECT
                g.id,
                g.name,
                g.creator_id,
                g.created_at,

                u.username AS creator_username,
                u.profile_photo AS creator_profile_photo,

                (
                  SELECT COUNT(*)
                  FROM group_members gm2
                  WHERE gm2.group_id = g.id
                ) AS member_count

              FROM groups g

              INNER JOIN group_members gm
                ON gm.group_id = g.id

              INNER JOIN users u
                ON u.id = g.creator_id

              WHERE gm.user_id = ?

              ORDER BY g.id DESC
            `)
            .bind(user.id)
            .all();


        return json({
          success: true,
          groups:
            groups.results || []
        });

      }


      /* ===================================================
         GROUP DETAILS
         /api/groups/:id
      =================================================== */

      if (
        /^\/api\/groups\/\d+$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname.split("/").pop()
          );


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        const member =
          await isGroupMember(
            env.DB,
            groupId,
            user.id
          );


        if (!member) {

          return json({
            success: false,
            error:
              "You are not a member of this group"
          }, 403);

        }


        const members =
          await env.DB
            .prepare(`
              SELECT
                gm.id,
                gm.group_id,
                gm.user_id,
                gm.joined_at,

                u.username,
                u.email,
                u.profile_photo

              FROM group_members gm

              INNER JOIN users u
                ON u.id = gm.user_id

              WHERE gm.group_id = ?

              ORDER BY
                CASE
                  WHEN gm.user_id = ? THEN 0
                  ELSE 1
                END,
                u.username COLLATE NOCASE ASC
            `)
            .bind(
              groupId,
              group.creator_id
            )
            .all();


        return json({
          success: true,
          group,
          members:
            members.results || []
        });

      }


      /* ===================================================
         ADD GROUP MEMBER
         POST /api/groups/:id/members
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/members$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname
              .split("/")
              .filter(Boolean)[2]
          );


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        if (
          group.creator_id !== user.id
        ) {

          return json({
            success: false,
            error:
              "Only group creator can add members"
          }, 403);

        }


        const body =
          await request.json();

        const memberUserId =
          Number(
            body.user_id
          );


        if (!memberUserId) {

          return json({
            success: false,
            error:
              "user_id is required"
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
            .bind(
              memberUserId
            )
            .first();


        if (!target) {

          return json({
            success: false,
            error:
              "User not found"
          }, 404);

        }


        const alreadyMember =
          await isGroupMember(
            env.DB,
            groupId,
            memberUserId
          );


        if (alreadyMember) {

          return json({
            success: false,
            error:
              "User is already a member"
          }, 409);

        }


        await env.DB
          .prepare(`
            INSERT INTO group_members
            (
              group_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, ?)
          `)
          .bind(
            groupId,
            memberUserId,
            Date.now()
          )
          .run();


        return json({
          success: true,
          member: target
        });

      }


      /* ===================================================
         REMOVE GROUP MEMBER
         DELETE /api/groups/:id/members/:userId
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/members\/\d+$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);


        const groupId =
          Number(parts[2]);

        const memberUserId =
          Number(parts[4]);


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        if (
          group.creator_id !== user.id
        ) {

          return json({
            success: false,
            error:
              "Only group creator can remove members"
          }, 403);

        }


        if (
          memberUserId ===
          group.creator_id
        ) {

          return json({
            success: false,
            error:
              "Group creator cannot be removed"
          }, 400);

        }


        const result =
          await env.DB
            .prepare(`
              DELETE FROM group_members
              WHERE group_id = ?
              AND user_id = ?
            `)
            .bind(
              groupId,
              memberUserId
            )
            .run();


        return json({
          success: true,
          removed:
            result.meta.changes > 0
        });

      }


      /* ===================================================
         LEAVE GROUP
         DELETE /api/groups/:id/leave
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/leave$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname
              .split("/")
              .filter(Boolean)[2]
          );


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        if (
          group.creator_id === user.id
        ) {

          return json({
            success: false,
            error:
              "Group creator cannot leave the group"
          }, 400);

        }


        const result =
          await env.DB
            .prepare(`
              DELETE FROM group_members
              WHERE group_id = ?
              AND user_id = ?
            `)
            .bind(
              groupId,
              user.id
            )
            .run();


        return json({
          success: true,
          left:
            result.meta.changes > 0
        });

      }


      /* ===================================================
         DELETE GROUP
         DELETE /api/groups/:id
      =================================================== */

      if (
        /^\/api\/groups\/\d+$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname
              .split("/")
              .pop()
          );


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        if (
          group.creator_id !== user.id
        ) {

          return json({
            success: false,
            error:
              "Only group creator can delete the group"
          }, 403);

        }


        await env.DB.batch([

          env.DB.prepare(`
            DELETE FROM group_messages
            WHERE group_id = ?
          `).bind(groupId),

          env.DB.prepare(`
            DELETE FROM group_members
            WHERE group_id = ?
          `).bind(groupId),

          env.DB.prepare(`
            DELETE FROM groups
            WHERE id = ?
          `).bind(groupId)

        ]);


        return json({
          success: true
        });

      }


      /* ===================================================
         SEND GROUP MESSAGE
         POST /api/groups/:id/messages
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/messages$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname
              .split("/")
              .filter(Boolean)[2]
          );


        const member =
          await isGroupMember(
            env.DB,
            groupId,
            user.id
          );


        if (!member) {

          return json({
            success: false,
            error:
              "You are not a member of this group"
          }, 403);

        }


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        const body =
          await request.json();

        const message =
          String(
            body.message || ""
          ).trim();


        if (!message) {

          return json({
            success: false,
            error:
              "Message is required"
          }, 400);

        }


        if (
          message.length > 10000
        ) {

          return json({
            success: false,
            error:
              "Message is too long"
          }, 400);

        }


        const createdAt =
          Date.now();


        const result =
          await env.DB
            .prepare(`
              INSERT INTO group_messages
              (
                group_id,
                sender_id,
                message,
                created_at
              )
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              groupId,
              user.id,
              message,
              createdAt
            )
            .run();


        return json({
          success: true,
          message: {
            id:
              result.meta.last_row_id,
            group_id:
              groupId,
            sender_id:
              user.id,
            message,
            created_at:
              createdAt,

            sender: {
              id:
                user.id,
              username:
                user.username,
              email:
                user.email,
              profile_photo:
                user.profile_photo ||
                null
            }
          }
        });

      }


      /* ===================================================
         GET GROUP MESSAGES
         GET /api/groups/:id/messages
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/messages$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const groupId =
          Number(
            url.pathname
              .split("/")
              .filter(Boolean)[2]
          );


        const member =
          await isGroupMember(
            env.DB,
            groupId,
            user.id
          );


        if (!member) {

          return json({
            success: false,
            error:
              "You are not a member of this group"
          }, 403);

        }


        const messages =
          await env.DB
            .prepare(`
              SELECT
                gm.id,
                gm.group_id,
                gm.sender_id,
                gm.message,
                gm.created_at,

                u.username AS sender_username,
                u.email AS sender_email,
                u.profile_photo AS sender_profile_photo

              FROM group_messages gm

              INNER JOIN users u
                ON u.id = gm.sender_id

              WHERE gm.group_id = ?

              ORDER BY gm.id ASC
            `)
            .bind(groupId)
            .all();


        const result =
          (messages.results || [])
            .map(message => ({
              id:
                message.id,
              group_id:
                message.group_id,
              sender_id:
                message.sender_id,
              message:
                message.message,
              created_at:
                message.created_at,

              sender: {
                id:
                  message.sender_id,
                username:
                  message.sender_username,
                email:
                  message.sender_email,
                profile_photo:
                  message.sender_profile_photo ||
                  null
              }
            }));


        return json({
          success: true,
          messages: result
        });

      }


      /* ===================================================
         DELETE GROUP MESSAGE
         DELETE /api/groups/:id/messages/:messageId
      =================================================== */

      if (
        /^\/api\/groups\/\d+\/messages\/\d+$/.test(
          url.pathname
        ) &&
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
            error:
              "Unauthorized"
          }, 401);

        }


        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);


        const groupId =
          Number(parts[2]);

        const messageId =
          Number(parts[4]);


        const member =
          await isGroupMember(
            env.DB,
            groupId,
            user.id
          );


        if (!member) {

          return json({
            success: false,
            error:
              "You are not a member of this group"
          }, 403);

        }


        const group =
          await getGroup(
            env.DB,
            groupId
          );


        if (!group) {

          return json({
            success: false,
            error:
              "Group not found"
          }, 404);

        }


        const message =
          await env.DB
            .prepare(`
              SELECT
                id,
                sender_id
              FROM group_messages
              WHERE id = ?
              AND group_id = ?
              LIMIT 1
            `)
            .bind(
              messageId,
              groupId
            )
            .first();


        if (!message) {

          return json({
            success: false,
            error:
              "Message not found"
          }, 404);

        }


        if (
          message.sender_id !== user.id &&
          group.creator_id !== user.id
        ) {

          return json({
            success: false,
            error:
              "You cannot delete this message"
          }, 403);

        }


        await env.DB
          .prepare(`
            DELETE FROM group_messages
            WHERE id = ?
            AND group_id = ?
          `)
          .bind(
            messageId,
            groupId
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

        return env.ASSETS.fetch(
          request
        );

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
