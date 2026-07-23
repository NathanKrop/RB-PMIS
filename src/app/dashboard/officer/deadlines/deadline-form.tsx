"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createReportingDeadline } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeadlineForm({ departments }: { departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false); const [error, setError] = useState("");
  async function submit(formData: FormData) { const result = await createReportingDeadline(formData); if (result?.error) { setError(result.error); return; } setError(""); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Add Deadline</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Reporting Deadline</DialogTitle></DialogHeader><form action={submit} className="space-y-3">{error && <p className="text-sm text-destructive">{error}</p>}<div className="space-y-1"><Label htmlFor="department_id">Department</Label><select id="department_id" name="department_id" required className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="reporting_period">Period Type</Label><select id="reporting_period" name="reporting_period" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">{["weekly", "monthly", "quarterly", "annual"].map((period) => <option key={period} value={period}>{period}</option>)}</select></div><div className="space-y-1"><Label htmlFor="due_date">Due Date</Label><Input id="due_date" name="due_date" type="date" required /></div></div><div className="space-y-1"><Label htmlFor="reporting_period_name">Period Name</Label><Input id="reporting_period_name" name="reporting_period_name" placeholder="e.g. Q3 2026" required /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="reminder_days">Reminder Days</Label><Input id="reminder_days" name="reminder_days" type="number" min="0" defaultValue="3" required /></div><div className="space-y-1"><Label htmlFor="escalation_days">Escalation Days</Label><Input id="escalation_days" name="escalation_days" type="number" min="0" defaultValue="1" required /></div></div><Button className="w-full">Save Deadline</Button></form></DialogContent></Dialog>;
}
