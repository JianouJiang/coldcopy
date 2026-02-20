import { v4 as uuidv4 } from 'uuid';

interface Context {
  request: Request;
  env: {
    DB: D1Database;
    RATE_LIMIT: KVNamespace;
    ANTHROPIC_API_KEY: string;
  };
}

interface Env {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

interface GenerateRequest {
  companyName: string;
  targetJobTitle: string;
  problemTheyFace: string;
  yourProduct: string;
  keyBenefit: string;
  callToAction: string;
  tone: 'Professional' | 'Casual' | 'Direct' | 'Friendly';
}

interface EmailSequence {
  emails: Array<{
    subjectLineA: string;
    subjectLineB: string;
    body: string;
  }>;
}

/**
 * Validates Claude API JSON response
 * Strips preamble/postamble and validates structure
 */
function validateClaudeResponse(response: string): EmailSequence {
  // Strip text before first { and after last }
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate structure
  if (!Array.isArray(parsed.emails) || parsed.emails.length === 0) {
    throw new Error('Response missing emails array or array is empty');
  }

  // Validate each email has required fields
  parsed.emails.forEach((email: any, idx: number) => {
    if (!email.subjectLineA || typeof email.subjectLineA !== 'string') {
      throw new Error(`Email ${idx} missing subjectLineA`);
    }
    if (!email.subjectLineB || typeof email.subjectLineB !== 'string') {
      throw new Error(`Email ${idx} missing subjectLineB`);
    }
    if (!email.body || typeof email.body !== 'string') {
      throw new Error(`Email ${idx} missing body`);
    }
  });

  return parsed as EmailSequence;
}

/**
 * Gets or creates a session for the user
 * Uses cookies to track anonymous sessions
 */
async function getOrCreateSession(
  request: Request,
  env: Env
): Promise<{ sessionId: string; isNew: boolean }> {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('coldcopy_session='));

  if (sessionCookie) {
    const sessionId = sessionCookie.split('=')[1].trim();
    return { sessionId, isNew: false };
  }

  // Lazy session creation: create on first generation request
  const newSessionId = uuidv4();
  await env.DB.prepare(`
    INSERT INTO sessions (id, plan, generations_used, max_generations)
    VALUES (?, 'free', 0, 1)
  `).bind(newSessionId).run();

  return { sessionId: newSessionId, isNew: true };
}

/**
 * Checks rate limit via KV
 * Returns true if generation is allowed
 */
async function checkRateLimit(
  sessionId: string,
  env: Env
): Promise<boolean> {
  const key = `rate_limit:${sessionId}`;
  const count = await env.RATE_LIMIT.get(key);

  if (count === null) {
    // First request in this hour
    await env.RATE_LIMIT.put(key, '1', { expirationTtl: 3600 });
    return true;
  }

  const currentCount = parseInt(count, 10);
  // Limit to 1 generation per hour per session
  if (currentCount >= 1) {
    return false;
  }

  await env.RATE_LIMIT.put(key, String(currentCount + 1), {
    expirationTtl: 3600,
  });
  return true;
}

/**
 * Calls Claude Haiku 4.5 API to generate email sequence
 * Includes 25-second timeout and retry logic
 */
async function generateWithClaude(
  input: GenerateRequest,
  env: Env
): Promise<EmailSequence> {
  const systemPrompt = `You are an expert cold email copywriter for B2B SaaS products.
Your task is to generate a 7-email cold email sequence that:
- Opens doors (gets meetings, not spam-folder fodder)
- Uses specific SaaS hooks (trial CTAs, demo hooks, technical credibility)
- Is copy-paste ready for tools like Lemlist, Instantly, Apollo
- Includes A/B subject line variants for each email

Generate exactly 7 emails. Each email must have two A/B subject line variants and a body.

IMPORTANT: Respond with ONLY valid JSON, no preamble or explanation.
Do not include markdown code blocks or any text outside the JSON.`;

  const userPrompt = `Generate a 7-email cold sequence for:
- Company/Product: ${input.companyName}
- Target: ${input.targetJobTitle}
- Problem they face: ${input.problemTheyFace}
- Our product: ${input.yourProduct}
- Key benefit: ${input.keyBenefit}
- Call to action: ${input.callToAction}
- Tone: ${input.tone}

Return ONLY this JSON structure:
{
  "emails": [
    {
      "subjectLineA": "variant A",
      "subjectLineB": "variant B",
      "body": "email body"
    }
  ]
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  try {
    console.log('Calling Claude API with model:', 'claude-3-5-haiku-20241022');
    console.log('API key present:', !!env.ANTHROPIC_API_KEY);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error response:', response.status, errorData);
      throw new Error(`Claude API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as any;
    console.log('Claude response status:', response.status);
    console.log('Claude response has content:', !!data.content);

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid Claude response structure:', data);
      throw new Error(`Invalid Claude response structure: ${JSON.stringify(data)}`);
    }

    const content = data.content[0].text;
    console.log('Claude generated content length:', content.length);

    // Validate and parse response
    return validateClaudeResponse(content);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Claude API request timed out (25s). Please try again.');
    }
    throw error;
  }
}

