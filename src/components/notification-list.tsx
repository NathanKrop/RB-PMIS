"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Info, AlertTriangle, Clock } from "lucide-react";
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

const typeIcon = {
  info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
  reminder: <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  escalation: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
};

const typeLabel = { info: "Info", reminder: "Reminder", escalation: "Escalation" };
const typeVariant: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
  info: "secondary",
  reminder: "warning",
  escalation: "destructive",
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

const FILTERS = ["all", "unread", "info", "reminder", "escalation"] as const;
type Filter = typeof FILTERS[number];

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "all") return true;
    return n.notification_type === filter;
  });

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    startTransition(() => markNotificationRead(id));
  }

  function handleMarkAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="capitalize h-8"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "unread" ? `Unread (${unreadCount})` : typeLabel[f as keyof typeof typeLabel]}
            </Button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={handleMarkAll} disabled={isPending}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No notifications{filter !== "all" ? ` in "${filter}"` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={cn(!n.read && "border-primary/30 bg-muted/40")}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {typeIcon[n.notification_type]}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className={cn("text-sm font-medium", !n.read && "text-foreground")}>{n.title}</p>
                      <Badge variant={typeVariant[n.notification_type]} className="text-xs capitalize">
                        {typeLabel[n.notification_type]}
                      </Badge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
