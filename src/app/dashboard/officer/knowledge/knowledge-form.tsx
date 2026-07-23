"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createKnowledgeItem } from "@/lib/actions";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { value: "lessons_learned", label: "Lessons Learned" },
  { value: "best_practice", label: "Best Practice" },
  { value: "case_study", label: "Case Study" },
  { value: "success_story", label: "Success Story" },
];

export function KnowledgeForm({ departments }: { departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [deptId, setDeptId] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    if (category) formData.set("category", category);
    if (deptId) formData.set("department_id", deptId);
    const result = await createKnowledgeItem(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setCategory("");
    setDeptId("");
    setError("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Knowledge Entry</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" rows={4} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
            <Input id="tags" name="tags" placeholder="e.g. training, community, health" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period_reference">Period Reference</Label>
            <Input id="period_reference" name="period_reference" placeholder="e.g. Q1 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Department <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={deptId} onValueChange={setDeptId}>
              <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
