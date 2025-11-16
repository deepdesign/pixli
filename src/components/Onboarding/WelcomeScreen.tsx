import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { X, Sparkles, Palette, Zap, Camera } from "lucide-react";
import { markWelcomeSeen } from "@/lib/storage/onboardingStorage";

interface WelcomeScreenProps {
  onClose: () => void;
  onStartTour: () => void;
}

/**
 * WelcomeScreen Component
 * 
 * First-time user welcome screen with:
 * - Friendly introduction
 * - Quick feature overview
 * - Options to start tour or skip
 */
export function WelcomeScreen({ onClose, onStartTour }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    markWelcomeSeen();
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for fade out
  };

  const handleTakeTour = () => {
    markWelcomeSeen();
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      onStartTour();
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <Card
        className="w-full max-w-lg p-6 max-h-[80vh] overflow-auto"
        style={{
          transform: isVisible ? "scale(1)" : "scale(0.95)",
          transition: "transform 0.2s ease",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold uppercase tracking-wider">
              Welcome to Pixli!
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetStarted}
            aria-label="Close welcome screen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm leading-relaxed">
            Create beautiful, animated pixel art with just a few clicks! 
            Choose shapes, pick colours, and watch your canvas come to life.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <Palette className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase mb-1">Colours</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Pick from 20+ colour palettes or create your own
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <Zap className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase mb-1">Animation</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Choose how your shapes move and dance
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <Sparkles className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase mb-1">Shapes</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Try circles, stars, hexagons, and more
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <Camera className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase mb-1">Export</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Save your art as high-quality images
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="default"
            onClick={handleGetStarted}
            className="flex-1"
          >
            Get Started
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTakeTour}
            className="flex-1"
          >
            Take a Tour
          </Button>
        </div>
      </Card>
    </div>
  );
}

