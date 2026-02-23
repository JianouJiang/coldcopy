import { getAuthUser } from '../../../lib/auth';

// GET — read platform settings (any authenticated user can check status)
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const { results } = await env.DB.prepare('SELECT key, value FROM platform_settings').all();
  const settings: Record<string, string> = {};
  let hasCredentials = false;

  for (const row of (results || []) as any[]) {
    if (row.key === 'google_client_id' || row.key === 'google_client_secret') {
      hasCredentials = true;
    }
    // Mask secrets — only show first 8 and last 4 chars
    if (row.key.toLowerCase().includes('secret')) {
      const v = row.value;
      settings[row.key] = v.length > 12 ? v.slice(0, 8) + '...' + v.slice(-4) : '****';
    } else {
      settings[row.key] = row.value;
    }
  }

  return new Response(JSON.stringify({ settings, has_credentials: hasCredentials }), { headers: { 'content-type': 'application/json' } });
}

// POST — save platform settings
// Allowed if: no credentials exist yet (first-time setup) OR user is the first registered user (admin)
export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Check if credentials already exist
  const existing: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM platform_settings WHERE key IN ('google_client_id', 'google_client_secret')"
  ).first();

  const credentialsExist = existing?.count > 0;

  if (credentialsExist) {
    // Only admin (first user) can update existing credentials
    const first: any = await env.DB.prepare(
      'SELECT id FROM users ORDER BY created_at ASC LIMIT 1'
    ).first();
    if (first?.id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only the admin can update existing credentials' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
  }

  const body = await request.json();
  const { google_client_id, google_client_secret } = body;

  if (google_client_id !== undefined) {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    ).bind('google_client_id', google_client_id.trim()).run();
  }

  if (google_client_secret !== undefined) {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    ).bind('google_client_secret', google_client_secret.trim()).run();
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
