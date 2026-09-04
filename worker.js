export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ဇယား အလိုအလျောက် ဆောက်ပေးရန်
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          email TEXT UNIQUE,
          password TEXT
        )
      `).run();
    } catch (e) {}

    if (request.method === "POST" && url.pathname === "/api/register") {
      try {
        const body = await request.json();
        const username = body.username;
        const email = body.email;
        const password = body.password;

        if (!username || !email || !password) {
          return new Response(JSON.stringify({ error: "All fields are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        await env.DB.prepare(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
        ).bind(username, email, password).run();

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Email already exists or invalid data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (request.method === "POST" && url.pathname === "/api/login") {
      try {
        const body = await request.json();
        const email = body.email;
        const password = body.password;

        const user = await env.DB.prepare(
          "SELECT id, username, email FROM users WHERE email = ? AND password = ?"
        ).bind(email, password).first();

        if (!user) {
          return new Response(JSON.stringify({ error: "Invalid email or password" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ success: true, user }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (request.method === "GET" && url.pathname === "/api/users") {
      try {
        const { results } = await env.DB.prepare("SELECT username, email FROM users").all();
        return new Response(JSON.stringify({ users: results }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
