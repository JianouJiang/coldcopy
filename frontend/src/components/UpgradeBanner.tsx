import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface UpgradeBannerProps {
  onUpgradeClick: () => void;
}

export function UpgradeBanner({ onUpgradeClick }: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-medium text-foreground">
                You've generated 3+ sequences!
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to generate unlimited sequences + advanced features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onUpgradeClick}
              className="bg-primary hover:bg-primary/90"
            >
              Upgrade Now
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
