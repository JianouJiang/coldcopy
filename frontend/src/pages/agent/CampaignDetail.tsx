import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TopNav } from '@/components/agent/TopNav';
import { LeadTable } from '@/components/agent/LeadTable';
import { EmailTable } from '@/components/agent/EmailTable';
import type { OutboundEmail } from '@/components/agent/EmailTable';
import { EmailPreview } from '@/components/agent/EmailPreview';
import { StatsCard } from '@/components/agent/StatsCard';
import { Play, Pause, Users, Mail, FileText, Settings, CheckCheck, X, MessageSquare, AlertTriangle, RefreshCw, Loader2, Crown, Reply, SearchCheck, Wand2, Send, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmailReply {
  id: string;
  outbound_email_id: string;
  from_email: string;
  subject: string;
  body: string;
  received_at: string;
  ai_summary: string;
  ai_sentiment: string;
  ai_suggested_reply: string;
  ai_reply_status: string;
}

interface ReplyDraft {
  id: string;
  outbound_email_id: string;
  lead_id: string;
  from_email: string;
  subject: string;
  body: string;
  received_at: string;
  ai_summary: string;
  ai_sentiment: string;
  ai_suggested_reply: string;
  ai_reply_status: string;
  lead_company_name?: string;
  lead_contact_name?: string;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'emails' | 'settings'>('overview');
  const [previewEmail, setPreviewEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);

  // Approve All state
  const [approveAllActive, setApproveAllActive] = useState(false);
  const [approveAllCountdown, setApproveAllCountdown] = useState(0);
  const approveAllIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reply viewing state
  const [viewingReplies, setViewingReplies] = useState<OutboundEmail | null>(null);
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // Reply editing state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [regenerateReplyId, setRegenerateReplyId] = useState<string | null>(null);
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [approvingReplyId, setApprovingReplyId] = useState<string | null>(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [hasActiveTasks, setHasActiveTasks] = useState(false);
  const [activeTaskType, setActiveTaskType] = useState<string>('');
  const [limitReached, setLimitReached] = useState<string | null>(null);
  const initialProcessDone = useRef(false);

  // Reply draft auto-approve state
  const [replyDrafts, setReplyDrafts] = useState<ReplyDraft[]>([]);
  const [replyApproveActive, setReplyApproveActive] = useState(false);
  const [replyApproveCountdown, setReplyApproveCountdown] = useState(0);
  const replyApproveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevReplyDraftCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const [campRes, leadsRes, emailsRes] = await Promise.all([
        fetch(`/api/agent/campaigns/${id}`, { credentials: 'include' }),
        fetch(`/api/agent/campaigns/${id}/leads`, { credentials: 'include' }),
        fetch(`/api/agent/campaigns/${id}/emails`, { credentials: 'include' }),
      ]);
      if (!campRes.ok) { navigate('/agent/dashboard'); return; }
      const campData = await campRes.json();
      setCampaign(campData);
      setLeads(await leadsRes.json());
      setEmails(await emailsRes.json());
      setReplyDrafts(campData.reply_drafts || []);

      // Check for limit-reached errors in recent tasks
      const tasks = campData.recent_tasks || [];
      const limitTask = tasks.find((t: any) => t.error && t.error.startsWith('LIMIT_REACHED:'));
      if (limitTask) {
        setLimitReached(limitTask.error.replace('LIMIT_REACHED: ', ''));
      } else {
        setLimitReached(null);
      }

      // Check if there are active/pending tasks
      const pendingOrProcessing = tasks.filter((t: any) => t.status === 'pending' || t.status === 'processing');
      setHasActiveTasks(pendingOrProcessing.length > 0);
      if (pendingOrProcessing.length > 0) {
        const taskLabels: Record<string, string> = {
          research_leads: 'Researching leads',
          find_emails: 'Finding contact emails',
          generate_emails: 'Generating email drafts',
          send_emails: 'Sending emails',
          send_reply: 'Sending AI reply',
          check_replies: 'Checking for replies',
        };
        setActiveTaskType(taskLabels[pendingOrProcessing[0].task_type] || pendingOrProcessing[0].task_type.replace(/_/g, ' '));
      } else {
        setActiveTaskType('');
      }
    } catch {} finally { setLoading(false); }
  }, [id]);

  // Auto-trigger processing on first mount (e.g. after campaign creation)
  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setGmailConnected(data.gmail_connected); })
      .catch(() => navigate('/agent/login'));
    fetchData().then(() => {
      // Auto-trigger processing on first visit
      if (!initialProcessDone.current && id) {
        initialProcessDone.current = true;
        triggerProcess();
      }
    });
  }, []);

  // Poll faster (5s) when tasks are active, slower (30s) when idle
  useEffect(() => {
    const interval = setInterval(fetchData, hasActiveTasks ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [fetchData, hasActiveTasks]);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (approveAllIntervalRef.current) clearInterval(approveAllIntervalRef.current);
      if (replyApproveIntervalRef.current) clearInterval(replyApproveIntervalRef.current);
    };
  }, []);

  async function handleStart() {
    await fetch(`/api/agent/campaigns/${id}/start`, { method: 'POST', credentials: 'include' });
    await fetchData();
    processLoop();
  }

  async function handlePause() {
    await fetch(`/api/agent/campaigns/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    });
    fetchData();
  }

  async function handleRerun() {
    if (rerunning) return;
    setRerunning(true);
    try {
      const res = await fetch(`/api/agent/campaigns/${id}/rerun`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        await fetchData();
        // Directly kick off processing loop for the new research task
        setRerunning(false);
        await processLoop();
        return;
      }
      await fetchData();
    } catch {} finally {
      setRerunning(false);
    }
  }

  // Keep calling process endpoint until no more pending tasks
  async function processLoop() {
    setProcessing(true);
    try {
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(`/api/agent/campaigns/${id}/process`, { method: 'POST', credentials: 'include' });
        if (!res.ok) break;
        const data = await res.json();
        hasMore = data.has_more;
        await fetchData();
        if (hasMore) await new Promise(r => setTimeout(r, 2000));
      }
    } catch {} finally {
      setProcessing(false);
      await fetchData();
    }
  }

  async function triggerProcess() {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/agent/campaigns/${id}/process`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // If there are more tasks, keep processing
        if (data.has_more) {
          setTimeout(triggerProcess, 2000);
        }
      }
      await fetchData();
    } catch {} finally {
      setProcessing(false);
    }
  }

  async function handleApprove(emailId: string) {
    await fetch(`/api/agent/campaigns/${id}/emails/${emailId}/approve`, { method: 'POST', credentials: 'include' });
    fetchData();
  }

  async function handleSaveEmail(emailId: string, subject: string, body: string) {
    await fetch(`/api/agent/campaigns/${id}/emails/${emailId}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    });
    setPreviewEmail(null);
    fetchData();
  }

  // Approve All with auto-countdown
  const draftEmails = emails.filter((e: any) => e.status === 'draft');
  const prevDraftCountRef = useRef(0);

  // Auto-start countdown when new drafts appear
  useEffect(() => {
    if (draftEmails.length > 0 && prevDraftCountRef.current === 0 && !approveAllActive) {
      startApproveAll();
    }
    prevDraftCountRef.current = draftEmails.length;
  }, [draftEmails.length]);

  function startApproveAll() {
    if (draftEmails.length === 0) return;
    setApproveAllActive(true);
    setApproveAllCountdown(10);

    if (approveAllIntervalRef.current) clearInterval(approveAllIntervalRef.current);

    approveAllIntervalRef.current = setInterval(() => {
      setApproveAllCountdown((prev) => {
        if (prev <= 1) {
          // Time's up — approve all drafts
          if (approveAllIntervalRef.current) clearInterval(approveAllIntervalRef.current);
          approveAllIntervalRef.current = null;
          setApproveAllActive(false);
          // Fire all approve calls
          draftEmails.forEach((email: any) => {
            fetch(`/api/agent/campaigns/${id}/emails/${email.id}/approve`, {
              method: 'POST', credentials: 'include',
            });
          });
          setTimeout(() => { fetchData(); triggerProcess(); }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelApproveAll() {
    if (approveAllIntervalRef.current) {
      clearInterval(approveAllIntervalRef.current);
      approveAllIntervalRef.current = null;
    }
    setApproveAllActive(false);
    setApproveAllCountdown(0);
  }

  // Auto-start reply draft countdown when new reply drafts appear
  useEffect(() => {
    if (replyDrafts.length > 0 && prevReplyDraftCountRef.current === 0 && !replyApproveActive) {
      startReplyApprove();
    }
    prevReplyDraftCountRef.current = replyDrafts.length;
  }, [replyDrafts.length]);

  function startReplyApprove() {
    if (replyDrafts.length === 0) return;
    setReplyApproveActive(true);
    setReplyApproveCountdown(10);

    if (replyApproveIntervalRef.current) clearInterval(replyApproveIntervalRef.current);

    replyApproveIntervalRef.current = setInterval(() => {
      setReplyApproveCountdown((prev) => {
        if (prev <= 1) {
          if (replyApproveIntervalRef.current) clearInterval(replyApproveIntervalRef.current);
          replyApproveIntervalRef.current = null;
          setReplyApproveActive(false);
          // Approve all reply drafts
          replyDrafts.forEach((rd) => {
            fetch(`/api/agent/campaigns/${id}/replies/${rd.id}/approve`, {
              method: 'POST', credentials: 'include',
            });
          });
          setTimeout(() => { fetchData(); triggerProcess(); }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelReplyApprove() {
    if (replyApproveIntervalRef.current) {
      clearInterval(replyApproveIntervalRef.current);
      replyApproveIntervalRef.current = null;
    }
    setReplyApproveActive(false);
    setReplyApproveCountdown(0);
  }

  // Fetch replies for an email
  async function handleViewReplies(email: OutboundEmail) {
    setViewingReplies(email);
    setRepliesLoading(true);
    setEditingReplyId(null);
    setRegenerateReplyId(null);
    try {
      const res = await fetch(`/api/agent/campaigns/${id}/emails/${email.id}/replies`, { credentials: 'include' });
      if (res.ok) {
        setReplies(await res.json());
      }
    } catch {} finally {
      setRepliesLoading(false);
    }
  }

  // Save edited reply text
  async function handleSaveReply(replyId: string) {
    setSavingReply(true);
    try {
      await fetch(`/api/agent/campaigns/${id}/replies/${replyId}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ai_suggested_reply: editReplyText }),
      });
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, ai_suggested_reply: editReplyText } : r));
      setEditingReplyId(null);
    } catch {} finally {
      setSavingReply(false);
    }
  }

  // Regenerate reply with AI instructions
  async function handleRegenerateReply(replyId: string) {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/agent/campaigns/${id}/replies/${replyId}/regenerate`, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ instructions: regenerateInstructions }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(prev => prev.map(r => r.id === replyId ? { ...r, ai_suggested_reply: data.ai_suggested_reply } : r));
        setRegenerateReplyId(null);
        setRegenerateInstructions('');
      }
    } catch {} finally {
      setRegenerating(false);
    }
  }

  // Approve & send reply from modal
  async function handleApproveReply(replyId: string) {
    setApprovingReplyId(replyId);
    try {
      // If currently editing, save first
      if (editingReplyId === replyId) {
        await fetch(`/api/agent/campaigns/${id}/replies/${replyId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ai_suggested_reply: editReplyText }),
        });
        setEditingReplyId(null);
      }
      // Then approve
      await fetch(`/api/agent/campaigns/${id}/replies/${replyId}/approve`, {
        method: 'POST', credentials: 'include',
      });
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, ai_reply_status: 'approved' } : r));
      triggerProcess();
    } catch {} finally {
      setApprovingReplyId(null);
    }
  }

  if (loading || !campaign) return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  const totalReplies = emails.reduce((sum: number, e: any) => sum + (e.reply_count || 0), 0);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'leads', label: `Leads (${leads.length})`, icon: Users },
    { key: 'emails', label: `Emails (${emails.length})`, icon: Mail },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">{campaign.icp_description}</p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRerun}
              disabled={rerunning || processing}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              {rerunning ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <SearchCheck className="w-4 h-4 mr-1.5" />
              )}
              {rerunning ? 'Searching...' : 'More Leads'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerProcess}
              disabled={processing}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1.5" />
              )}
              {processing ? 'Processing...' : 'Process'}
            </Button>
            {campaign.status === 'active' ? (
              <Button size="sm" variant="outline" onClick={handlePause} className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"><Pause className="w-4 h-4 mr-1.5" /> Pause</Button>
            ) : (
              <Button size="sm" onClick={handleStart} className="bg-green-600 text-white hover:bg-green-500"><Play className="w-4 h-4 mr-1.5" /> Start</Button>
            )}
          </div>
        </div>

        {/* Gmail Connection Warning */}
        {gmailConnected === false && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Gmail not connected — emails cannot be sent</p>
              <p className="text-xs text-muted-foreground mt-1">
                The agent can research leads and generate drafts, but emails won't be sent until you connect Gmail.
              </p>
              <a
                href="/agent/settings"
                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Go to Settings → Connect Gmail
              </a>
            </div>
          </div>
        )}

        {/* Limit Reached — Upgrade Banner */}
        {limitReached && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">{limitReached}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade your plan to increase daily email limits, lead counts, and reply rounds.
              </p>
            </div>
            <Link
              to="/agent/upgrade"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors flex-shrink-0"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Activity Indicator */}
        {(hasActiveTasks || processing) && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">
                Working: {activeTaskType || 'Processing tasks...'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The pipeline is running automatically. This page updates every 5 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <StatsCard label="Status" value={campaign.status} />
              <StatsCard label="Leads Found" value={campaign.leads_found || 0} />
              <StatsCard label="Emails Sent" value={campaign.emails_sent || 0} />
              <StatsCard label="Replies" value={totalReplies} />
              <StatsCard label="Max Per Day" value={campaign.max_emails_per_day || 20} />
            </div>
            {campaign.recent_tasks && campaign.recent_tasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Recent Tasks</h3>
                <div className="space-y-2">
                  {campaign.recent_tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                      <span className="text-sm text-foreground">{task.task_type.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        task.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{task.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leads' && <LeadTable leads={leads} />}

        {activeTab === 'emails' && (
          <>
            {/* Auto-approve bar */}
            {draftEmails.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-card border border-border">
                {approveAllActive ? (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-foreground">
                          Auto-approving {draftEmails.length} draft{draftEmails.length > 1 ? 's' : ''} in
                        </span>
                        <span className="text-lg font-mono font-bold text-green-400">{approveAllCountdown}s</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Click Pause to review and edit before sending
                      </p>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${((10 - approveAllCountdown) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={cancelApproveAll}>
                      <Pause className="w-4 h-4 mr-1" /> Pause
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground flex-1">
                      {draftEmails.length} draft{draftEmails.length > 1 ? 's' : ''} paused — review and edit, then resume
                    </span>
                    <Button size="sm" onClick={startApproveAll}>
                      <CheckCheck className="w-4 h-4 mr-1" /> Resume Auto-Approve ({draftEmails.length})
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Reply draft auto-approve bar */}
            {replyDrafts.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                {replyApproveActive ? (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-foreground">
                          Auto-sending {replyDrafts.length} AI reply{replyDrafts.length > 1 ? 's' : ''} in
                        </span>
                        <span className="text-lg font-mono font-bold text-purple-400">{replyApproveCountdown}s</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {replyDrafts.map(rd => `${rd.lead_company_name || rd.from_email}: "${rd.ai_summary}"`).join(' | ')}
                      </p>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${((10 - replyApproveCountdown) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={cancelReplyApprove}>
                      <Pause className="w-4 h-4 mr-1" /> Pause
                    </Button>
                  </>
                ) : (
                  <>
                    <Reply className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-foreground">
                        {replyDrafts.length} AI reply{replyDrafts.length > 1 ? 's' : ''} paused — review below, then resume
                      </span>
                      {replyDrafts.map(rd => (
                        <div key={rd.id} className="mt-2 p-2 rounded bg-card border border-border">
                          <p className="text-xs text-muted-foreground">{rd.lead_company_name || rd.from_email} — {rd.ai_sentiment}</p>
                          <p className="text-xs text-purple-400 mt-0.5">Their message: {rd.ai_summary}</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{rd.ai_suggested_reply}</p>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={startReplyApprove} className="bg-purple-600 text-white hover:bg-purple-500 flex-shrink-0">
                      <Reply className="w-4 h-4 mr-1" /> Resume Auto-Reply ({replyDrafts.length})
                    </Button>
                  </>
                )}
              </div>
            )}

            <EmailTable
              emails={emails}
              onApprove={handleApprove}
              onEdit={setPreviewEmail}
              onViewReplies={handleViewReplies}
            />
            <EmailPreview
              email={previewEmail}
              isOpen={!!previewEmail}
              onClose={() => setPreviewEmail(null)}
              onSave={handleSaveEmail}
            />

            {/* Reply Thread Modal */}
            {viewingReplies && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setViewingReplies(null); }}
              >
                <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Reply Thread — {viewingReplies.lead_company_name || viewingReplies.lead_contact_email}
                      </CardTitle>
                      <button onClick={() => setViewingReplies(null)} className="text-muted-foreground hover:text-foreground p-1">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-4">
                    {/* Original sent email */}
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-400">You (sent)</span>
                        <span className="text-xs text-muted-foreground">
                          {viewingReplies.sent_at ? new Date(viewingReplies.sent_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground mb-1">{viewingReplies.subject}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingReplies.body}</p>
                    </div>

                    {repliesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : replies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>
                    ) : (
                      replies.map((reply) => (
                        <div key={reply.id} className="space-y-2">
                          {/* Reply message */}
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-purple-400">{reply.from_email}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.received_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{reply.body}</p>
                          </div>

                          {/* AI Analysis card */}
                          {reply.ai_summary && (
                            <div className="ml-4 p-3 rounded-lg bg-card border border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-1">AI Analysis</p>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Sentiment:</span>
                                  <span className={`text-xs font-medium ${
                                    reply.ai_sentiment === 'positive' ? 'text-green-400' :
                                    reply.ai_sentiment === 'negative' ? 'text-red-400' :
                                    'text-yellow-400'
                                  }`}>{reply.ai_sentiment}</span>
                                </div>
                                <p className="text-sm text-foreground">{reply.ai_summary}</p>
                                {reply.ai_suggested_reply && (
                                  <div className="mt-2 p-2 rounded bg-muted/50">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-medium text-muted-foreground">Suggested Reply:</p>
                                      {reply.ai_reply_status === 'draft' && editingReplyId !== reply.id && (
                                        <button
                                          onClick={() => { setEditingReplyId(reply.id); setEditReplyText(reply.ai_suggested_reply); }}
                                          className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                    {editingReplyId === reply.id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editReplyText}
                                          onChange={(e) => setEditReplyText(e.target.value)}
                                          className="w-full rounded-md border border-border bg-background text-foreground text-sm p-2 min-h-[80px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => handleSaveReply(reply.id)} disabled={savingReply} className="bg-blue-600 text-white hover:bg-blue-500">
                                            <Save className="w-3 h-3 mr-1" />{savingReply ? 'Saving...' : 'Save'}
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => setEditingReplyId(null)}>Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-foreground whitespace-pre-wrap">{reply.ai_suggested_reply}</p>
                                    )}
                                  </div>
                                )}

                                {/* Regenerate section */}
                                {reply.ai_reply_status === 'draft' && (
                                  <div className="mt-2">
                                    {regenerateReplyId === reply.id ? (
                                      <div className="space-y-2 p-2 rounded bg-muted/30 border border-border">
                                        <input
                                          type="text"
                                          value={regenerateInstructions}
                                          onChange={(e) => setRegenerateInstructions(e.target.value)}
                                          placeholder="Instructions (e.g. 'make it shorter', 'mention pricing')"
                                          className="w-full rounded-md border border-border bg-background text-foreground text-sm p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => handleRegenerateReply(reply.id)} disabled={regenerating} className="bg-purple-600 text-white hover:bg-purple-500">
                                            <Wand2 className="w-3 h-3 mr-1" />{regenerating ? 'Regenerating...' : 'Regenerate'}
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => { setRegenerateReplyId(null); setRegenerateInstructions(''); }}>Cancel</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setRegenerateReplyId(reply.id)}
                                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                                      >
                                        <Wand2 className="w-3 h-3" /> Regenerate with instructions
                                      </button>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Status:</span>
                                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                                      reply.ai_reply_status === 'sent' ? 'bg-green-500/20 text-green-400' :
                                      reply.ai_reply_status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }`}>{reply.ai_reply_status}</span>
                                  </div>
                                  {reply.ai_reply_status === 'draft' && reply.ai_suggested_reply && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveReply(reply.id)}
                                      disabled={approvingReplyId === reply.id}
                                      className="bg-green-600 text-white hover:bg-green-500"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      {approvingReplyId === reply.id ? 'Sending...' : 'Approve & Send'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg space-y-4">
            <p className="text-sm text-muted-foreground">Campaign settings editing coming soon. Use the PATCH API directly for now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
