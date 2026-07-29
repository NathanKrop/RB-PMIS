"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarClock } from "lucide-react";
import { runDeadlineScheduler } from "@/lib/actions";

export function DeadlineSchedulerButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await runDeadlineScheduler();
      if (result?.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        const created = (result as { notifications_created?: number; data?: number })?.notifications_created ?? result?.data ?? 0;
        setMessage(`Deadline scheduler completed. Notifications created: ${created}`);
      }
    } catch {
      setMessage(`Error running scheduler.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" variant="secondary" onClick={handleRun} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        <span>{loading ? "Running…" : "Run Scheduler"}</span>
      </Button>
      {message ? <p className="text-xs text-muted-foreground max-w-xs text-right">{message}</p> : null}
    </div>
  );
}
