import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Track conversion event (if analytics is set up)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: sessionId || Date.now(),
        currency: 'USD',
        items: [{ item_name: 'ColdCopy Subscription' }],
      });
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border">
        <CardContent className="p-12 text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-xl text-muted-foreground">
              Thank you for upgrading to ColdCopy Pro
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left">
            <h2 className="text-lg font-semibold text-foreground">
              What happens next?
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-primary mr-2 mt-1">1.</span>
                <span>
                  Check your email for payment confirmation from Stripe
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 mt-1">2.</span>
                <span>
                  Your quota will be upgraded within <strong>24 hours</strong> (manual process for MVP)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 mt-1">3.</span>
                <span>
                  You'll receive a welcome email with instructions to start generating unlimited sequences
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 mt-1">4.</span>
                <span>
                  Need help? Reply to the welcome email or contact support
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/generate')}
            >
              Return to ColdCopy
            </Button>
            <p className="text-sm text-muted-foreground">
              Your transaction ID: <code className="text-xs">{sessionId || 'N/A'}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
