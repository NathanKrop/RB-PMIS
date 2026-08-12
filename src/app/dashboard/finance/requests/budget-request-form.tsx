"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBudgetRequest } from "@/lib/actions";

interface DeptOption { id: string; name: string; }
interface BudgetLineOption { id: string; title: string; fiscal_year: string; }

export function BudgetRequestForm({
  departments,
  budgetLines,
}: {
  departments: DeptOption[];
  budgetLines: BudgetLineOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<"submission" | "revision">("submission");
  const [category, setCategory] = useState("other");
  const [deptId, setDeptId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("request_type", requestType);
    formData.set("category", category);
    formData.set("department_id", deptId);
    formData.set("budget_line_id", budgetLineId);
    const result = await createBudgetRequest(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setError(null);
    setRequestType("submission");
    setCategory("other");
    setDeptId("");
    setBudgetLineId("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Request</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Budget Request</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div>
            <Label>Request Type</Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v as "submission" | "revision")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="submission">Budget Submission (new budget)</SelectItem>
                <SelectItem value="revision">Revision Request (amend existing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requestType === "revision" && (
            <div>
              <Label>Budget Line to Revise</Label>
              <Select value={budgetLineId} onValueChange={setBudgetLineId} required>
                <SelectTrigger><SelectValue placeholder="Select budget line" /></SelectTrigger>
                <SelectContent>
                  {budgetLines.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.title} ({b.fiscal_year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Input name="title" placeholder="Brief title for this request" required />
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

          <div>
            <Label>Amount Requested</Label>
            <Input name="amount_requested" type="number" min="0.01" step="0.01" required />
          </div>

          <div>
            <Label>Justification</Label>
            <Textarea name="justification" rows={3} placeholder="Explain why this budget is needed…" required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Submit Request</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
