import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "@assets/generated_images/sewnaija_app_logo_icon.png";

export default function Splash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl">
          <img src={logo} alt="SewNaija Logo" className="w-full h-full object-cover" />
        </div>
        
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-heading font-bold text-primary tracking-tight"
          >
            SewNaija
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-sm text-muted-foreground font-medium uppercase tracking-widest"
          >
            by Temzo007
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
