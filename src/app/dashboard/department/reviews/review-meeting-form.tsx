"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays } from "lucide-react";
import { createReviewMeeting } from "@/lib/actions";

export function ReviewMeetingForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createReviewMeeting(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><CalendarDays className="mr-1 h-4 w-4" /> Add Meeting</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Log Weekly Review Meeting</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="title">Meeting title</Label>
            <Input id="title" name="title" required placeholder="Weekly progress review" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="meeting_date">Meeting date</Label>
              <Input id="meeting_date" name="meeting_date" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Conference room" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start time</Label>
              <Input id="start_time" name="start_time" type="time" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End time</Label>
              <Input id="end_time" name="end_time" type="time" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea id="agenda" name="agenda" rows={3} required placeholder="Review progress, blockers, and next steps" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discussion_notes">Discussion notes</Label>
            <Textarea id="discussion_notes" name="discussion_notes" rows={3} placeholder="Summary of themes and concerns" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="decisions">Decisions</Label>
            <Textarea id="decisions" name="decisions" rows={2} placeholder="Agreed next steps" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving…" : "Save Meeting"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
