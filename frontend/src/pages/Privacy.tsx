export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">What We Collect</h2>
          <p>When you sign in with Google, we collect your name, email address, and Gmail send/read permissions. We use this solely to send cold outreach emails on your behalf and read replies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your email address is used for authentication and as the sender address for outreach emails.</li>
            <li>Gmail access tokens are encrypted (AES-256-GCM) and stored securely.</li>
            <li>We read Gmail threads only to detect replies to emails sent by ColdCopy.</li>
            <li>We never sell, share, or transfer your data to third parties.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Data Storage</h2>
          <p>Your data is stored on Cloudflare's infrastructure (D1 database, encrypted at rest). OAuth tokens are additionally encrypted with AES-256-GCM before storage.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Your Rights</h2>
          <p>You can disconnect your Gmail at any time from Settings, which deletes your stored tokens. You can request full account deletion by contacting us.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>Questions? Email <a href="mailto:jianou.works@gmail.com" className="text-primary hover:underline">jianou.works@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
