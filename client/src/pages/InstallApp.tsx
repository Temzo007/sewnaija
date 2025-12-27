import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smartphone, CheckCircle2 } from "lucide-react";
import logo from "@assets/generated_images/sewnaija_app_logo_icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      onInstalled();
      return;
    }

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      alert("Install not available. Continuing in browser.");
      onInstalled();
      return;
    }

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setInstalled(true);
      } else {
        onInstalled();
      }
    } catch {
      onInstalled();
    } finally {
      setIsInstalling(false);
    }
  };

  if (installed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-xl font-bold">App Installed</h2>
          <Button onClick={() => (window.location.href = "/")}>
            Open App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center space-y-6"
      >
        <img
          src={logo}
          alt="SewNaija"
          className="w-24 h-24 mx-auto rounded-2xl shadow"
        />

        <h1 className="text-2xl font-bold">SewNaija</h1>
        <p className="text-muted-foreground text-sm">
          Fashion Design Manager
        </p>

        {showIOSInstructions ? (
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p className="font-semibold">Install on iOS:</p>
            <ol className="list-decimal list-inside text-left">
              <li>Tap Share</li>
              <li>Select “Add to Home Screen”</li>
              <li>Tap Add</li>
            </ol>
            <Button onClick={onInstalled} className="w-full mt-2">
              Continue
            </Button>
          </div>
        ) : (
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
              className="w-full"
            >
              Continue in Browser
            </Button>
          </>
        )}

        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Smartphone className="w-3 h-3" />
          Best experience when installed
        </div>
      </motion.div>
    </div>
  );
}
