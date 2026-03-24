"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { checkBudgetAlerts, BudgetAlertData } from "@/lib/notifications";

interface NotificationBannerProps {
  data: BudgetAlertData;
}

export default function NotificationBanner({ data }: NotificationBannerProps) {
  const alerts = checkBudgetAlerts(data);
  const topAlert = alerts[0] ?? null;

  useEffect(() => {
    const sessionKey = `trackr-notified-${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const prefs = JSON.parse(localStorage.getItem("trackr-notif-prefs") ?? "{}");
    const notifyBudget = prefs.notifyBudget !== false;
    const notifyCategory = prefs.notifyCategory !== false;

    for (const alert of alerts) {
      const isCategoryAlert = alert.message.includes("overspending on");
      if (isCategoryAlert && !notifyCategory) continue;
      if (!isCategoryAlert && !notifyBudget) continue;

      if (alert.type === "error") toast.error(alert.message);
      else if (alert.type === "warning") toast.warning(alert.message);
      else toast.success(alert.message);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Trackr Alert", {
          body: alert.message,
          icon: "/apple-icon.png",
        });
      }
    }

    sessionStorage.setItem(sessionKey, "1");
  }, [alerts]);

  if (!topAlert) return null;

  return (
    <div className={`border border-border bg-card px-5 py-4 text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-4`}>
      <span className="text-xl leading-none">
        {topAlert.type === "error" ? "!" : topAlert.type === "warning" ? "!" : "✓"}
      </span>
      {topAlert.message}
    </div>
  );
}
