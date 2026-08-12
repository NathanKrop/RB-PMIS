"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewBudgetRequest } from "@/lib/actions";

export function BudgetRequestReviewButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  async function handle(status: "approved" | "rejected") {
    setLoading(true);
    await reviewBudgetRequest(id, status, notes);
    setLoading(false);
    setShowNotes(false);
    setNotes("");
  }

  return (
    <div className="space-y-2">
      {showNotes && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Review notes (optional)"
          rows={2}
          className="text-xs"
        />
      )}
      <div className="flex gap-1 flex-wrap">
        <Button size="sm" variant="outline" className="text-green-700 border-green-300"
          onClick={() => handle("approved")} disabled={loading}>
          Approve
        </Button>
        <Button size="sm" variant="outline" className="text-red-700 border-red-300"
          onClick={() => { if (!showNotes) { setShowNotes(true); } else { handle("rejected"); } }}
          disabled={loading}>
          {showNotes ? "Confirm Reject" : "Reject"}
        </Button>
        {showNotes && (
          <Button size="sm" variant="ghost" onClick={() => setShowNotes(false)} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
