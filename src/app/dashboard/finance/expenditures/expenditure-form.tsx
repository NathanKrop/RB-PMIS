"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createExpenditure } from "@/lib/actions";
import type { BudgetLine } from "@/lib/types";

export function ExpenditureForm({ budgetLines }: { budgetLines: (BudgetLine & { departments: { name: string } | null })[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetLineId, setBudgetLineId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const activeBudgetLines = budgetLines.filter((b) => b.status === "approved");

  async function handleSubmit(formData: FormData) {
    formData.set("budget_line_id", budgetLineId);
    const result = await createExpenditure(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setError(null);
    setBudgetLineId("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Record Expenditure</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Record Expenditure</DialogTitle></DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div>
            <Label>Budget Line</Label>
            <Select value={budgetLineId} onValueChange={setBudgetLineId} required>
              <SelectTrigger><SelectValue placeholder="Select approved budget line" /></SelectTrigger>
              <SelectContent>
                {activeBudgetLines.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title} — {b.departments?.name} ({b.fiscal_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" min="0.01" step="0.01" required />
            </div>
            <div>
              <Label>Date</Label>
              <Input name="expenditure_date" type="date" required />
            </div>
          </div>
          <div>
            <Label>Payment Reference (optional)</Label>
            <Input name="payment_reference" placeholder="Cheque / transfer ref" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Save Expenditure</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
