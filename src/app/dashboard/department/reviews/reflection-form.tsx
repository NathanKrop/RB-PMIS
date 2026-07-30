"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NotebookPen } from "lucide-react";
import { createReflection } from "@/lib/actions";

export function ReflectionForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createReflection(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><NotebookPen className="mr-1 h-4 w-4" /> Add Reflection</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Log Monthly Reflection</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="period_name">Period</Label>
            <Input id="period_name" name="period_name" required placeholder="July 2026" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reflection_date">Reflection date</Label>
            <Input id="reflection_date" name="reflection_date" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="what_worked_well">What worked well</Label>
            <Textarea id="what_worked_well" name="what_worked_well" rows={3} placeholder="Key achievements and successes" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key_challenges">Key challenges</Label>
            <Textarea id="key_challenges" name="key_challenges" rows={3} placeholder="Main obstacles or barriers" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adaptive_actions_taken">Adaptive actions taken</Label>
            <Textarea id="adaptive_actions_taken" name="adaptive_actions_taken" rows={3} placeholder="What changed in response" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lessons_learned">Lessons learned</Label>
            <Textarea id="lessons_learned" name="lessons_learned" rows={3} placeholder="What should be repeated or improved" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving…" : "Save Reflection"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
