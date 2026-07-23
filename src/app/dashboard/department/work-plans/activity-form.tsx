"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createActivity } from "@/lib/actions";

interface Output { id: string; code: string; title: string; }

export function ActivityForm({ workPlanId, outputs }: { workPlanId?: string; outputs: Output[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputId, setOutputId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("output_id", outputId);
    if (workPlanId) fd.set("work_plan_id", workPlanId);
    const result = await createActivity(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Add Activity</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="space-y-1.5">
            <Label>Output</Label>
            <Select onValueChange={setOutputId} required>
              <SelectTrigger><SelectValue placeholder="Select output" /></SelectTrigger>
              <SelectContent>
                {outputs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.code} — {o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Activity Description</Label>
            <Textarea id="description" name="description" required rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expected_output">Expected Output</Label>
            <Input id="expected_output" name="expected_output" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intended_outcome">Intended Outcome</Label>
            <Textarea id="intended_outcome" name="intended_outcome" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="implementation_schedule">Monthly Implementation Schedule</Label>
            <Input id="implementation_schedule" name="implementation_schedule" placeholder="e.g. January, February, March" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="responsible_person">Responsible Person</Label>
            <Input id="responsible_person" name="responsible_person" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="required_resources">Required Resources</Label>
            <Textarea id="required_resources" name="required_resources" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anticipated_risks">Anticipated Risks</Label>
            <Textarea id="anticipated_risks" name="anticipated_risks" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mitigation_measures">Mitigation Measures</Label>
            <Textarea id="mitigation_measures" name="mitigation_measures" rows={2} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="progress_update">Progress Update</Label><Textarea id="progress_update" name="progress_update" rows={2} /></div>
          <div className="space-y-1.5"><Label htmlFor="actual_achievement">Actual Achievement</Label><Textarea id="actual_achievement" name="actual_achievement" rows={2} /></div>
          <div className="space-y-1.5"><Label htmlFor="variance_analysis">Variance Analysis</Label><Textarea id="variance_analysis" name="variance_analysis" rows={2} /></div>
          <Button type="submit" className="w-full" disabled={loading || !outputId}>
            {loading ? "Saving…" : "Add Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
