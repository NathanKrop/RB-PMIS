"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart2 } from "lucide-react";
import { createOutcomeIndicator } from "@/lib/actions";

export function IndicatorForm({ outcomeId }: { outcomeId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("outcome_id", outcomeId);
    const result = await createOutcomeIndicator(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><BarChart2 className="h-4 w-4" /> Indicator</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Outcome Indicator</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit of Measure</Label>
            <Input id="unit" name="unit" required placeholder="e.g. %, number, score" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="baseline">Baseline</Label>
              <Input id="baseline" name="baseline" type="number" step="any" required defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">Target</Label>
              <Input id="target" name="target" type="number" step="any" required defaultValue="0" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
