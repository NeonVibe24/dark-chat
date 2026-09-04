export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const SUPABASE_URL = "https://arrhyuolxiqayvibstid.supabase.co";
  
  const targetPath = url.pathname.replace(/^\/api/, '');
  const targetUrl = `${SUPABASE_URL}${targetPath}${url.search}`;

  // Headers အသစ်ဆောက်လုပ်ခြင်း (Cloudflare Host အစား Supabase Host ကို သုံးရန်)
  const newHeaders = new Headers(request.headers);
  newHeaders.set("Host", "arrhyuolxiqayvibstid.supabase.co");
  
  // လိုအပ်ပါက origin ကိုပါ ပြင်ဆင်ခြင်း
  if (newHeaders.has("Origin")) {
    newHeaders.set("Origin", SUPABASE_URL);
  }

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
