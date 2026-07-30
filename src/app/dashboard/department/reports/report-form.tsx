"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createReport } from "@/lib/actions";
import type { ReportDraft, WorkPlan } from "@/lib/types";

type WorkPlanSummary = Pick<WorkPlan, "id" | "period_type" | "period_name" | "status">;

interface ReportFormProps {
  workPlans?: WorkPlanSummary[];
}

export function ReportForm({ workPlans = [] }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [period, setPeriod] = useState("");
  const [workPlanId, setWorkPlanId] = useState("");
  const [reportingPeriodName, setReportingPeriodName] = useState("");
  const [outcomeProgress, setOutcomeProgress] = useState("");
  const [keyResults, setKeyResults] = useState("");
  const [challenges, setChallenges] = useState("");
  const [adaptiveActions, setAdaptiveActions] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [nextPriorities, setNextPriorities] = useState("");

  const selectedWorkPlan = workPlans.find((wp) => wp.id === workPlanId);

  function clearDraft() {
    setWorkPlanId("");
    setReportingPeriodName("");
    setOutcomeProgress("");
    setKeyResults("");
    setChallenges("");
    setAdaptiveActions("");
    setLessonsLearned("");
    setNextPriorities("");
    setPeriod("");
    setDraftError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("reporting_period", period);
    if (workPlanId) fd.set("work_plan_id", workPlanId);
    const result = await createReport(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    setLoading(false);
  }

  async function handleGenerateDraft() {
    if (!workPlanId) return;
    setDraftLoading(true);
    setDraftError(null);

    try {
      const res = await fetch(`/api/reports/draft?work_plan_id=${workPlanId}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error || "Unable to generate draft report");
      }
      const draft = (await res.json()) as ReportDraft;
      setPeriod(draft.reporting_period);
      setReportingPeriodName(draft.reporting_period_name);
      setOutcomeProgress(draft.outcome_progress);
      setKeyResults(draft.key_results);
      setChallenges(draft.challenges);
      setAdaptiveActions(draft.adaptive_actions);
      setLessonsLearned(draft.lessons_learned);
      setNextPriorities(draft.next_period_priorities);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : String(error));
    } finally {
      setDraftLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> New Report</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Report</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
          {draftError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{draftError}</p>}
          <div className="space-y-1.5">
            <Label>Work Plan (optional)</Label>
            <Select onValueChange={(value) => setWorkPlanId(value)}>
              <SelectTrigger><SelectValue placeholder="Generate draft from work plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {workPlans.map((wp) => (
                  <SelectItem key={wp.id} value={wp.id}>
                    {wp.period_name} • {wp.period_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workPlanId && (
              <div className="flex flex-col gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleGenerateDraft} disabled={draftLoading}>
                  {draftLoading ? "Generating draft…" : "Generate report draft"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
                  Clear draft
                </Button>
              </div>
            )}
          </div>
          {selectedWorkPlan && (
            <div className="rounded-lg border border-muted/60 bg-muted/10 p-4 text-sm space-y-2">
              <p className="font-medium">Draft source</p>
              <p>{selectedWorkPlan.period_name} • {selectedWorkPlan.period_type}</p>
              <p className="text-muted-foreground">The generated draft pulls your work plan activity status and highlights key results and risks.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Reporting Period</Label>
            <Select onValueChange={setPeriod} value={period} required>
              <SelectTrigger><SelectValue placeholder="Select period type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reporting_period_name">Period Name</Label>
            <Input
              id="reporting_period_name"
              name="reporting_period_name"
              placeholder="e.g. Q1 2025"
              required
              value={reportingPeriodName}
              onChange={(event) => setReportingPeriodName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outcome_progress">Outcome Progress</Label>
            <Textarea
              id="outcome_progress"
              name="outcome_progress"
              rows={2}
              value={outcomeProgress}
              onChange={(event) => setOutcomeProgress(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key_results">Key Results</Label>
            <Textarea
              id="key_results"
              name="key_results"
              rows={2}
              value={keyResults}
              onChange={(event) => setKeyResults(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="challenges">Challenges</Label>
            <Textarea
              id="challenges"
              name="challenges"
              rows={2}
              value={challenges}
              onChange={(event) => setChallenges(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adaptive_actions">Adaptive Actions</Label>
            <Textarea
              id="adaptive_actions"
              name="adaptive_actions"
              rows={2}
              value={adaptiveActions}
              onChange={(event) => setAdaptiveActions(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lessons_learned">Lessons Learned</Label>
            <Textarea
              id="lessons_learned"
              name="lessons_learned"
              rows={2}
              value={lessonsLearned}
              onChange={(event) => setLessonsLearned(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next_period_priorities">Next Period Priorities</Label>
            <Textarea
              id="next_period_priorities"
              name="next_period_priorities"
              rows={2}
              value={nextPriorities}
              onChange={(event) => setNextPriorities(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !period || !reportingPeriodName}>
            {loading ? "Saving…" : "Save Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
