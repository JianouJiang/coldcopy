import { getAuthUser } from '../../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify campaign ownership
  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const { results } = await env.DB.prepare(
    'SELECT id, company_name, company_url, contact_name, contact_email, contact_title, status, source, created_at FROM leads WHERE campaign_id = ? ORDER BY created_at DESC'
  ).bind(params.id).all();

  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}
