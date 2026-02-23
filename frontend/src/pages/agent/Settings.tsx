import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TopNav } from '@/components/agent/TopNav';
import { GmailConnect } from '@/components/agent/GmailConnect';
import { CheckCircle, Mail, Search, Sparkles, Send, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const gmailStatus = searchParams.get('gmail');
  const isOnboarding = searchParams.get('onboarding') === 'true';

  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUser)
      .catch(() => navigate('/agent/login'));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Configure your agent's email sending and profile</p>

        {isOnboarding && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm font-medium text-blue-400">Welcome to ColdCopy!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Step 1: Connect your Gmail below so ColdCopy can send emails on your behalf. Then head to the Dashboard to create your first campaign.
            </p>
          </div>
        )}

        {gmailStatus === 'connected' && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400">Gmail connected successfully! Your agent can now send emails.</span>
          </div>
        )}

        {gmailStatus === 'error' && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Gmail connection failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchParams.get('reason') || 'Unknown error. Please try again.'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                If you see "access denied" or "not verified", the platform admin needs to add your Gmail address as a <strong>test user</strong> in Google Cloud Console → Google Auth Platform → Audience → Test users.
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">How the Agent Works</CardTitle>
            <CardDescription>Your campaign runs through 4 automated steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/agent/dashboard" className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1.5">1. Find Leads <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" /></p>
                  <p className="text-xs text-muted-foreground">Agent searches the web for companies matching your ICP</p>
                </div>
              </Link>
              <Link to="/agent/dashboard" className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1.5">2. Research & Draft <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" /></p>
                  <p className="text-xs text-muted-foreground">AI researches each company and writes personalized emails</p>
                </div>
              </Link>
              <Link to="/agent/dashboard" className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1.5">3. You Approve <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" /></p>
                  <p className="text-xs text-muted-foreground">Review drafts in your dashboard, edit or approve each one</p>
                </div>
              </Link>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">4. Send via Gmail</p>
                  <p className="text-xs text-muted-foreground">Approved emails are sent from your Gmail (requires connection below)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gmail Connection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Gmail Connection
            </CardTitle>
            <CardDescription>Required for sending emails. Connect your Gmail to enable step 4.</CardDescription>
          </CardHeader>
          <CardContent>
            <GmailConnect />
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Company Introduction</Label>
              <Textarea value={user?.company_intro || ''} disabled rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
