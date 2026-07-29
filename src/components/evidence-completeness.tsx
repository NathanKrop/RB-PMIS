"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EvidenceCompletenessItem {
  reportName: string;
  reportPeriod: string;
  departmentName: string;
  evidenceCount: number;
  hasEvidence: boolean;
}

export function EvidenceCompletenessOverview({
  items,
  compact = false,
  title = "Evidence Completeness",
}: {
  items: EvidenceCompletenessItem[];
  compact?: boolean;
  title?: string;
}) {
  const total = items.length;
  const withEvidence = items.filter((i) => i.hasEvidence).length;
  const withoutEvidence = items.filter((i) => !i.hasEvidence).length;
  const completenessPct = total > 0 ? Math.round((withEvidence / total) * 100) : 0;

  if (total === 0) return null;

  const displayItems = compact ? items.slice(0, 5) : items;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <span className="text-xs text-muted-foreground">({total})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn("font-semibold", completenessPct >= 80 ? "text-green-600" : completenessPct >= 50 ? "text-amber-500" : "text-destructive")}>
              {completenessPct}%
            </span>
            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: completenessPct + "%", backgroundColor: completenessPct >= 80 ? "#22c55e" : completenessPct >= 50 ? "#f59e0b" : "#ef4444" }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {withEvidence} of {total} reports have supporting evidence
          {withoutEvidence > 0 && (
            <span className="text-destructive"> &middot; {withoutEvidence} missing evidence</span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayItems.map((item, i) => (
          <div key={i} className={cn("flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm", item.hasEvidence ? "border-l-green-500 border-l-4" : "border-l-red-500 border-l-4")}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{item.reportName}</p>
                <Badge variant="outline" className="text-xs capitalize shrink-0">{item.reportPeriod}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.departmentName}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.hasEvidence ? (
                <Badge variant="success" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /> {item.evidenceCount} files</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> No evidence</Badge>
              )}
            </div>
          </div>
        ))}
        {compact && items.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">+{items.length - 5} more report{items.length - 5 === 1 ? "" : "s"}</p>
        )}
      </CardContent>
    </Card>
  );
}
