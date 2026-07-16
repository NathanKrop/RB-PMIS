"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateWorkPlanStatus } from "@/lib/actions";
import type { WorkPlan } from "@/lib/types";

export function WorkPlanActions({ workPlan }: { workPlan: WorkPlan }) {
  const [loading, setLoading] = useState(false);

  async function handle(status: string) {
    setLoading(true);
    await updateWorkPlanStatus(workPlan.id, status);
    setLoading(false);
  }

  if (workPlan.status === "draft") {
    return (
      <Button size="sm" variant="outline" disabled={loading} onClick={() => handle("submitted")}>
        {loading ? "Submitting…" : "Submit"}
      </Button>
    );
  }
  return null;
}
