import React, { useState, useEffect } from "react";
import { BiDownload, BiX } from "react-icons/bi";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = localStorage.getItem("pwa-install-dismissed") === "true";
    
    // Check if app is already running in standalone display mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default prompt
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      // Show custom prompt if not dismissed
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Trigger prompt
    deferredPrompt.prompt();
    
    // Wait for response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[80px] left-4 right-4 md:left-auto md:right-6 md:w-[350px] md:bottom-[84px] z-40 animate-fadeIn">
      <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <BiDownload className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white tracking-wide">Install NovaTalk</h3>
            <p className="text-[10px] text-gray-400 truncate">Add to home screen for full standalone mode</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-[10px] transition-all duration-200 hover:scale-105 border-none cursor-pointer"
            aria-label="Install NovaTalk application"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200 border-none bg-transparent flex items-center justify-center cursor-pointer"
            aria-label="Dismiss install prompt"
          >
            <BiX className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
