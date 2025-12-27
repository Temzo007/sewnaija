import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smartphone, CheckCircle2 } from "lucide-react";
import logo from "@assets/generated_images/sewnaija_app_logo_icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect standalone (installed) mode
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
    // ✅ Skip install screen if app is already installed
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
      alert(
        "Install is not available right now. You can continue in the browser or add the app to your home screen."
      );
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
        alert(
          "Installation was cancelled. You can continue using SewNaija in the browser."
        );
        onInstalled();
      }
    } catch {
      alert(
        "Installation failed. Please add the app to your home screen manually."
      );
      onInstalled();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSkip = () => {
    onInstalled();
  };

  // ✅ App Installed Screen
  if (installed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">App Installed</h1>
          <p className="text-muted-foreground">
            SewNaija has been installed successfully.
          </p>
          <Button
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            Open SewNaija App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 max-w-sm text-center"
      >
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl">
          <img src={logo} alt="SewNaija Logo" />
        </div>

        <h1 className="text-3xl font-bold text-primary">SewNaija</h1>
        <p className="text-muted-foreground text-sm">
          Fashion Design Manager
        </p>

        {/* iOS Instructions */}
        {
