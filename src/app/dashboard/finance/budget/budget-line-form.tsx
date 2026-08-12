"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBudgetLine } from "@/lib/actions";
import type { BudgetLine } from "@/lib/types";

interface ActivityOption { id: string; description: string; }

interface DeptOption { id: string; name: string; }
interface ActivityOption { id: string; description: string; }

export function BudgetLineForm({ departments, activities }: { departments: DeptOption[]; activities: ActivityOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("other");
  const [deptId, setDeptId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("department_id", deptId);
    const result = await createBudgetLine(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setError(null);
    setCategory("other");
    setDeptId("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Budget Line</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Budget Line</DialogTitle></DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div>
            <Label>Department</Label>
            <Select value={deptId} onValueChange={setDeptId} required>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["personnel", "operations", "capital", "transfers", "other"].map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fiscal Year</Label>
              <Input name="fiscal_year" placeholder="e.g. 2025/26" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Approved Amount</Label>
              <Input name="amount_approved" type="number" min="0" step="0.01" required />
            </div>
            <div>
              <Label>Revised Amount (optional)</Label>
              <Input name="amount_revised" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div>
            <Label>Linked Activity (optional)</Label>
            <Select name="activity_id">
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.description.slice(0, 60)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Save Budget Line</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
