import { clearAuthCookie } from '../../../lib/auth';

export async function onRequestPost(): Promise<Response> {
  const response = new Response(JSON.stringify({ success: true }),
    { headers: { 'content-type': 'application/json' } });
  return clearAuthCookie(response);
}
