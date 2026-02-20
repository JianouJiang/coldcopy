interface SessionResponse {
  plan: string;
  generationsUsed: number;
  maxGenerations: number;
  canGenerate: boolean;
}

interface Context {
  request: Request;
  env: {
    DB: D1Database;
  };
}

/**
 * GET /api/session
 * Returns current session info or default anonymous state
 */
export async function onRequest(context: Context): Promise<Response> {
  const { request, env } = context;
  // Only allow GET
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('coldcopy_session='));

    // No session cookie: return default anonymous state
    if (!sessionCookie) {
      const response: SessionResponse = {
        plan: 'free',
        generationsUsed: 0,
        maxGenerations: 1,
        canGenerate: true,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Extract session ID from cookie
    const sessionId = sessionCookie.split('=')[1].trim();

    // Query database for session
    const result = await env.DB.prepare(
      `SELECT plan, generations_used, max_generations FROM sessions WHERE id = ? LIMIT 1`
    )
      .bind(sessionId)
      .first();

    if (!result) {
      // Session ID in cookie but not in DB - return default
      const response: SessionResponse = {
        plan: 'free',
        generationsUsed: 0,
        maxGenerations: 1,
        canGenerate: true,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Return actual session state
    const session = result as any;
    const response: SessionResponse = {
      plan: session.plan,
      generationsUsed: session.generations_used,
      maxGenerations: session.max_generations,
      canGenerate: session.generations_used < session.max_generations,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Session error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'Failed to retrieve session',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
