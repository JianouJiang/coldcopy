import { useState } from 'react';
import { ChevronDown, ChevronUp, MousePointerClick } from 'lucide-react';

/**
 * Animated visual guide for Google's "unverified app" OAuth warning.
 * Shows a mock of the Google warning screen with pulsing indicators
 * showing users exactly where to click.
 */
export function GoogleAuthGuide({ compact = false }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-xs text-center text-muted-foreground/70 hover:text-muted-foreground transition-colors flex items-center justify-center gap-1 py-1"
      >
        <ChevronDown className="w-3 h-3" />
        See "app not verified" warning? Click here for help
      </button>
    );
  }

  return (
    <div className="w-full">
      {compact && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full text-xs text-center text-muted-foreground/70 hover:text-muted-foreground transition-colors flex items-center justify-center gap-1 py-1 mb-2"
        >
          <ChevronUp className="w-3 h-3" />
          Hide guide
        </button>
      )}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
        <p className="text-xs font-medium text-amber-400 text-center">
          Google will show a safety warning — here's how to proceed:
        </p>

        {/* Step 1: The Google warning screen mockup */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            <span className="text-xs text-foreground font-medium">Click "Advanced" at the bottom</span>
          </div>
          <div className="ml-7 rounded-md border border-border bg-background p-3 relative overflow-hidden">
            {/* Mock Google warning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-blue-400">G</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Google</span>
              </div>
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-xs text-center text-foreground font-medium">This app isn't verified</p>
              <p className="text-[10px] text-center text-muted-foreground">This app hasn't been verified by Google yet...</p>
              <div className="flex justify-center gap-2 mt-3">
                <div className="px-3 py-1.5 rounded-md bg-muted text-[10px] text-muted-foreground">Back to safety</div>
                <div className="relative">
                  <div className="px-3 py-1.5 rounded-md border border-blue-500/50 bg-blue-500/10 text-[10px] text-blue-400 font-medium">
                    Advanced
                  </div>
                  {/* Pulsing click indicator */}
                  <div className="absolute -right-1 -bottom-1">
                    <MousePointerClick className="w-4 h-4 text-amber-400 animate-bounce" />
                  </div>
                  <div className="absolute inset-0 rounded-md border-2 border-amber-400/60 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: After clicking Advanced */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            <span className="text-xs text-foreground font-medium">Click "Go to ColdCopy (unsafe)"</span>
          </div>
          <div className="ml-7 rounded-md border border-border bg-background p-3 relative overflow-hidden">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">Google hasn't verified this app. Proceed only if you know and trust the developer.</p>
              <div className="relative inline-block">
                <div className="px-3 py-1.5 rounded-md border border-blue-500/50 bg-blue-500/10 text-[10px] text-blue-400 font-medium">
                  Go to ColdCopy (unsafe)
                </div>
                {/* Pulsing click indicator */}
                <div className="absolute -right-1 -bottom-1">
                  <MousePointerClick className="w-4 h-4 text-amber-400 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-md border-2 border-amber-400/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Allow permissions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
            <span className="text-xs text-foreground font-medium">Click "Continue" to grant permissions</span>
          </div>
          <div className="ml-7 rounded-md border border-border bg-background p-3">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">ColdCopy wants to access your Google Account</p>
              <div className="space-y-1 ml-2">
                <p className="text-[10px] text-muted-foreground">✓ Send email on your behalf</p>
                <p className="text-[10px] text-muted-foreground">✓ Read email messages (for reply tracking)</p>
              </div>
              <div className="relative inline-block">
                <div className="px-3 py-1.5 rounded-md bg-blue-600 text-[10px] text-white font-medium">
                  Continue
                </div>
                <div className="absolute -right-1 -bottom-1">
                  <MousePointerClick className="w-4 h-4 text-green-400 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/70">
          This warning is normal for new apps. ColdCopy only uses Gmail to send and read your outreach emails.
        </p>
      </div>
    </div>
  );
}
