import { verifyPassword, createJWT, setAuthCookie } from '../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }),
        { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const user: any = await env.DB.prepare(
      'SELECT id, email, password_hash, name, company_intro FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const token = await createJWT({ sub: user.id, email: user.email }, env.AGENT_JWT_SECRET);

    const response = new Response(JSON.stringify({
      id: user.id, email: user.email, name: user.name, company_intro: user.company_intro
    }), { headers: { 'content-type': 'application/json' } });

    return setAuthCookie(response, token);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Login failed' }),
      { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
