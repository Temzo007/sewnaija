import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import logo from "@assets/generated_images/sewnaija_app_logo_icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp({ onInstalled }: { onInstalled: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowManualInstructions(true);
      return;
    }

    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setTimeout(() => onInstalled(), 1000);
      } else {
        setIsInstalling(false);
      }
    } else {
      // Fallback: show manual instructions for all platforms
      setShowManualInstructions(true);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem('sewnaija_seen_install', 'true');
    onInstalled();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background text-foreground p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 max-w-sm text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50"
        >
          <img src={logo} alt="SewNaija Logo" className="w-full h-full object-cover" />
        </motion.div>

        {/* App Info */}
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-4xl font-heading font-bold text-primary tracking-tight"
          >
            SewNaija
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-muted-foreground text-sm"
          >
            Fashion Design Manager
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-xs text-muted-foreground/70 font-medium uppercase tracking-widest"
          >
            by Temzo007
          </motion.p>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col gap-2 text-sm text-left w-full bg-card/50 rounded-xl p-4 border"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Manage customers & orders</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Track measurements & styles</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Works 100% offline</span>
          </div>
        </motion.div>

        {/* Manual Install Instructions */}
        {showManualInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-secondary/20 rounded-xl p-4 text-sm space-y-3 w-full"
          >
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span className="font-medium">Install manually</span>
            </div>
            <ol className="text-left text-muted-foreground space-y-2 list-decimal list-inside text-xs">
              {isIOS ? (
                <>
                  <li>Tap the <strong>Share</strong> button in Safari</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> to confirm</li>
                </>
              ) : (
                <>
                  <li>Click the <strong>install icon</strong> (⊕) in the address bar, or</li>
                  <li>Open the browser menu (⋮) and select <strong>"Install SewNaija"</strong></li>
                </>
              )}
            </ol>
            <Button onClick={handleSkip} variant="secondary" className="w-full mt-2">
              Continue to App
            </Button>
          </motion.div>
        )}

        {/* Install Button */}
        {!showManualInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="w-full space-y-3"
          >
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full"
              size="lg"
            >
              {isInstalling ? "Installing..." : "Install App"}
            </Button>
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Continue in Browser
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 flex items-center gap-2 text-xs text-muted-foreground/50"
      >
        <Smartphone className="w-3 h-3" />
        <span>Works best when installed</span>
      </motion.div>
    </div>
  );
}
