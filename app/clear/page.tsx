"use client";

import { useEffect } from "react";

export default function ClearCachePage() {
  useEffect(() => {
    // Break the Service Worker Death Loop
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        let promises = [];
        for (let registration of registrations) {
          promises.push(registration.unregister());
        }
        return Promise.all(promises);
      }).then(() => {
        // Clear local storage / session storage just in case
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to dashboard with a cache-busting timestamp
        window.location.replace("/dashboard?cleared=" + Date.now());
      }).catch((err) => {
        console.error("Service Worker removal failed: ", err);
        window.location.replace("/dashboard?cleared=" + Date.now());
      });
    } else {
      window.location.replace("/dashboard?cleared=" + Date.now());
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold text-text-primary mb-4 tracking-tighter">Fixing App Connection...</h1>
      <p className="text-sm text-text-muted font-bold tracking-widest uppercase animate-pulse">
        Purging corrupt offline caches. Automatically redirecting you in a moment!
      </p>
    </div>
  );
}
