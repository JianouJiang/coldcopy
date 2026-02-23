export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-2">Service</h2>
          <p>ColdCopy is an autonomous cold email outreach tool. You provide target criteria and company information; ColdCopy researches leads, drafts personalized emails, and sends them via your connected Gmail account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Your Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must comply with all applicable email and anti-spam laws (CAN-SPAM, GDPR, etc.).</li>
            <li>You are responsible for the content of emails sent through your Gmail account.</li>
            <li>You must not use ColdCopy for spam, harassment, or illegal purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Gmail Access</h2>
          <p>By connecting your Gmail, you authorize ColdCopy to send emails and read replies on your behalf. You can revoke this access at any time from Settings or from your Google Account permissions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Limitation of Liability</h2>
          <p>ColdCopy is provided "as is" without warranties. We are not liable for email deliverability, response rates, or any consequences of emails sent through the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p>Questions? Email <a href="mailto:jianou.works@gmail.com" className="text-primary hover:underline">jianou.works@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
