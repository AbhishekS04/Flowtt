"use client";

import { useEffect, useState, useCallback } from "react";
import { verifyBiometricLock, isBiometricLockEnabled } from "@/lib/webauthn";

export default function AppLockWrapper({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const checkLock = useCallback(() => {
    if (isBiometricLockEnabled()) {
      setIsLocked(true);
    }
  }, []);

  useEffect(() => {
    checkLock();
    setIsReady(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkLock]);

  const handleUnlock = async () => {
    const success = await verifyBiometricLock();
    if (success) {
      setIsLocked(false);
    }
  };

  useEffect(() => {
    if (isLocked && isReady) {
      handleUnlock();
    }
  }, [isLocked, isReady]);

  if (!isReady) return <>{children}</>;

  return (
    <>
      {isLocked && (
        <div className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center p-6 bg-black" style={{ backgroundColor: '#000000' }}>
          <div className="text-text-primary mb-6 bg-border p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-text-primary mb-2">Trackr Locked</h1>
          <p className="text-text-muted text-[10px] text-center mb-10 uppercase tracking-widest font-bold">Scan fingerprint or face to view privacy sensitive data</p>
          <button 
            onClick={handleUnlock}
            className="bg-primary text-bg font-bold py-3.5 px-8 text-[10px] uppercase tracking-widest active:scale-95 transition-all w-full max-w-xs"
          >
            Unlock Now
          </button>
        </div>
      )}
      <div className={isLocked ? "fixed inset-0 opacity-0 pointer-events-none" : "contents"}>
        {children}
      </div>
    </>
  );
}
