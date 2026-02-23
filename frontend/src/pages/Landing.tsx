import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { X, Search, Mail, Send, CheckCheck, Bot, ArrowRight, Zap, Reply, PenLine } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 max-w-4xl py-16 md:py-24">
        <div className="text-center space-y-6">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t('landing.hero.title')}
          </h1>

          {/* Sub-headline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>

          {/* Mode Picker */}
          <div className="inline-flex flex-col sm:flex-row gap-4 bg-muted/50 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t('landing.modepicker.autopilot')}</p>
                <p className="text-xs text-muted-foreground">{t('landing.modepicker.autopilot.desc')}</p>
              </div>
            </div>
            <div className="hidden sm:block border-l border-border" />
            <div className="border-t sm:border-t-0 border-border sm:hidden" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <PenLine className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t('landing.modepicker.manual')}</p>
                <p className="text-xs text-muted-foreground">{t('landing.modepicker.manual.desc')}</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-muted-foreground">
            {t('landing.hero.social')}
          </p>

          {/* Primary CTA — Single dominant button (Agent Mode) */}
          <div className="flex flex-col gap-3 items-center">
            <Button
              size="lg"
              className="text-lg px-8 shadow-lg"
              onClick={() => navigate("/agent/register")}
            >
              {t('landing.hero.cta')}
            </Button>
            <button
              className="text-sm text-muted-foreground underline hover:no-underline hover:text-foreground transition-colors"
              onClick={() => navigate("/generate")}
            >
              {t('landing.hero.manual')}
            </button>
          </div>
        </div>
      </section>

      {/* Mode Comparison Table */}
      <section className="container mx-auto px-4 max-w-2xl pb-8">
        <div className="bg-muted/30 border border-border rounded-lg p-6">
          <p className="text-sm font-semibold text-foreground mb-4">{t('landing.compare.title')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">{t('landing.compare.need')}</th>
                <th className="text-left py-2 text-muted-foreground font-medium">{t('landing.compare.manual')}</th>
                <th className="text-left py-2 text-muted-foreground font-medium">{t('landing.compare.autopilot')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 text-foreground">{t('landing.compare.row1')}</td>
                <td className="text-green-500 font-medium">Yes</td>
                <td className="text-muted-foreground">—</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 text-foreground">{t('landing.compare.row2')}</td>
                <td className="text-muted-foreground">—</td>
                <td className="text-green-500 font-medium">Yes</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 text-foreground">{t('landing.compare.row3.label')}</td>
                <td className="text-foreground">{t('landing.compare.row3.manual')}</td>
                <td className="text-foreground">{t('landing.compare.row3.autopilot')}</td>
              </tr>
              <tr>
                <td className="py-3 text-foreground">{t('landing.compare.row4.label')}</td>
                <td className="text-foreground">{t('landing.compare.row4.manual')}</td>
                <td className="text-foreground">{t('landing.compare.row4.autopilot')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Visual Proof Section */}
      <section id="comparison" className="container mx-auto px-4 max-w-6xl py-12">
        <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">
          {t('landing.comparison.title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ChatGPT Output (Bad Example) */}
          <div className="bg-card border-2 border-destructive/30 rounded-lg shadow">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                <h3 className="text-xl font-semibold text-card-foreground">
                  {t('landing.comparison.generic')}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-muted p-4 rounded-md text-sm font-mono leading-relaxed text-card-foreground">
                <p className="font-medium mb-2">{t('landing.comparison.generic.subject')}</p>
                <p className="text-muted-foreground">{t('landing.comparison.generic.greeting')}</p>
                <p className="text-muted-foreground mt-2">
                  {t('landing.comparison.generic.body')}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.generic.flaw1')}</span>
                </p>
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.generic.flaw2')}</span>
                </p>
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.generic.flaw3')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ColdCopy Output (Good Example) */}
          <div className="bg-card border-2 border-success/30 rounded-lg shadow">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-card-foreground">
                  ColdCopy
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-muted p-4 rounded-md text-sm font-mono leading-relaxed text-card-foreground">
                <p className="font-medium mb-2">
                  {t('landing.comparison.coldcopy.subject')}
                </p>
                <p className="text-muted-foreground">{t('landing.comparison.coldcopy.greeting')}</p>
                <p className="text-muted-foreground mt-2">
                  {t('landing.comparison.coldcopy.body1')}
                </p>
                <p className="text-muted-foreground mt-2">
                  {t('landing.comparison.coldcopy.body2')}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.coldcopy.pro1')}</span>
                </p>
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.coldcopy.pro2')}</span>
                </p>
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{t('landing.comparison.coldcopy.pro3')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Mode Demo */}
      <AgentDemo onCta={() => navigate("/agent/register")} />

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-4xl">&#x26A1;</div>
            <h3 className="text-xl font-semibold text-foreground">
              {t('landing.benefit1.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.benefit1.desc')}
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="text-4xl">&#x1F3AF;</div>
            <h3 className="text-xl font-semibold text-foreground">
              {t('landing.benefit2.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.benefit2.desc')}
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="text-4xl">&#x1F4CB;</div>
            <h3 className="text-xl font-semibold text-foreground">
              {t('landing.benefit3.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('landing.benefit3.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 max-w-2xl py-16 text-center">
        <Button
          size="lg"
          className="text-lg px-8 shadow-lg"
          onClick={() => navigate("/agent/register")}
        >
          {t('landing.footer.cta2')}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          {t('landing.footer.note2')}
        </p>
        <button
          className="mt-2 text-sm text-muted-foreground underline hover:no-underline hover:text-foreground transition-colors"
          onClick={() => navigate("/generate")}
        >
          {t('landing.hero.manual')}
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4 flex justify-center gap-4">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
          <span>|</span>
          <span>ColdCopy {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

// --- Agent Mode Demo ---

const DEMO_STEPS = [
  {
    icon: Search,
    title: 'You describe your target',
    subtitle: 'Tell the agent who you want to reach',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    detail: {
      type: 'input' as const,
      fields: [
        { label: 'About You', value: 'PhD researcher at MIT, looking for post-doc positions in computational biology' },
        { label: 'Target Profile', value: 'Professors running computational biology labs at top 50 US universities' },
      ],
    },
  },
  {
    icon: Bot,
    title: 'Agent finds real leads',
    subtitle: 'AI-powered search finds actual people, not articles',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    detail: {
      type: 'leads' as const,
      leads: [
        { name: 'Dr. Sarah Chen', org: 'Stanford Bioengineering', email: 's.chen@stanford.edu', status: 'found' },
        { name: 'Prof. James Park', org: 'MIT CSAIL', email: 'jpark@mit.edu', status: 'found' },
        { name: 'Dr. Maria Rodriguez', org: 'UC Berkeley CompBio', email: 'mrodriguez@berkeley.edu', status: 'found' },
      ],
    },
  },
  {
    icon: Mail,
    title: 'AI writes personalized emails',
    subtitle: 'Each email references their specific research',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    detail: {
      type: 'email' as const,
      to: 'Dr. Sarah Chen <s.chen@stanford.edu>',
      subject: 'Your single-cell RNA-seq work + my spatial transcriptomics methods',
      body: "Hi Sarah,\n\nI read your recent Nature Methods paper on single-cell lineage tracing — the barcode integration approach is elegant.\n\nI'm finishing my PhD at MIT where I've developed spatial transcriptomics methods that could complement your lineage work. My pipeline handles 10x the cell throughput of current approaches.\n\nWould you have 15 minutes to discuss whether there's a fit for a post-doc in your lab?\n\nBest,\nAlex",
      countdown: 10,
    },
  },
  {
    icon: Send,
    title: 'Auto-approved & sent via your Gmail',
    subtitle: '10-second countdown — pause anytime to edit',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    detail: {
      type: 'sent' as const,
      stats: [
        { label: 'Emails Sent', value: '3' },
        { label: 'Open Rate', value: '67%' },
        { label: 'Time Spent', value: '0 min' },
      ],
    },
  },
  {
    icon: Reply,
    title: 'Reply detected — AI responds',
    subtitle: 'Agent reads replies, drafts follow-ups, sends automatically',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    detail: {
      type: 'reply' as const,
      incoming: {
        from: 'Dr. Sarah Chen',
        body: "Hi Alex, Thanks for reaching out. Your spatial transcriptomics work sounds interesting. I'd be happy to chat — are you free next Tuesday?",
        sentiment: 'positive',
      },
      aiReply: "Hi Sarah,\n\nThat's great to hear! Tuesday works perfectly. I'm available between 10am-2pm PT. Shall I send a calendar invite?\n\nLooking forward to it,\nAlex",
    },
  },
];

function AgentDemo({ onCta }: { onCta: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoPlay) return;
    intervalRef.current = setInterval(() => {
      setActiveStep(prev => (prev + 1) % DEMO_STEPS.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoPlay]);

  function selectStep(i: number) {
    setActiveStep(i);
    setAutoPlay(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  const step = DEMO_STEPS[activeStep];

  return (
    <section id="agent-demo" className="container mx-auto px-4 max-w-6xl py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium mb-4">
          <Zap className="w-3 h-3" /> Auto-Pilot Mode
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Your AI Sales Agent, Working 24/7
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Describe your target. The agent finds leads, writes personalized emails, sends them via your Gmail, and handles replies — all automatically.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Step timeline */}
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {DEMO_STEPS.map((s, i) => {
            const isActive = i === activeStep;
            const Icon = s.icon;
            return (
              <button
                key={i}
                onClick={() => selectStep(i)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all min-w-[200px] lg:min-w-0 ${
                  isActive
                    ? `${s.bg} border`
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? s.bg + ' border' : 'bg-muted'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? s.color : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate hidden lg:block">{s.subtitle}</p>
                </div>
                {i < DEMO_STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0 hidden lg:block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className={`rounded-xl border ${step.bg} p-6 min-h-[340px] transition-all`}>
          <div className="flex items-center gap-2 mb-4">
            <step.icon className={`w-5 h-5 ${step.color}`} />
            <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">{step.subtitle}</p>

          {step.detail.type === 'input' && (
            <div className="space-y-4">
              {step.detail.fields.map((f, i) => (
                <div key={i}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  <div className="mt-1 px-3 py-2.5 rounded-md bg-background/60 border border-border text-sm text-foreground">
                    {f.value}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Bot className="w-4 h-4 text-blue-400 animate-pulse" />
                Agent generating search queries...
              </div>
            </div>
          )}

          {step.detail.type === 'leads' && (
            <div className="space-y-2">
              {step.detail.leads.map((lead, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-background/60 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.org}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-400 font-mono">{lead.email}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-400">
                      <CheckCheck className="w-3 h-3" /> Personal email found
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Filtered out 12 generic results (news sites, aggregators). Only real contacts shown.
              </p>
            </div>
          )}

          {step.detail.type === 'email' && (
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-md bg-background/60 border border-border">
                <p className="text-xs text-muted-foreground">To: {step.detail.to}</p>
                <p className="text-xs font-medium text-foreground mt-1">Subject: {step.detail.subject}</p>
              </div>
              <div className="px-3 py-3 rounded-md bg-background/60 border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {step.detail.body}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-3/4 transition-all" />
                </div>
                <span className="text-sm font-mono text-purple-400">7s</span>
                <span className="text-xs text-muted-foreground">auto-approving...</span>
              </div>
            </div>
          )}

          {step.detail.type === 'sent' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {step.detail.stats.map((stat, i) => (
                  <div key={i} className="text-center px-3 py-4 rounded-lg bg-background/60 border border-border">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-green-500/10 border border-green-500/20">
                <CheckCheck className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">All emails sent successfully via Gmail</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Agent is now monitoring for replies. You&apos;ll see responses appear in your dashboard automatically.
              </p>
            </div>
          )}

          {step.detail.type === 'reply' && (
            <div className="space-y-3">
              {/* Incoming reply */}
              <div className="px-3 py-3 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-cyan-400">{step.detail.incoming.from}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-400 px-2 py-0.5 text-xs">
                    {step.detail.incoming.sentiment}
                  </span>
                </div>
                <p className="text-sm text-foreground">{step.detail.incoming.body}</p>
              </div>
              {/* AI response */}
              <div className="px-3 py-3 rounded-md bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">AI-drafted reply</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{step.detail.aiReply}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-1/2 transition-all" />
                </div>
                <span className="text-sm font-mono text-purple-400">5s</span>
                <span className="text-xs text-muted-foreground">auto-sending reply...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Button size="lg" className="text-lg px-8 shadow-lg" onClick={onCta}>
          Try Auto-Pilot Mode — Free (5 emails/day)
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          <strong>Free plan:</strong> 5 emails/day, perfect for testing.{' '}
          <strong>Pro:</strong> $29/month for 50/day. No credit card required.
        </p>
      </div>
    </section>
  );
}
