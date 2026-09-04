export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        service: "dark-chat",
        database: !!env.DB
      });
    }

    return new Response("Dark Chat Worker is running!", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
