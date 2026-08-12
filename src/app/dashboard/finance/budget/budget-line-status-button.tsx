"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateBudgetLineStatus } from "@/lib/actions";
import type { BudgetLineStatus } from "@/lib/types";

const NEXT: Record<BudgetLineStatus, { label: string; next: BudgetLineStatus } | null> = {
  draft: { label: "Approve", next: "approved" },
  approved: { label: "Close", next: "closed" },
  closed: null,
};

export function BudgetLineStatusButton({ id, currentStatus }: { id: string; currentStatus: BudgetLineStatus }) {
  const [loading, setLoading] = useState(false);
  const transition = NEXT[currentStatus];
  if (!transition) return null;

  async function handleClick() {
    setLoading(true);
    await updateBudgetLineStatus(id, transition!.next);
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? "…" : transition.label}
    </Button>
  );
}
