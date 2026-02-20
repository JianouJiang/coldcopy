interface Context {
  request: Request;
  env: any;
}

export async function onRequest(context: Context): Promise<Response> {
  try {
    console.log('Echo endpoint called');

    const body = await context.request.json();
    console.log('Body received:', body);

    return new Response(
      JSON.stringify({
        received: body,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: String(error),
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
