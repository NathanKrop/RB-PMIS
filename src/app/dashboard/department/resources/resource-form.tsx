"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createResource } from "@/lib/actions";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { value: "human", label: "Human" },
  { value: "financial", label: "Financial" },
  { value: "material", label: "Material" },
  { value: "equipment", label: "Equipment" },
];

export function ResourceForm({
  activities,
  departments,
  showDeptSelect = false,
}: {
  activities: { id: string; description: string }[];
  departments?: { id: string; name: string }[];
  showDeptSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [activityId, setActivityId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    if (category) formData.set("category", category);
    if (activityId) formData.set("activity_id", activityId);
    if (deptId) formData.set("department_id", deptId);
    const result = await createResource(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false); setCategory(""); setActivityId(""); setDeptId(""); setError("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Resource</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Resource Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" placeholder="e.g. days, USD, units" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity_planned">Planned Qty</Label>
              <Input id="quantity_planned" name="quantity_planned" type="number" min="0" step="any" defaultValue="0" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity_used">Used Qty</Label>
              <Input id="quantity_used" name="quantity_used" type="number" min="0" step="any" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_cost">Unit Cost</Label>
              <Input id="unit_cost" name="unit_cost" type="number" min="0" step="any" defaultValue="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="period_reference">Period</Label>
              <Input id="period_reference" name="period_reference" placeholder="e.g. Q1 2026" />
            </div>
            {showDeptSelect && departments && (
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Linked Activity <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={activityId} onValueChange={setActivityId}>
              <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
              <SelectContent>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.description.length > 50 ? a.description.slice(0, 50) + "…" : a.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
