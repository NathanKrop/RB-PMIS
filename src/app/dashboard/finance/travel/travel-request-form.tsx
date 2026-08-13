"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTravelRequest } from "@/lib/actions";

interface DeptOption { id: string; name: string; }
interface BudgetLineOption { id: string; title: string; fiscal_year: string; }

export function TravelRequestForm({ departments, budgetLines }: { departments: DeptOption[]; budgetLines: BudgetLineOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState("road");
  const [deptId, setDeptId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [perDiemDays, setPerDiemDays] = useState(0);
  const [perDiemRate, setPerDiemRate] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("transport_mode", transport);
    formData.set("department_id", deptId);
    formData.set("budget_line_id", budgetLineId);
    formData.set("per_diem_days", String(perDiemDays));
    formData.set("per_diem_rate", String(perDiemRate));
    const result = await createTravelRequest(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setError(null);
    setTransport("road"); setDeptId(""); setBudgetLineId("");
    setPerDiemDays(0); setPerDiemRate(0);
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Travel Request</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Travel Request</DialogTitle></DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Traveller Name</Label>
              <Input name="traveller_name" required />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={deptId} onValueChange={setDeptId} required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Destination</Label>
            <Input name="destination" required />
          </div>

          <div>
            <Label>Purpose of Travel</Label>
            <Textarea name="purpose" rows={2} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Departure Date</Label>
              <Input name="departure_date" type="date" required />
            </div>
            <div>
              <Label>Return Date</Label>
              <Input name="return_date" type="date" required />
            </div>
          </div>

          <div>
            <Label>Transport Mode</Label>
            <Select value={transport} onValueChange={setTransport}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["air", "road", "rail", "sea", "other"].map((m) => (
                  <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estimated Cost</Label>
              <Input name="estimated_cost" type="number" min="0" step="0.01" defaultValue="0" required />
            </div>
            <div>
              <Label>Advance Requested</Label>
              <Input name="advance_requested" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Per Diem Days</Label>
              <Input type="number" min="0" value={perDiemDays}
                onChange={(e) => setPerDiemDays(Number(e.target.value))} />
            </div>
            <div>
              <Label>Per Diem Rate</Label>
              <Input type="number" min="0" step="0.01" value={perDiemRate}
                onChange={(e) => setPerDiemRate(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Total per diem: {(perDiemDays * perDiemRate).toLocaleString()}
          </p>

          <div>
            <Label>Budget Line (optional)</Label>
            <Select value={budgetLineId} onValueChange={setBudgetLineId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {budgetLines.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title} ({b.fiscal_year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Save as Draft</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
