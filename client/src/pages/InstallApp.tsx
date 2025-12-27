import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Smartphone } from "lucide-react";
import logo from "@assets/generated_images/sewnaija_app_logo_icon.png";

/* ---------- Types ---------- */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ---------- Helpers ---------- */
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

export default function InstallApp({
  onInstalled,
}: {
  onInstalled: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  /* ---------- On Mount ---------- */
  useEffect(() => {
    // If already installed → skip
    if (isStandalone()) {
      onInstalled();
      return;
    }

    // iOS detect
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detect successful install
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  /* ---------- Install ---------- */
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (!deferredPrompt) {
      alert(
        "Install is not available right now. You can add the app to your home screen manually."
      );
      setShowIOSHelp(true);
      setTimeout(onInstalled, 500);
      return;
    }

    setIsInstalling(true);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    } else {
      alert(
        "Install was cancelled. You can still continue using the app in your browser."
      );
      onInstalled();
    }

    setIsInstalling(false);
  };

  /* ---------- Open App ---------- */
  const openApp = () => {
    window.location.href = import.meta.env.BASE_URL;
  };

  /* ---------- INSTALLED SCREEN ---------- */
  if (installed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">App Installed</h1>
          <Button onClick={openApp} className="w-full">
            Open SewNaija
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- INSTALL SCREEN ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-6 text-center"
      >
        <img
          src={logo}
          alt="SewNaija"
          className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
        />

        <h1 className="text-3xl font-bold text-primary">SewNaija</h1>
        <p className="text-muted-foreground text-sm">
          Fashion Design Manager (Works 100% Offline)
        </p>

        {/* iOS Instructions */}
        {showIOSHelp && (
          <div className="bg-card border rounded-xl p-4 text-sm text-left space-y-2">
            <p className="font-semibold">Install on iPhone / iPad:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Open in Safari</li>
              <li>Tap Share</li>
              <li>Add to Home Screen</li>
            </ol>
            <Button onClick={onInstalled} className="w-full mt-3">
              Continue in Browser
            </Button>
          </div>
        )}

        {!showIOSHelp && (
          <>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full"
            >
              {isInstalling ? "Installing..." : "Install App"}
            </Button>

            <Button
              variant="ghost"
              onClick={onInstalled}
              className="w-full text-muted-foreground"
            >
              Continue in Browser
            </Button>
          </>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Smartphone className="w-3 h-3" />
          Works best when installed
        </div>
      </motion.div>
    </div>
  );
}
