export async function onRequest(request: Request, env: any): Promise<Response> {
  return new Response(JSON.stringify({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
  }, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
