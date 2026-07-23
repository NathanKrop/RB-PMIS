"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createStrategicObjective } from "@/lib/actions";

export function ObjectiveForm({ departments }: { departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createStrategicObjective(new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Objective</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Strategic Objective</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required placeholder="e.g. SO1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="responsible_department_id">Responsible Department</Label><select id="responsible_department_id" name="responsible_department_id" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Organisation-wide</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
            <div className="space-y-1.5"><Label htmlFor="reporting_frequency">Reporting Frequency</Label><select id="reporting_frequency" name="reporting_frequency" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Not set</option>{["weekly", "monthly", "quarterly", "annual"].map((period) => <option key={period} value={period}>{period}</option>)}</select></div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
