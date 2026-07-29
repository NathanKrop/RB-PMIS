"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface DataFreshnessCardProps {
  updatedAt: string | null;
  thresholdHours?: number;
}

export function formatTimeAgo(dateStr: string, referenceMs: number) {
  const diff = referenceMs - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DataFreshnessCard({ updatedAt, thresholdHours = 48 }: DataFreshnessCardProps) {
  if (!updatedAt) return null;

  const referenceMs = new Date().getTime();
  const updatedAtDate = new Date(updatedAt);
  const ageMs = referenceMs - updatedAtDate.getTime();
  const ageHours = Math.floor(ageMs / 3600000);
  const stale = ageHours >= thresholdHours;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
            <p className="text-xs text-muted-foreground">Last updated {formatTimeAgo(updatedAt, referenceMs)}</p>
          </div>
          {stale ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Stale
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Fresh
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The dashboard data was last refreshed {formatTimeAgo(updatedAt, referenceMs)}. Data older than {thresholdHours} hours is considered stale.
        </p>
      </CardContent>
    </Card>
  );
}
