import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'modal' | 'banner';
  onUpgradeClick?: (tier: 'starter' | 'pro') => void;
}

export function Paywall({ isOpen, onClose, onUpgradeClick }: PaywallProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const STARTER_LINK = 'https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01';
  const PRO_LINK = 'https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-lg max-w-4xl w-full mx-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              You've Reached Your Free Limit
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade to generate more cold email sequences
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Starter</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$19</span>
                <span className="text-muted-foreground ml-2">one-time</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">
                    <strong>50 email sequences</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">A/B subject line variants</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">SaaS-optimized copy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Copy-paste ready for any tool</span>
                </li>
              </ul>

              <a
                href={STARTER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onUpgradeClick?.('starter')}
              >
                <Button size="lg" variant="outline" className="w-full">
                  Get Starter
                </Button>
              </a>

              <p className="text-xs text-center text-muted-foreground">
                Perfect for testing ColdCopy
              </p>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-primary relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$39</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">
                    <strong>Unlimited</strong> sequences
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">A/B subject line variants</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">SaaS-optimized copy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">Copy-paste ready for any tool</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-foreground">
                    <strong>Priority support</strong>
                  </span>
                </li>
              </ul>

              <a
                href={PRO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onUpgradeClick?.('pro')}
              >
                <Button size="lg" className="w-full">
                  Go Pro
                </Button>
              </a>

              <p className="text-xs text-center text-muted-foreground">
                Best for serious outbound campaigns
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
