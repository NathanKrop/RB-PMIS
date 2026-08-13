"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitTravelRequest, reviewTravelRequest, cancelTravelRequest } from "@/lib/actions";

export function TravelRequestActions({
  id, status, role,
}: {
  id: string;
  status: string;
  role: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    await fn();
    setLoading(false);
    setShowNotes(false);
    setNotes("");
  }

  if (status === "draft" && role === "finance") {
    return (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={loading}
          onClick={() => run(() => submitTravelRequest(id))}>
          Submit
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600" disabled={loading}
          onClick={() => run(() => cancelTravelRequest(id))}>
          Cancel
        </Button>
      </div>
    );
  }

  if (status === "submitted" && (role === "management" || role === "finance")) {
    return (
      <div className="space-y-2">
        {showNotes && (
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Review notes (optional)" rows={2} className="text-xs" />
        )}
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="outline" className="text-green-700 border-green-300"
            disabled={loading} onClick={() => run(() => reviewTravelRequest(id, "approved", notes))}>
            Approve
          </Button>
          <Button size="sm" variant="outline" className="text-red-700 border-red-300"
            disabled={loading}
            onClick={() => showNotes ? run(() => reviewTravelRequest(id, "rejected", notes)) : setShowNotes(true)}>
            {showNotes ? "Confirm Reject" : "Reject"}
          </Button>
          {showNotes && (
            <Button size="sm" variant="ghost" disabled={loading} onClick={() => setShowNotes(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if ((status === "draft" || status === "submitted") && role === "finance") {
    return (
      <Button size="sm" variant="ghost" className="text-red-600" disabled={loading}
        onClick={() => run(() => cancelTravelRequest(id))}>
        Cancel
      </Button>
    );
  }

  return null;
}
