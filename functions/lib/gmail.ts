// Gmail API helpers for OAuth2 + sending emails
// Compatible with Cloudflare Workers (Web Crypto API only)

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export function getGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return res.json();
}

function plainTextToHtml(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split on double newlines for paragraphs, single newlines become <br>
  const paragraphs = escaped.split(/\n\s*\n/);
  const htmlParagraphs = paragraphs.map(
    (p) => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, '<br>')}</p>`
  );

  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
${htmlParagraphs.join('\n')}
</body></html>`;
}

export async function sendEmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string; threadId: string }> {
  // Convert plain text body to proper HTML
  const htmlBody = plainTextToHtml(body);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n');

  // Base64url encode the message
  const raw = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_API_URL}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Send email failed: ${error}`);
  }

  const data: any = await res.json();
  return { messageId: data.id, threadId: data.threadId || '' };
}

export async function replyInThread(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  body: string,
  threadId: string
): Promise<{ messageId: string; threadId: string }> {
  const htmlBody = plainTextToHtml(body);
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${replySubject}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n');

  const raw = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_API_URL}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw, threadId }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Reply send failed: ${error}`);
  }

  const data: any = await res.json();
  return { messageId: data.id, threadId: data.threadId || '' };
}

export async function getThreadMessages(
  accessToken: string,
  threadId: string
): Promise<any[]> {
  const res = await fetch(
    `${GMAIL_API_URL}/users/me/threads/${threadId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Get thread failed: ${error}`);
  }

  const data: any = await res.json();
  return data.messages || [];
}

export function parseGmailMessage(message: any): {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  bodyHtml: string;
  date: string;
} {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let body = '';
  let bodyHtml = '';

  // Extract body from parts or payload
  function extractBody(part: any) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      body = decodeBase64Url(part.body.data);
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      for (const p of part.parts) extractBody(p);
    }
  }

  extractBody(message.payload);

  // Fallback: if no parts, body might be directly on payload
  if (!body && !bodyHtml && message.payload?.body?.data) {
    const decoded = decodeBase64Url(message.payload.body.data);
    if (message.payload.mimeType === 'text/html') {
      bodyHtml = decoded;
      body = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      body = decoded;
    }
  }

  // If only HTML, derive plain text
  if (!body && bodyHtml) {
    body = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader('From'),
    subject: getHeader('Subject'),
    body,
    bodyHtml,
    date: getHeader('Date'),
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token revocation failed: ${error}`);
  }
}
