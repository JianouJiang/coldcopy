import { getAuthUser } from '../../lib/auth';

// GET /api/agent/bounces — List all bounced addresses for the current user
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(
    'SELECT b.id, b.email_address, b.bounce_type, b.reason, b.source_campaign_id, b.created_at, c.name as campaign_name FROM email_bounces b LEFT JOIN campaigns c ON b.source_campaign_id = c.id WHERE b.user_id = ? ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
  ).bind(user.id, limit, offset).all();

  const countRow: any = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM email_bounces WHERE user_id = ?'
  ).bind(user.id).first();

  return new Response(JSON.stringify({
    bounces: results || [],
    total: countRow?.total || 0,
    page,
    limit,
  }), { headers: { 'content-type': 'application/json' } });
}
