"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBeneficiary } from "@/lib/actions";
import { UserPlus } from "lucide-react";

export function BeneficiaryForm({
  activities,
  departments,
  showDeptSelect = false,
}: {
  activities: { id: string; description: string }[];
  departments?: { id: string; name: string }[];
  showDeptSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState("");
  const [activityId, setActivityId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    if (gender) formData.set("gender", gender);
    if (activityId) formData.set("activity_id", activityId);
    if (deptId) formData.set("department_id", deptId);
    const result = await createBeneficiary(formData);
    if (result?.error) { setError(result.error); return; }
    setOpen(false); setGender(""); setActivityId(""); setDeptId(""); setError("");
    formRef.current?.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Register Beneficiary</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Register Beneficiary</DialogTitle></DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" min="0" max="120" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" name="contact" />
            </div>
          </div>
          {showDeptSelect && departments && (
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea id="feedback" name="feedback" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="testimonial">Testimonial</Label>
            <Textarea id="testimonial" name="testimonial" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
