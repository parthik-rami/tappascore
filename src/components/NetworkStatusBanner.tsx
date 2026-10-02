import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      className={`w-full py-1.5 px-4 text-center text-xs font-mono font-bold uppercase transition-colors ${
        isOffline
          ? 'bg-amber-500/10 border-b border-amber-500/30 text-amber-400'
          : 'bg-[#00E676]/10 border-b border-[#00E676]/30 text-[#00E676]'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>OFFLINE MODE — Cached shell active. Live scoring requires internet connection.</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>CONNECTION RESTORED — Syncing live scoring session...</span>
          </>
        )}
      </div>
    </div>
  );
};
