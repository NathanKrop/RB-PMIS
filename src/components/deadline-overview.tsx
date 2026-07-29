"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Deadline {
  id: string;
  reporting_period_name: string;
  reporting_period: string;
  due_date: string;
  reminder_days: number;
  escalation_days: number;
  departments: { name: string } | null;
  has_submission?: boolean;
}

function getDaysUntil(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const daysUntil = getDaysUntil(deadline.due_date);

  let borderColor = "border-l-green-500";
  let statusLabel = "Submitted";
  let statusVariant: "success" | "warning" | "destructive" = "success";
  let StatusIcon = CheckCircle2;

  if (deadline.has_submission) {
    borderColor = "border-l-green-500";
    statusLabel = "Submitted";
    statusVariant = "success";
    StatusIcon = CheckCircle2;
  } else if (daysUntil < 0) {
    borderColor = "border-l-red-500";
    statusLabel = "Overdue";
    statusVariant = "destructive";
    StatusIcon = AlertTriangle;
  } else if (daysUntil <= deadline.reminder_days) {
    borderColor = "border-l-amber-500";
    statusLabel = `${daysUntil}d remaining`;
    statusVariant = "warning";
    StatusIcon = Clock;
  } else {
    borderColor = "border-l-green-500";
    statusLabel = `${daysUntil}d remaining`;
    statusVariant = "success";
    StatusIcon = CalendarClock;
  }

  return (
    <Card className={cn("border-l-4 transition-colors", borderColor)}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium truncate">{deadline.reporting_period_name}</p>
              <Badge variant="outline" className="text-xs capitalize shrink-0">
                {deadline.reporting_period}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {deadline.departments?.name && <span>{deadline.departments.name}</span>}
              <span>
                Due: {new Date(deadline.due_date).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric"
                })}
              </span>
              {!deadline.has_submission && (
                <span className="text-destructive font-medium">No submission yet</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={statusVariant} className="gap-1 text-xs">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusLabel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeadlineOverview({
  deadlines,
  compact = false,
  title = "Upcoming Deadlines",
}: {
  deadlines: Deadline[];
  compact?: boolean;
  title?: string;
}) {
  const sorted = [...deadlines].sort((a, b) => {
    if (a.has_submission !== b.has_submission) return a.has_submission ? 1 : -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const displayData = compact ? sorted.slice(0, 5) : sorted;
  const overdue = deadlines.filter((d) => !d.has_submission && getDaysUntil(d.due_date) < 0).length;
  const dueSoon = deadlines.filter((d) => {
    const days = getDaysUntil(d.due_date);
    return !d.has_submission && days >= 0 && days <= d.reminder_days;
  }).length;

  if (deadlines.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <span className="text-xs text-muted-foreground">({deadlines.length})</span>
          </div>
          <div className="flex gap-2 text-xs">
            {overdue > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {overdue} overdue
              </Badge>
            )}
            {dueSoon > 0 && (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-3 w-3" /> {dueSoon} due soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines.</p>
        ) : (
          displayData.map((d) => <DeadlineCard key={d.id} deadline={d} />)
        )}
        {compact && deadlines.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{deadlines.length - 5} more deadline{deadlines.length - 5 === 1 ? "" : "s"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
