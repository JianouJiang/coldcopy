import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopNav } from '@/components/agent/TopNav';
import { Check, Zap, Crown, Building2, ArrowLeft } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Zap,
    iconColor: 'text-gray-400',
    borderColor: 'border-border',
    description: 'Get started with cold outreach',
    features: [
      '5 emails per day',
      '2 campaigns',
      '4 reply rounds per thread',
      'AI email generation',
      'AI reply analysis',
      'Gmail integration',
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    highlight: true,
    description: 'For serious outbound teams',
    features: [
      '50 emails per day',
      '20 campaigns',
      '20 reply rounds per thread',
      'Everything in Free',
      'Priority email delivery',
      'Advanced analytics',
    ],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    icon: Building2,
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    description: 'Unlimited scale',
    features: [
      '500 emails per day',
      '100 campaigns',
      '100 reply rounds per thread',
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Upgrade to Enterprise',
    ctaDisabled: false,
  },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUser)
      .catch(() => navigate('/agent/login'));
  }, []);

  async function handleUpgrade(planId: string) {
    if (planId === user?.plan) return;
    setUpgrading(planId);
    try {
      const res = await fetch('/api/agent/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      if (res.ok) {
        setSuccess(true);
        setUser((prev: any) => ({ ...prev, plan: planId }));
        // Navigate back after a short delay so user sees the success message
        setTimeout(() => navigate(-1), 1500);
      }
    } catch {} finally {
      setUpgrading(null);
    }
  }

  const currentPlan = user?.plan || 'free';

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Scale your cold outreach with more emails, campaigns, and reply rounds</p>
          {success && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
              <Check className="w-4 h-4" /> Plan updated successfully!
            </div>
          )}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            Test Mode — All upgrades are free during beta
          </div>
        </div>

        {/* Usage Stats */}
        {user?.usage && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{user.usage.emails_sent_today}</p>
              <p className="text-xs text-muted-foreground">Emails today / {user.limits?.max_emails_per_day || 5}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{user.usage.campaigns}</p>
              <p className="text-xs text-muted-foreground">Campaigns / {user.limits?.max_campaigns || 2}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{user.usage.total_emails_sent}</p>
              <p className="text-xs text-muted-foreground">Total emails sent</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{user.usage.total_replies}</p>
              <p className="text-xs text-muted-foreground">Total replies</p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isDowngrade = plans.findIndex(p => p.id === currentPlan) > plans.findIndex(p => p.id === plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${plan.borderColor} ${
                  plan.highlight ? 'ring-1 ring-amber-500/50' : ''
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-br-lg">
                    CURRENT
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <plan.icon className={`w-5 h-5 ${plan.iconColor}`} />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : plan.highlight ? 'default' : 'outline'}
                    disabled={isCurrent || upgrading !== null}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Upgrading...
                      </span>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : isDowngrade ? (
                      `Switch to ${plan.name}`
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">FAQ</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-1">What counts as a "reply round"?</p>
              <p className="text-sm text-muted-foreground">Each time a lead replies to your email and the AI analyzes + suggests a response, that's one round. On the Free plan, the AI handles up to 4 back-and-forth exchanges per thread.</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Can I downgrade later?</p>
              <p className="text-sm text-muted-foreground">Yes, you can switch plans anytime. Existing campaigns and data are never deleted.</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Is this really free during beta?</p>
              <p className="text-sm text-muted-foreground">Yes! During the beta period, all plans are free. We'll notify you before enabling billing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
