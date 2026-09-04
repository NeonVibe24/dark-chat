export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // D1 Table အလိုအလျောက် ဖန်တီးပေးခြင်း
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT
      )
    `).run();

    if (request.method === "POST" && url.pathname === "/api/register") {
      try {
        const { username, email, password } = await request.json();
        if (!username || !email || !password) {
          return Response.json({ error: "All fields are required" }, { status: 400 });
        }
        
        await env.DB.prepare(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
        ).bind(username, email, password).run();

        return Response.json({ success: true });
      } catch (err) {
        return Response.json({ error: "Email already exists or invalid data" }, { status: 400 });
      }
    }

    if (request.method === "POST" && url.pathname === "/api/login") {
      try {
        const { email, password } = await request.json();
        const user = await env.DB.prepare(
          "SELECT id, username, email FROM users WHERE email = ? AND password = ?"
        ).bind(email, password).first();

        if (!user) {
          return Response.json({ error: "Invalid email or password" }, { status: 401 });
        }

        return Response.json({ success: true, user });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    if (request.method === "GET" && url.pathname === "/api/users") {
      try {
        const { results } = await env.DB.prepare("SELECT username, email FROM users").all();
        return Response.json({ users: results });
      } else {
        return Response.json({ error: "Failed to fetch users" }, { status: 500 });
      }
    }

    // Static Asset တွေအတွက် Cloudflare Pages ကို ပြန်လွှဲပေးရန်
    return env.ASSETS.fetch(request);
  }
};
