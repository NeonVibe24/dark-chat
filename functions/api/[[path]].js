export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const SUPABASE_URL = "https://arrhyuolxiqayvibstid.supabase.co";
  
  const targetPath = url.pathname.replace(/^\/api/, '');
  const targetUrl = `${SUPABASE_URL}${targetPath}${url.search}`;

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.clone().arrayBuffer() : undefined,
    redirect: "follow"
  });

  try {
    const response = await fetch(modifiedRequest);
    
    // Response body အလွတ်ဖြစ်နေရင် (ဥပမာ 204 No Content) JSON parse လုပ်လို့ error တက်တာကို ကာကွယ်ရန်
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    
    if (!text) {
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

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
