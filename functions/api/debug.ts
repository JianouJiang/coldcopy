interface Context {
  request: Request;
  env: {
    DB: D1Database;
    RATE_LIMIT: KVNamespace;
    ANTHROPIC_API_KEY: string;
  };
}

export async function onRequest(context: Context): Promise<Response> {
  try {
    const env = context.env;

    // Test bindings
    const checks = {
      apiKeyPresent: !!env.ANTHROPIC_API_KEY,
      dbAvailable: !!env.DB,
      kvAvailable: !!env.RATE_LIMIT,
    };

    // Try a simple DB query
    let dbWorks = false;
    try {
      const result = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM sessions'
      ).first();
      dbWorks = !!result;
    } catch (e) {
      checks['dbError'] = String(e);
    }

    // Try a KV operation
    let kvWorks = false;
    try {
      await env.RATE_LIMIT.put('test_key', 'test_value');
      const val = await env.RATE_LIMIT.get('test_key');
      kvWorks = val === 'test_value';
    } catch (e) {
      checks['kvError'] = String(e);
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        checks,
        dbWorks,
        kvWorks,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: String(error),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
