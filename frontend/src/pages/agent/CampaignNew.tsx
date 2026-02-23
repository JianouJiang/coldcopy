import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TopNav } from '@/components/agent/TopNav';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function CampaignNew() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setGmailConnected(data.gmail_connected); })
      .catch(() => navigate('/agent/login'));
  }, []);

  const [name, setName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderTitle, setSenderTitle] = useState('');
  const [companyIntro, setCompanyIntro] = useState('');
  const [icpDescription, setIcpDescription] = useState('');
  const [emailRules, setEmailRules] = useState('');
  const [tone, setTone] = useState('professional');
  const [maxEmailsPerDay, setMaxEmailsPerDay] = useState(20);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/agent/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          sender_name: senderName,
          sender_title: senderTitle,
          company_intro: companyIntro,
          icp_description: icpDescription,
          email_rules: emailRules || undefined,
          tone,
          max_emails_per_day: maxEmailsPerDay,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create campaign');
      }
      const campaign = await res.json();
      navigate(`/agent/campaigns/${campaign.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/agent/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {gmailConnected === false && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Connect Gmail first</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You need to connect your Gmail account before creating a campaign. ColdCopy will send emails through your Gmail via secure OAuth.
                    </p>
                    <Link
                      to="/agent/settings"
                      className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Go to Settings → Connect Gmail
                    </Link>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Q1 Outbound - Series A Startups"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name *</Label>
                  <Input
                    id="sender_name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-muted-foreground">Used in the email sign-off</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_title">Sender Title *</Label>
                  <Input
                    id="sender_title"
                    value={senderTitle}
                    onChange={(e) => setSenderTitle(e.target.value)}
                    required
                    placeholder="e.g. CEO, PhD Researcher, Freelance Designer"
                  />
                  <p className="text-xs text-muted-foreground">Your role / job title</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_intro">About You / Your Organization</Label>
                <Textarea
                  id="company_intro"
                  value={companyIntro}
                  onChange={(e) => setCompanyIntro(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe yourself, your company, or your project. E.g. 'I'm a PhD researcher at MIT looking for post-doc positions in computational biology' or 'We're a B2B SaaS startup helping teams manage analytics'"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icp_description">Ideal Customer Profile (ICP)</Label>
                <Textarea
                  id="icp_description"
                  value={icpDescription}
                  onChange={(e) => setIcpDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="B2B SaaS companies with 10-50 employees that need better analytics tools..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_rules">Email Rules (Optional)</Label>
                <Textarea
                  id="email_rules"
                  value={emailRules}
                  onChange={(e) => setEmailRules(e.target.value)}
                  rows={2}
                  placeholder="Keep emails under 100 words. Always mention a free trial..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_emails">Max Emails / Day</Label>
                  <Input
                    id="max_emails"
                    type="number"
                    min={1}
                    max={100}
                    value={maxEmailsPerDay}
                    onChange={(e) => setMaxEmailsPerDay(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || gmailConnected === false}>
                {loading ? 'Creating...' : gmailConnected === false ? 'Connect Gmail First' : 'Create Campaign'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
