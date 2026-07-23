"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, MapPin, Loader2 } from "lucide-react";
import { uploadEvidence } from "@/lib/actions";

type EvidenceLinks = {
  objectives?: { id: string; code: string; title: string }[];
  outcomes?: { id: string; code: string; title: string }[];
  outputs?: { id: string; code: string; title: string }[];
  indicators?: { id: string; title: string }[];
  reports?: { id: string; reporting_period_name: string }[];
};

export function EvidenceUploadForm({ activities, objectives, outcomes, outputs, indicators, reports }: { activities?: { id: string; description: string }[] } & EvidenceLinks) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityId, setActivityId] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [location, setLocation] = useState("");

  function captureGPS() {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude.toFixed(6)));
        setLng(String(pos.coords.longitude.toFixed(6)));
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      () => { setError("Could not get location"); setGpsLoading(false); }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (activityId) fd.set("activity_id", activityId);
    if (lat) fd.set("latitude", lat);
    if (lng) fd.set("longitude", lng);
    const result = await uploadEvidence(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false); setLoading(false);
    setActivityId(""); setLat(""); setLng(""); setLocation("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Upload className="h-4 w-4 mr-1" /> Upload Evidence</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Upload Evidence</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Describe this evidence" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea id="caption" name="caption" rows={2} placeholder="Additional context or description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="document_type">Document Type</Label><Input id="document_type" name="document_type" placeholder="e.g. attendance register" /></div>
            <div className="space-y-1.5"><Label htmlFor="captured_at">Capture Date</Label><Input id="captured_at" name="captured_at" type="date" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="keywords">Keywords</Label><Input id="keywords" name="keywords" placeholder="Comma-separated keywords" /></div>
          <div className="space-y-1.5"><Label htmlFor="reporting_period">Reporting Period</Label><Input id="reporting_period" name="reporting_period" placeholder="e.g. Q1 2026" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="file">File <span className="text-muted-foreground text-xs">(photo, video, document)</span></Label>
            <Input id="file" name="file" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" required />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="location">Location</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={captureGPS} disabled={gpsLoading}>
                {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                {gpsLoading ? "Getting GPS…" : "Capture GPS"}
              </Button>
            </div>
            <Input id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nairobi, Kenya or GPS coordinates" />
            {lat && lng && (
              <p className="text-xs text-muted-foreground">GPS: {lat}, {lng}</p>
            )}
          </div>

          {/* Activity link */}
          {activities && activities.length > 0 && (
            <div className="space-y-1.5">
              <Label>Linked Activity <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={activityId} onValueChange={setActivityId}>
                <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.description.length > 55 ? a.description.slice(0, 55) + "…" : a.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <LinkSelect label="Strategic Objective" name="strategic_objective_id" values={objectives?.map((item) => ({ id: item.id, label: `${item.code} - ${item.title}` }))} />
            <LinkSelect label="Outcome" name="outcome_id" values={outcomes?.map((item) => ({ id: item.id, label: `${item.code} - ${item.title}` }))} />
            <LinkSelect label="Output" name="output_id" values={outputs?.map((item) => ({ id: item.id, label: `${item.code} - ${item.title}` }))} />
            <LinkSelect label="Indicator" name="indicator_id" values={indicators?.map((item) => ({ id: item.id, label: item.title }))} />
            <LinkSelect label="Report" name="report_id" values={reports?.map((item) => ({ id: item.id, label: item.reporting_period_name }))} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkSelect({ label, name, values }: { label: string; name: string; values?: { id: string; label: string }[] }) {
  if (!values?.length) return null;
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><select id={name} name={name} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Not linked</option>{values.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}</select></div>;
}
