import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'modal' | 'banner';
  onUpgradeClick?: (tier: 'monthly' | 'lifetime') => void;
}

export function Paywall({ isOpen, onUpgradeClick }: PaywallProps) {

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // LIVE Stripe Payment Links (created 2026-02-22)
  const MONTHLY_LINK = 'https://buy.stripe.com/cNieVd0SHbFjfNI7cW0VO0e';
  const LIFETIME_LINK = 'https://buy.stripe.com/cNi8wP7h5eRv7hc8h00VO0f';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-4xl w-full mx-auto shadow-2xl">
        {/* Header - NO CLOSE BUTTON */}
        <div className="p-6 border-b border-border text-center">
          <h2 className="text-2xl font-bold text-foreground">
            You've used your 3 free sequences
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Continue with unlimited sequences
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Monthly</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$19</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Unlimited cold email sequences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">AI-powered personalization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">7-email sequence generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Cancel anytime</span>
                </li>
              </ul>

              <a
                href={MONTHLY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onUpgradeClick?.('monthly')}
              >
                <Button size="lg" variant="outline" className="w-full">
                  Subscribe Monthly
                </Button>
              </a>

              <p className="text-xs text-center text-muted-foreground">
                Billed monthly. Cancel anytime.
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Plan */}
          <Card className="border-2 border-primary relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Best Value
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Lifetime</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$49</span>
                <span className="text-muted-foreground ml-2">one-time</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Unlimited cold email sequences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">AI-powered personalization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">7-email sequence generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Lifetime access - pay once, use forever</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground"><strong>Save $180+ vs monthly</strong></span>
                </li>
              </ul>

              <a
                href={LIFETIME_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onUpgradeClick?.('lifetime')}
              >
                <Button size="lg" className="w-full">
                  Get Lifetime Access
                </Button>
              </a>

              <p className="text-xs text-center text-muted-foreground">
                One-time payment. No recurring charges.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Secure payment powered by{' '}
            <span className="font-medium text-foreground">Stripe</span>
          </p>
        </div>
      </div>
    </div>
  );
}
