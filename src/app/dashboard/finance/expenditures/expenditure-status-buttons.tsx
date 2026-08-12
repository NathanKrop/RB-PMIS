"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateExpenditureStatus } from "@/lib/actions";

export function ExpenditureStatusButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handle(status: "approved" | "rejected") {
    setLoading(true);
    await updateExpenditureStatus(id, status);
    setLoading(false);
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" className="text-green-700 border-green-300" onClick={() => handle("approved")} disabled={loading}>
        Approve
      </Button>
      <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => handle("rejected")} disabled={loading}>
        Reject
      </Button>
    </div>
  );
}
