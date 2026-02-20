import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-border">
        <CardContent className="p-12 text-center space-y-8">
          {/* Cancel Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <XCircle className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>

          {/* Cancel Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Payment Cancelled
            </h1>
            <p className="text-lg text-muted-foreground">
              No worries! You can upgrade anytime.
            </p>
          </div>

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-6 text-left">
            <p className="text-muted-foreground">
              You still have access to your <strong>free generation</strong>.
              Come back anytime you're ready to generate more sequences.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/generate')}
            >
              Back to ColdCopy
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
