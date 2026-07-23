"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { updateOutcomeIndicator } from "@/lib/actions";
import type { OutcomeIndicator } from "@/lib/types";

export function IndicatorEditForm({ indicator }: { indicator: OutcomeIndicator }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    const result = await updateOutcomeIndicator(indicator.id, new FormData(event.currentTarget));
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false); setLoading(false);
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label={`Edit ${indicator.title}`}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Edit Outcome Indicator</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5"><Label htmlFor="indicator-title">Title</Label><Input id="indicator-title" name="title" defaultValue={indicator.title} required /></div>
        <div className="space-y-1.5"><Label htmlFor="indicator-description">Description</Label><Textarea id="indicator-description" name="description" defaultValue={indicator.description ?? ""} rows={2} /></div>
        <div className="space-y-1.5"><Label htmlFor="indicator-unit">Unit</Label><Input id="indicator-unit" name="unit" defaultValue={indicator.unit} required /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label htmlFor="indicator-baseline">Baseline</Label><Input id="indicator-baseline" name="baseline" type="number" step="any" min="0" defaultValue={indicator.baseline} required /></div>
          <div className="space-y-1.5"><Label htmlFor="indicator-target">Target</Label><Input id="indicator-target" name="target" type="number" step="any" min="0" defaultValue={indicator.target} required /></div>
          <div className="space-y-1.5"><Label htmlFor="indicator-value">Current</Label><Input id="indicator-value" name="current_value" type="number" step="any" min="0" defaultValue={indicator.current_value} required /></div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
