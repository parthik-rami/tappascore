import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check dismissal status
    const dismissedAt = localStorage.getItem('tappascore_pwa_dismissed');
    if (dismissedAt) {
      // Re-prompt after 7 days if dismissed
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('tappascore_pwa_dismissed', Date.now().toString());
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      {/* Polished Floating Banner */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-[#151515] border border-[#00E676]/40 p-4 shadow-2xl animate-fadeIn text-[#F5F5F0]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/tappascore-192.png"
              alt="TappaScore Icon"
              className="w-10 h-10 rounded-sm border border-[#00E676]/40 object-cover shrink-0"
            />
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-wider">Install TappaScore</h4>
              <p className="text-[11px] font-mono text-[#8A8A8A]">Fast ground scoring & live stats app.</p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-[#5F5F5F] hover:text-white p-1"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="w-full bg-[#00E676] hover:bg-[#00c865] text-black py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111111] border border-[#292929] max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-[#0B0B0B] border border-[#00E676] mx-auto flex items-center justify-center">
              <Share className="w-6 h-6 text-[#00E676]" />
            </div>

            <h3 className="text-base font-black uppercase text-white">Add to Home Screen</h3>
            <p className="text-xs font-mono text-[#8A8A8A] leading-relaxed">
              Safari on iOS requires manual installation:
            </p>

            <ol className="text-left text-xs font-mono text-white space-y-2 bg-[#171717] p-3 border border-[#292929]">
              <li className="flex items-center gap-2">
                <span className="text-[#00E676] font-bold">1.</span> Tap the <Share className="w-3.5 h-3.5 inline text-[#00E676]" /> Share button in Safari toolbar.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00E676] font-bold">2.</span> Scroll down and tap <span className="text-[#00E676] font-bold">'Add to Home Screen'</span>.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00E676] font-bold">3.</span> Launch TappaScore directly from your home screen.
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-[#292929] hover:bg-[#333333] text-white py-2 text-xs font-mono uppercase font-bold"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
