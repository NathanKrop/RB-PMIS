import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObjectiveForm } from "./objective-form";
import { OutcomeForm } from "./outcome-form";
import { OutputForm } from "./output-form";
import { IndicatorForm } from "./indicator-form";
import type { StrategicObjective, Outcome, Output, OutcomeIndicator } from "@/lib/types";

export default async function FrameworkPage() {
  const supabase = await createClient();

  const [{ data: objectives }, { data: outcomes }, { data: outputs }, { data: indicators }] = await Promise.all([
    supabase.from("strategic_objectives").select("*").order("code"),
    supabase.from("outcomes").select("*").order("code"),
    supabase.from("outputs").select("*").order("code"),
    supabase.from("outcome_indicators").select("*").order("created_at"),
  ]);

  const outcomesByObj: Record<string, Outcome[]> = {};
  for (const o of (outcomes ?? [])) {
    outcomesByObj[o.strategic_objective_id] = [...(outcomesByObj[o.strategic_objective_id] ?? []), o];
  }

  const outputsByOutcome: Record<string, Output[]> = {};
  for (const o of (outputs ?? [])) {
    outputsByOutcome[o.outcome_id] = [...(outputsByOutcome[o.outcome_id] ?? []), o];
  }

  const indicatorsByOutcome: Record<string, OutcomeIndicator[]> = {};
  for (const i of (indicators ?? [])) {
    indicatorsByOutcome[i.outcome_id] = [...(indicatorsByOutcome[i.outcome_id] ?? []), i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Results Framework</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage strategic objectives, outcomes, and outputs</p>
        </div>
        <ObjectiveForm />
      </div>

      {(!objectives || objectives.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No strategic objectives yet. Add one to get started.
          </CardContent>
        </Card>
      )}

      {(objectives ?? []).map((obj: StrategicObjective) => (
        <Card key={obj.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{obj.code}</p>
                <CardTitle className="text-base mt-0.5">{obj.title}</CardTitle>
                {obj.description && <p className="text-sm text-muted-foreground mt-1">{obj.description}</p>}
              </div>
              <OutcomeForm objectiveId={obj.id} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(outcomesByObj[obj.id] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground pl-2">No outcomes yet.</p>
            ) : (
              (outcomesByObj[obj.id] ?? []).map((oc: Outcome) => (
                <div key={oc.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{oc.code}</p>
                      <p className="text-sm font-medium mt-0.5">{oc.title}</p>
                      {oc.description && <p className="text-xs text-muted-foreground mt-0.5">{oc.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <IndicatorForm outcomeId={oc.id} />
                      <OutputForm outcomeId={oc.id} />
                    </div>
                  </div>

                  {(indicatorsByOutcome[oc.id] ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Indicators</p>
                      <div className="space-y-1">
                        {(indicatorsByOutcome[oc.id] ?? []).map((ind: OutcomeIndicator) => (
                          <div key={ind.id} className="text-xs bg-muted/50 rounded px-2.5 py-1.5 flex items-center justify-between gap-2">
                            <span className="truncate">{ind.title}</span>
                            <span className="text-muted-foreground shrink-0">
                              {ind.current_value} / {ind.target} {ind.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(outputsByOutcome[oc.id] ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Outputs</p>
                      <div className="space-y-1">
                        {(outputsByOutcome[oc.id] ?? []).map((op: Output) => (
                          <div key={op.id} className="text-xs bg-muted/50 rounded px-2.5 py-1.5">
                            <span className="font-mono text-muted-foreground mr-2">{op.code}</span>
                            {op.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
