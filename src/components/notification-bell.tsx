"use client";

import { useState, useTransition } from "react";
import { Bell, Check, CheckCheck, Info, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  notification_type: "reminder" | "escalation" | "info";
  created_at: string;
}

interface NotificationBellProps {
  notifications: Notification[];
}

const typeIcon = {
  info: <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />,
  reminder: <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
  escalation: <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    startTransition(() => markNotificationRead(id));
  }

  function handleMarkAll() {
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border bg-card shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleMarkAll}
                  disabled={isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-2.5 px-4 py-3 text-sm transition-colors",
                      !n.read && "bg-muted/50"
                    )}
                  >
                    {typeIcon[n.notification_type]}
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium leading-snug", !n.read && "text-foreground")}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={isPending}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
