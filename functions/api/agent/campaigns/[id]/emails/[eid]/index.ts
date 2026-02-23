import { getAuthUser } from '../../../../../../lib/auth';

export async function onRequestPatch(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const email: any = await env.DB.prepare('SELECT id, status FROM outbound_emails WHERE id = ? AND campaign_id = ?').bind(params.eid, params.id).first();
  if (!email) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (email.status !== 'draft') return new Response(JSON.stringify({ error: 'Only draft emails can be edited' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const body = await request.json();
  const updates: string[] = [];
  const values: any[] = [];

  if (body.subject) { updates.push('subject = ?'); values.push(body.subject); }
  if (body.body) { updates.push('body = ?'); values.push(body.body); }

  if (updates.length === 0) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400, headers: { 'content-type': 'application/json' } });

  values.push(params.eid);
  await env.DB.prepare(`UPDATE outbound_emails SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
