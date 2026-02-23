import { getAuthUser } from '../../../../../../lib/auth';

// PATCH — update the suggested reply text before approval
export async function onRequestPatch(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const reply: any = await env.DB.prepare(
    "SELECT id, ai_reply_status FROM email_replies WHERE id = ? AND campaign_id = ?"
  ).bind(params.rid, params.id).first();
  if (!reply) return new Response(JSON.stringify({ error: 'Reply not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (reply.ai_reply_status !== 'draft') {
    return new Response(JSON.stringify({ error: 'Only draft replies can be edited' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const body = await request.json();
  if (body.ai_suggested_reply !== undefined) {
    await env.DB.prepare('UPDATE email_replies SET ai_suggested_reply = ? WHERE id = ?')
      .bind(body.ai_suggested_reply, params.rid).run();
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