/**
 * POST /api/generate
 * Generates a cold email sequence from user input
 */
export async function onRequest(context: Context): Promise<Response> {
  const { request, env } = context;
  console.log('Generate endpoint called, method:', request.method);
  console.log('API key present:', !!env.ANTHROPIC_API_KEY);
  console.log('DB available:', !!env.DB);
  console.log('RATE_LIMIT available:', !!env.RATE_LIMIT);

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const input = (await request.json()) as GenerateRequest;

    // Validate required fields
    if (!input.companyName?.trim()) {
      return new Response(
        JSON.stringify({ error: 'companyName is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!input.targetJobTitle?.trim()) {
      return new Response(
        JSON.stringify({ error: 'targetJobTitle is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!input.problemTheyFace?.trim()) {
      return new Response(
        JSON.stringify({ error: 'problemTheyFace is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!input.yourProduct?.trim()) {
      return new Response(
        JSON.stringify({ error: 'yourProduct is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!input.keyBenefit?.trim()) {
      return new Response(
        JSON.stringify({ error: 'keyBenefit is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    if (!input.callToAction?.trim()) {
      return new Response(
        JSON.stringify({ error: 'callToAction is required' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    // Get or create session
    const { sessionId, isNew } = await getOrCreateSession(request, env);

    // Check session quota FIRST (D1 - total generations allowed)
    // This must come before rate limit check to ensure proper HTTP status codes
    const sessionData = await env.DB.prepare(`
      SELECT generations_used, max_generations
      FROM sessions
      WHERE id = ?
    `).bind(sessionId).first<{ generations_used: number; max_generations: number }>();

    if (sessionData && sessionData.generations_used >= sessionData.max_generations) {
      return new Response(
        JSON.stringify({
          error: 'quota_exceeded',
          message: 'You have used all your free generations. Upgrade to continue.',
        }),
        { status: 402, headers: { 'content-type': 'application/json' } }
      );
    }

    // Check rate limit (KV - requests per hour)
    const allowed = await checkRateLimit(sessionId, env);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Please wait before generating again. Rate limit: 1 generation per hour.',
        }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }

    // Generate sequence with Claude (with retry on validation failure)
    let sequence: EmailSequence;
    let retries = 1;

    while (retries >= 0) {
      try {
        sequence = await generateWithClaude(input, env);
        break;
      } catch (error) {
        if (retries > 0 && error instanceof Error && !error.message.includes('timed out')) {
          retries--;
        } else {
          throw error;
        }
      }
    }

    // Store sequence and update session (sequential to avoid race condition)
    const sequenceId = uuidv4();

    // First, insert the sequence
    await env.DB.prepare(`
      INSERT INTO sequences (id, session_id, input, output)
      VALUES (?, ?, ?, ?)
    `)
      .bind(sequenceId, sessionId, JSON.stringify(input), JSON.stringify(sequence))
      .run();

    // Then, update session generation count
    await env.DB.prepare(`
      UPDATE sessions
      SET generations_used = generations_used + 1, updated_at = datetime('now')
      WHERE id = ?
    `)
      .bind(sessionId)
      .run();

    // Prepare response headers with session cookie
    const responseHeaders: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (isNew) {
      responseHeaders['set-cookie'] = `coldcopy_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7776000`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sequenceId,
        sequence,
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error('Generate error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's a validation error from Claude
    if (error instanceof Error) {
      if (error.message.includes('generation_failed')) {
        return new Response(
          JSON.stringify({
            error: 'generation_failed',
            message: 'Unable to generate sequence. Please try again.',
          }),
          { status: 500, headers: { 'content-type': 'application/json' } }
        );
      }
      if (error.message.includes('timed out')) {
        return new Response(
          JSON.stringify({
            error: 'timeout',
            message: 'Generation took too long. Please try again.',
          }),
          { status: 504, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Return detailed error for debugging
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'An unexpected error occurred. Please try again.',
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
