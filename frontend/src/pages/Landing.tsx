import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 max-w-4xl py-16 md:py-24">
        <div className="text-center space-y-6">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Cold Email Sequences That Actually Book Meetings
          </h1>

          {/* Sub-headline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Optimized for B2B SaaS Founders. Not generic templates—SaaS-specific sequences
            with trial CTAs, demo hooks, and technical credibility builders.
          </p>

          {/* Social Proof */}
          <p className="text-sm text-muted-foreground">
            Used by 50+ bootstrapped founders
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-8 shadow-lg"
              onClick={() => navigate("/generate")}
            >
              Generate My First Sequence (Free)
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-lg"
              onClick={() => {
                document.getElementById("comparison")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See Sample Sequences
            </Button>
          </div>
        </div>
      </section>

      {/* Visual Proof Section */}
      <section id="comparison" className="container mx-auto px-4 max-w-6xl py-12">
        <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">
          Not Just Another AI Email Writer
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ChatGPT Output (Bad Example) */}
          <div className="bg-card border-2 border-destructive/30 rounded-lg shadow">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                <h3 className="text-xl font-semibold text-card-foreground">
                  Generic AI Tool
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-muted p-4 rounded-md text-sm font-mono leading-relaxed text-card-foreground">
                <p className="font-medium mb-2">Subject: Exciting opportunity for your business!</p>
                <p className="text-muted-foreground">Hi there,</p>
                <p className="text-muted-foreground mt-2">
                  I hope this email finds you well. I wanted to reach out because I think
                  our amazing product could be a game-changer for your company...
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Buzzwords ("game-changer", "exciting")</span>
                </p>
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>No specificity—could be any product</span>
                </p>
                <p className="text-xs text-destructive flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Cliché opener ("hope this finds you well")</span>
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
                  Subject: Are 60% of your carts abandoned in &lt;10 seconds?
                </p>
                <p className="text-muted-foreground">Hi Sarah,</p>
                <p className="text-muted-foreground mt-2">
                  I noticed Acme Store is in the DTC e-commerce space. Quick question: do you track
                  why shoppers abandon carts in the first 10 seconds?
                </p>
                <p className="text-muted-foreground mt-2">
                  Most brands lose 30-40% of revenue to cart abandonment, but the data sits in
                  Google Analytics as a black box...
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Specific pain point (cart abandonment)</span>
                </p>
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Quantified problem (60%, 10 seconds)</span>
                </p>
                <p className="text-xs text-success flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>SaaS-aware (mentions analytics, trials)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-4xl">⚡</div>
            <h3 className="text-xl font-semibold text-foreground">
              2 Minutes to Sequences
            </h3>
            <p className="text-sm text-muted-foreground">
              Fill out 7 fields, get 5 emails with A/B subject lines. No fluff, no friction.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="text-4xl">🎯</div>
            <h3 className="text-xl font-semibold text-foreground">
              SaaS-Specific Language
            </h3>
            <p className="text-sm text-muted-foreground">
              Trial CTAs, demo hooks, integration mentions. Speaks your customers' language.
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="text-4xl">📋</div>
            <h3 className="text-xl font-semibold text-foreground">
              Copy-Paste Ready
            </h3>
            <p className="text-sm text-muted-foreground">
              Drop into Lemlist, Instantly, or Apollo. Personalize merge tags and send.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 max-w-2xl py-16 text-center">
        <Button
          size="lg"
          className="text-lg px-8 shadow-lg"
          onClick={() => navigate("/generate")}
        >
          Generate My First Sequence (Free)
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          No account required. See results in 15 seconds.
        </p>
      </section>
    </div>
  );
}
