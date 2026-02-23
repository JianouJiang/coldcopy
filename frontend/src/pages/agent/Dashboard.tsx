import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/agent/TopNav';
import { CampaignCard } from '@/components/agent/CampaignCard';
import { StatsCard } from '@/components/agent/StatsCard';
import { Plus, Users, Mail, Zap, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setGmailConnected(data.gmail_connected); })
      .catch(() => { navigate('/agent/login'); });

    fetch('/api/agent/campaigns', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setCampaigns(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_found || 0), 0);
  const totalEmails = campaigns.reduce((s, c) => s + (c.emails_sent || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button onClick={() => navigate('/agent/campaigns/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </div>

        {/* Gmail Connection Warning */}
        {gmailConnected === false && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Gmail not connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                You need to connect your Gmail before creating campaigns. ColdCopy sends emails through your Gmail account via secure OAuth — your password is never shared.
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard label="Active Campaigns" value={activeCampaigns} icon={<Zap className="w-5 h-5 text-green-400" />} />
          <StatsCard label="Leads Found" value={totalLeads} icon={<Users className="w-5 h-5 text-blue-400" />} />
          <StatsCard label="Emails Sent" value={totalEmails} icon={<Mail className="w-5 h-5 text-purple-400" />} />
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No campaigns yet. Create your first campaign to start finding leads.</p>
            <Button onClick={() => navigate('/agent/campaigns/new')}>
              <Plus className="w-4 h-4 mr-2" /> Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
