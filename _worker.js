export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const SUPABASE_URL = "https://arrhyuolxiqayvibstid.supabase.co";

    // Frontend က /api နဲ့လာရင် Supabase ဆီကို ပို့ပေးမယ်
    if (url.pathname.startsWith("/api/")) {
      const targetPath = url.pathname.replace(/^\/api/, '');
      const targetUrl = `${SUPABASE_URL}${targetPath}${url.search}`;

      const newHeaders = new Headers(request.headers);
      newHeaders.set("Host", "arrhyuolxiqayvibstid.supabase.co");

      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? await request.clone().arrayBuffer() : undefined,
        redirect: "follow"
      });

      try {
        const response = await fetch(modifiedRequest);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ကျန်တဲ့ Static Asset တွေအတွက် Cloudflare Pages ရဲ့ မူလ Fetch ကို သုံးမယ်
    return env.ASSETS.fetch(request);
  }
};
