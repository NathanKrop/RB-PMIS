"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateEvidenceStatus } from "@/lib/actions";
import type { Evidence } from "@/lib/types";

export function EvidenceActions({ evidence }: { evidence: Evidence }) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [showComments, setShowComments] = useState(false);

  if (evidence.verification_status !== "pending") return null;

  async function handle(status: string) {
    setLoading(true);
    await updateEvidenceStatus(evidence.id, status, comments || undefined);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      {showComments && (
        <Textarea
          placeholder="Optional comments…"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          className="text-xs"
        />
      )}
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={() => handle("verified")} className="flex-1">
          Verify
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => {
            if (!showComments) { setShowComments(true); return; }
            handle("requires_clarification");
          }}
          className="flex-1"
        >
          Clarify
        </Button>
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => handle("rejected")} className="flex-1">
          Reject
        </Button>
      </div>
    </div>
  );
}
