import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Email {
  subjectLineA: string;
  subjectLineB: string;
  body: string;
}

interface Sequence {
  emails: Email[];
}

export default function Output() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sequence');
    if (!stored) {
      navigate('/generate');
      return;
    }

    try {
      setSequence(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to parse sequence:', error);
      navigate('/generate');
    }
  }, [navigate]);

  const copyToClipboard = (index: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast({
        message: 'Copied to clipboard!',
        type: 'success',
        duration: 2000,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  if (!sequence) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/generate')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Generate Another Sequence
            </button>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Your Cold Email Sequence
              </h1>
              <p className="text-muted-foreground">
                Copy-paste ready for Lemlist, Instantly, Apollo, or your email tool
              </p>
            </div>
          </div>

          {/* Emails */}
          <div className="space-y-6">
            {sequence.emails.map((email, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">Email {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subject Line A */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Subject Line A (Variant 1)
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`subj-a-${idx}`, email.subjectLineA)}
                        className={
                          copiedIndex === `subj-a-${idx}`
                            ? 'bg-green-500/20 border-green-500'
                            : ''
                        }
                      >
                        {copiedIndex === `subj-a-${idx}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-sm text-foreground">{email.subjectLineA}</p>
                    </div>
                  </div>

                  {/* Subject Line B */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Subject Line B (Variant 2)
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`subj-b-${idx}`, email.subjectLineB)}
                        className={
                          copiedIndex === `subj-b-${idx}`
                            ? 'bg-green-500/20 border-green-500'
                            : ''
                        }
                      >
                        {copiedIndex === `subj-b-${idx}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <p className="text-sm text-foreground">{email.subjectLineB}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Email Body
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`body-${idx}`, email.body)}
                        className={
                          copiedIndex === `body-${idx}` ? 'bg-green-500/20 border-green-500' : ''
                        }
                      >
                        {copiedIndex === `body-${idx}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border border-border whitespace-pre-wrap">
                      <p className="text-sm text-foreground font-mono">{email.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Want More Sequences?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Upgrade to generate unlimited sequences with custom variations and advanced features.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Upgrade Now
            </Button>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/generate')}
            >
              Generate Another Sequence
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
