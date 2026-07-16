"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createReport } from "@/lib/actions";

export function ReportForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("reporting_period", period);
    const result = await createReport(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> New Report</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Report</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="space-y-1.5">
            <Label>Reporting Period</Label>
            <Select onValueChange={setPeriod} required>
              <SelectTrigger><SelectValue placeholder="Select period type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reporting_period_name">Period Name</Label>
            <Input id="reporting_period_name" name="reporting_period_name" placeholder="e.g. Q1 2025" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outcome_progress">Outcome Progress</Label>
            <Textarea id="outcome_progress" name="outcome_progress" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key_results">Key Results</Label>
            <Textarea id="key_results" name="key_results" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challenges">Challenges</Label>
            <Textarea id="challenges" name="challenges" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adaptive_actions">Adaptive Actions</Label>
            <Textarea id="adaptive_actions" name="adaptive_actions" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lessons_learned">Lessons Learned</Label>
            <Textarea id="lessons_learned" name="lessons_learned" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_period_priorities">Next Period Priorities</Label>
            <Textarea id="next_period_priorities" name="next_period_priorities" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !period}>
            {loading ? "Saving…" : "Save Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
