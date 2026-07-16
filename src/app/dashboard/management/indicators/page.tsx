import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicatorValueForm } from "./indicator-value-form";
import type { OutcomeIndicator, Outcome, StrategicObjective } from "@/lib/types";

export default async function IndicatorsPage() {
  const supabase = await createClient();

  const [{ data: objectives }, { data: outcomes }, { data: indicators }] = await Promise.all([
    supabase.from("strategic_objectives").select("*").order("code"),
    supabase.from("outcomes").select("*").order("code"),
    supabase.from("outcome_indicators").select("*").order("created_at"),
  ]);

  const outcomesByObj: Record<string, Outcome[]> = {};
  for (const o of (outcomes ?? [])) {
    outcomesByObj[o.strategic_objective_id] = [...(outcomesByObj[o.strategic_objective_id] ?? []), o];
  }

  const indicatorsByOutcome: Record<string, OutcomeIndicator[]> = {};
  for (const i of (indicators ?? [])) {
    indicatorsByOutcome[i.outcome_id] = [...(indicatorsByOutcome[i.outcome_id] ?? []), i];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Outcome Indicators</h1>
        <p className="text-sm text-muted-foreground mt-1">Track progress against strategic outcome targets</p>
      </div>

      {(!objectives || objectives.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No indicators defined yet. Set up the results framework first.
          </CardContent>
        </Card>
      )}

      {(objectives ?? []).map((obj: StrategicObjective) => {
        const objOutcomes = outcomesByObj[obj.id] ?? [];
        const hasIndicators = objOutcomes.some((oc) => (indicatorsByOutcome[oc.id] ?? []).length > 0);
        if (!hasIndicators) return null;

        return (
          <Card key={obj.id}>
            <CardHeader className="pb-3">
              <p className="text-xs font-mono text-muted-foreground">{obj.code}</p>
              <CardTitle className="text-base">{obj.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {objOutcomes.map((oc: Outcome) => {
                const inds = indicatorsByOutcome[oc.id] ?? [];
                if (inds.length === 0) return null;
                return (
                  <div key={oc.id} className="space-y-3">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-muted-foreground mr-2">{oc.code}</span>
                      {oc.title}
                    </p>
                    {inds.map((ind: OutcomeIndicator) => {
                      const pct = ind.target > 0 ? Math.min(100, Math.round((ind.current_value / ind.target) * 100)) : 0;
                      return (
                        <div key={ind.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{ind.title}</p>
                              {ind.description && <p className="text-xs text-muted-foreground mt-0.5">{ind.description}</p>}
                            </div>
                            <IndicatorValueForm indicator={ind} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Baseline: {ind.baseline} {ind.unit}</span>
                              <span>{ind.current_value} / {ind.target} {ind.unit} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
