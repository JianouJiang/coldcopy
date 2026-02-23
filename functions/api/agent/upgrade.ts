import { getAuthUser } from '../../lib/auth';

// Admin emails — always enterprise, cannot be downgraded
const ADMIN_EMAILS = ['jianou.works@gmail.com'];

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const body = await request.json();
  let { plan } = body;

  if (!['free', 'pro', 'enterprise'].includes(plan)) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Admin users are always enterprise
  const userRow: any = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(user.id).first();
  if (userRow && ADMIN_EMAILS.includes(userRow.email)) {
    plan = 'enterprise';
  }

  // TEST MODE: In testing stage, upgrade is instant and free.
  // In production, this would verify Stripe payment before updating.
  await env.DB.prepare("UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(plan, user.id).run();

  return new Response(JSON.stringify({
    success: true,
    plan,
    test_mode: true,
    message: 'Plan updated (test mode — no payment required)',
  }), { headers: { 'content-type': 'application/json' } });
}
