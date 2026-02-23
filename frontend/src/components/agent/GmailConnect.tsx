import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, AlertCircle, Loader2, ExternalLink, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { GoogleAuthGuide } from './GoogleAuthGuide';

interface GmailStatus {
  connected: boolean;
  email?: string;
}

export function GmailConnect() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/gmail/status', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch status');
      const data: GmailStatus = await res.json();
      setStatus(data);
    } catch {
      setError('Could not check Gmail status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const res = await fetch('/api/agent/gmail/auth-url', { credentials: 'include' });
      if (res.status === 503) {
        setNotConfigured(true);
        setShowGuide(true);
        setActionLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Could not start Gmail connection');
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/gmail/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      await fetchStatus();
    } catch {
      setError('Could not disconnect Gmail');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking Gmail status...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              Connected as <strong>{status.email}</strong>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            ColdCopy can send and read emails from this Gmail account to manage your outreach conversations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            {actionLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Disconnect Gmail
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Gmail not connected</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Gmail to let ColdCopy send personalized cold emails on your behalf. We use Google OAuth — your password is never shared with ColdCopy.
          </p>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            <Mail className="w-4 h-4 mr-1.5" />
            Connect Gmail
          </Button>
          <GoogleAuthGuide compact />
        </div>
      )}

      {/* Not configured notice */}
      {notConfigured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Gmail OAuth not configured yet</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The platform admin needs to set up Google OAuth credentials before users can connect Gmail. Follow the setup guide below.
          </p>
        </div>
      )}

      {/* Setup Guide toggle */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {status?.connected ? 'How does Gmail connection work?' : 'Gmail setup guide'}
      </button>

      {/* Setup Guide content */}
      {showGuide && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4 text-sm">
          <h4 className="font-semibold text-foreground">How Gmail Connection Works</h4>
          <p className="text-muted-foreground text-xs">
            ColdCopy uses Google OAuth2 to send emails from your Gmail account. This is the same secure method used by apps like Notion, Slack, and Calendly. Your password is never shared with ColdCopy.
          </p>

          <div className="space-y-3">
            <h5 className="font-medium text-foreground text-xs uppercase tracking-wider">For Users</h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
              <li>Click <strong>"Connect Gmail"</strong> above</li>
              <li>Sign in with your Google account</li>
              <li>You'll see a safety warning — follow the visual guide below</li>
              <li>Allow ColdCopy to send emails</li>
              <li>You'll be redirected back — Gmail status will show "Connected"</li>
            </ol>
            <GoogleAuthGuide />
          </div>

          <hr className="border-border" />

          <div className="space-y-4">
            <h5 className="font-medium text-foreground text-xs uppercase tracking-wider">Platform Setup (One-Time, Admin Only)</h5>
            <div className="rounded bg-blue-500/5 border border-blue-500/20 p-2.5 text-[11px] text-blue-300/90">
              <strong>This section is for the platform admin only.</strong> These steps are done ONCE to set up Gmail sending for the entire ColdCopy platform. After this is done, all future users simply click "Connect Gmail" above — no setup needed on their end.
            </div>
            <p className="text-xs text-muted-foreground">
              Create Google OAuth2 credentials so ColdCopy can connect to users' Gmail accounts. Takes about 10 minutes.
            </p>

            {/* Step 1 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                <strong className="text-xs text-foreground">Create a Google Cloud Project</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p>
                  Go to{' '}
                  <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                    Google Cloud Console &gt; New Project <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <ul className="space-y-1 ml-3">
                  <li><strong>Project name:</strong> Enter <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ColdCopy</code> (or any name you like)</li>
                  <li><strong>Parent resource (父级资源):</strong> It will show "No organization (无组织)" — this is fine. Leave it as "No organization". This just means your project is a personal project not tied to a company Google Workspace. Click <strong>Create</strong>.</li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70">Wait a few seconds for the project to be created. You'll be redirected to the project dashboard.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                <strong className="text-xs text-foreground">Enable the Gmail API</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p>
                  Go to{' '}
                  <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                    APIs & Services &gt; Gmail API <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <ul className="space-y-1 ml-3">
                  <li>Make sure your new project (e.g. "ColdCopy") is selected in the top dropdown</li>
                  <li>Click the blue <strong>"Enable"</strong> button</li>
                  <li>Wait for it to say "API enabled"</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                <strong className="text-xs text-foreground">Configure Google Auth Platform</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p>
                  Go to{' '}
                  <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                    Google Auth Platform <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  You'll see "Google Auth Platform not configured yet (尚未配置 Google Auth Platform)" with a "Get started (开始)" button. Click <strong>"Get started"</strong>.
                </p>

                <p className="font-medium text-foreground mt-2">Screen 1 — App information (应用信息):</p>
                <ul className="space-y-1 ml-3">
                  <li><strong>App name (应用名称):</strong> Enter <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ColdCopy</code></li>
                  <li><strong>User support email (用户支持电子邮件):</strong> Select your Gmail address from the dropdown</li>
                  <li>Click <strong>"Next" (下一步)</strong></li>
                </ul>

                <p className="font-medium text-foreground mt-2">Screen 2 — Audience (受众群体 / 目标受众):</p>
                <ul className="space-y-1 ml-3">
                  <li>Select <strong>"External" (外部)</strong> — this allows any Google account to connect, not just accounts in your organization</li>
                  <li>Click <strong>"Next" (下一步)</strong></li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70 ml-3">If you only see "Internal (内部)", that means you're on a Google Workspace account. Choose "External" if available. If "Internal" is the only option, it will still work but only for accounts in your organization.</p>

                <p className="font-medium text-foreground mt-2">Screen 3 — Contact information (联系信息):</p>
                <ul className="space-y-1 ml-3">
                  <li><strong>Developer contact email (开发者联系电子邮件):</strong> Enter your Gmail address</li>
                  <li>Click <strong>"Next" (下一步)</strong></li>
                </ul>

                <p className="font-medium text-foreground mt-2">Screen 4 — Finish (完成):</p>
                <ul className="space-y-1 ml-3">
                  <li>Review the summary — you'll see your app name, email, and audience type</li>
                  <li>Check the agreement checkbox if shown</li>
                  <li>Click <strong>"Create" (创建)</strong></li>
                </ul>

                <p className="text-[11px] text-muted-foreground/70 mt-1">Your Google Auth Platform is now configured. You'll land on the overview page — proceed to Step 4.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                <strong className="text-xs text-foreground">Create OAuth Client</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p className="text-[11px] text-muted-foreground/70">
                  After creating the Auth Platform in Step 3, you'll land on the overview page showing "Metrics (指标)" and a message: "You have not configured any OAuth clients for this project (您尚未为此项目配置任何 OAuth 客户端)". This is expected — you need to create one now.
                </p>
                <ul className="space-y-1 ml-3">
                  <li>Click the <strong>"Create OAuth Client" (创建 OAuth 客户端)</strong> button on that page</li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Alternatively, you can also get there via{' '}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                    Credentials page <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}&gt; "+ Create Credentials" &gt; "OAuth client ID"
                </p>

                <p className="font-medium text-foreground mt-2">Fill in the form:</p>
                <ul className="space-y-1 ml-3">
                  <li><strong>Application type (应用类型):</strong> Select <strong>"Web application" (Web 应用)</strong></li>
                  <li><strong>Name (名称):</strong> Enter <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ColdCopy Web</code> (or any name you like)</li>
                </ul>

                <p className="font-medium text-foreground mt-2">Authorized JavaScript origins (已获授权的 JavaScript 来源):</p>
                <ul className="space-y-1 ml-3">
                  <li>Click <strong>"+ Add URI" (+ 添加 URI)</strong> and enter:</li>
                </ul>
                <pre className="ml-3 mt-1 bg-muted border border-border rounded p-2 text-[11px] font-mono select-all">https://coldcopy-au3.pages.dev</pre>
                <p className="text-[11px] text-muted-foreground/70 ml-3 mt-1">Just the domain, no path. This tells Google which website is allowed to start the OAuth flow.</p>

                <p className="font-medium text-foreground mt-2">Authorized redirect URIs (已获授权的重定向 URI):</p>
                <ul className="space-y-1 ml-3">
                  <li>Click <strong>"+ Add URI" (+ 添加 URI)</strong> and enter:</li>
                </ul>
                <pre className="ml-3 mt-1 bg-muted border border-border rounded p-2 text-[11px] font-mono select-all">https://coldcopy-au3.pages.dev/api/agent/gmail/callback</pre>
                <p className="text-[11px] text-muted-foreground/70 ml-3 mt-1">The full callback URL. Google will redirect users here after they authorize.</p>
                <ul className="space-y-1 ml-3 mt-1.5">
                  <li>Click <strong>"Create" (创建)</strong></li>
                </ul>

                <p className="mt-2">A popup will show <strong>"OAuth client created (OAuth 客户端已创建)"</strong> with your Client ID. Click <strong>"OK/Confirm (确定)"</strong> to close it.</p>

                <p className="font-medium text-foreground mt-2">Copy your Client ID and Client Secret:</p>
                <p className="text-[11px] text-muted-foreground/70">The popup after creation shows the Client ID but the Client Secret may not be fully visible or copyable. Don't worry — here's how to get both:</p>
                <ul className="space-y-1.5 ml-3 mt-1">
                  <li>Click <strong>"OK/Confirm (确定)"</strong> to close the popup</li>
                  <li>Click on the client you just created (e.g. <strong>"ColdCopy Web"</strong>) to open it</li>
                  <li><strong>Client ID (客户端 ID)</strong> — visible at the top, copy it. Looks like <code className="bg-muted px-1 py-0.5 rounded text-[11px]">123456789-abc.apps.googleusercontent.com</code></li>
                </ul>

                <p className="font-medium text-foreground mt-2">Getting the Client Secret:</p>
                <ul className="space-y-1.5 ml-3">
                  <li>In the "Client secrets (客户端密钥)" section, the original secret may be partially hidden and cannot be copied</li>
                  <li>This is normal! Click <strong>"Add client secret" (添加客户端密钥)</strong> to generate a new one</li>
                  <li>A new secret will appear — <strong>copy it immediately</strong> (it looks like <code className="bg-muted px-1 py-0.5 rounded text-[11px]">GOCSPX-xxxxxxxxxxxxxxxx</code>)</li>
                  <li>You can then <strong>delete the old secret</strong> by clicking the trash/delete icon next to it (the old one with the hidden value)</li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70 mt-1">This is completely safe — the new secret replaces the old one. Save both the Client ID and the new Client Secret. You'll paste them in Step 6.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">5</span>
                <strong className="text-xs text-foreground">Add Gmail Scope & Test Users</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p>
                  Go back to the{' '}
                  <a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">
                    Google Auth Platform overview <ExternalLink className="w-3 h-3" />
                  </a>
                  . In the left sidebar you'll see sections: "Overview", "Branding", "Clients", "Data access", "Audience".
                </p>

                <p className="font-medium text-foreground mt-2">Add Gmail scopes:</p>
                <ul className="space-y-1 ml-3">
                  <li>Click <strong>"Data access" (数据访问)</strong> in the left sidebar</li>
                  <li>Click <strong>"Add or Remove Scopes" (添加或移除范围)</strong></li>
                  <li>Search for <code className="bg-muted px-1 py-0.5 rounded text-[11px]">gmail</code> and check <strong>both</strong>:</li>
                  <li className="ml-3"><code className="bg-muted px-1 py-0.5 rounded text-[11px]">https://www.googleapis.com/auth/gmail.send</code></li>
                  <li className="ml-3"><code className="bg-muted px-1 py-0.5 rounded text-[11px]">https://www.googleapis.com/auth/gmail.readonly</code></li>
                  <li>Click <strong>"Update" (更新)</strong> then <strong>"Save" (保存)</strong></li>
                </ul>

                <p className="font-medium text-foreground mt-2">Publish the app (critical!):</p>
                <ul className="space-y-1 ml-3">
                  <li>Click <strong>"Audience" (受众群体)</strong> in the left sidebar</li>
                  <li>You'll see "Publishing status: Testing". Click <strong>"Publish App" (发布应用)</strong></li>
                  <li>This allows ANY Google account to sign in (not just test users)</li>
                  <li>Users will see a "This app isn't verified" warning — they click <strong>"Advanced" → "Go to ColdCopy (unsafe)"</strong> to proceed. This is normal for unverified apps.</li>
                </ul>
                <p className="text-[11px] text-muted-foreground/70">If you skip this step, only manually added "test users" can sign in. Publishing is required for public access.</p>

                <p className="font-medium text-foreground mt-2">Add redirect URIs:</p>
                <ul className="space-y-1 ml-3">
                  <li>Go back to <strong>"Clients" (客户端)</strong> → click your OAuth client</li>
                  <li>Under "Authorized redirect URIs", make sure <strong>both</strong> are added:</li>
                </ul>
                <pre className="ml-3 mt-1 bg-muted border border-border rounded p-2 text-[11px] font-mono select-all">https://coldcopy-au3.pages.dev/api/agent/gmail/callback
https://coldcopy-au3.pages.dev/api/agent/auth/google/callback</pre>
              </div>
            </div>

            {/* Step 6 */}
            <div className="rounded border border-border bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">6</span>
                <strong className="text-xs text-foreground">Paste Your Credentials Here</strong>
              </div>
              <div className="ml-7 space-y-1.5 text-xs text-muted-foreground">
                <p>Paste the Client ID and Client Secret you copied in Step 4. This saves them securely so ColdCopy can connect to Google.</p>
                <AdminCredentialsForm />
              </div>
            </div>

            {/* Done */}
            <div className="rounded border border-green-500/20 bg-green-500/5 p-3">
              <p className="text-xs text-green-400/90">
                <strong>Done!</strong> After completing these 6 steps, scroll back up and click <strong>"Connect Gmail"</strong>. It will redirect you to Google's authorization page. Sign in, authorize, and you're ready to send emails.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCredentialsForm() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/agent/admin/settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.settings) setExisting(data.settings);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both fields are required');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/agent/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          google_client_id: clientId.trim(),
          google_client_secret: clientSecret.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
      setClientId('');
      setClientSecret('');
      // Refresh existing display
      const r2 = await fetch('/api/agent/admin/settings', { credentials: 'include' });
      if (r2.ok) {
        const d = await r2.json();
        if (d?.settings) setExisting(d.settings);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 mt-2">
      {existing.google_client_id && (
        <div className="flex items-center gap-2 text-green-400 text-[11px]">
          <Shield className="w-3.5 h-3.5" />
          <span>Credentials already saved. Client ID: <code className="bg-muted px-1 py-0.5 rounded">{existing.google_client_id}</code></span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Client ID (客户端 ID)</Label>
        <Input
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          placeholder="376126816643-xxxxx.apps.googleusercontent.com"
          className="text-xs h-8 font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Client Secret (客户端密钥)</Label>
        <Input
          type="password"
          value={clientSecret}
          onChange={e => setClientSecret(e.target.value)}
          placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
          className="text-xs h-8 font-mono"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-1.5 text-green-400 text-[11px]">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Credentials saved! You can now click "Connect Gmail" above.</span>
        </div>
      )}

      <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-7">
        {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
        Save Credentials
      </Button>
    </div>
  );
}
