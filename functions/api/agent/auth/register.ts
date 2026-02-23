import { generateId, hashPassword, createJWT, setAuthCookie } from '../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  try {
    const { email, password, name } = await request.json();

    // Validate
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }),
        { status: 400, headers: { 'content-type': 'application/json' } });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'content-type': 'application/json' } });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // Check existing
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { 'content-type': 'application/json' } });
    }

    // Create user
    const id = generateId();
    const passwordHash = await hashPassword(password);
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).bind(id, email.toLowerCase(), passwordHash, name || null).run();

    // Create JWT
    const token = await createJWT({ sub: id, email: email.toLowerCase() }, env.AGENT_JWT_SECRET);

    const response = new Response(JSON.stringify({
      id, email: email.toLowerCase(), name: name || null
    }), { status: 201, headers: { 'content-type': 'application/json' } });

    return setAuthCookie(response, token);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Registration failed' }),
      { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
