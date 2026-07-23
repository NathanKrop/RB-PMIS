import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicatorValueForm } from "./indicator-value-form";
import { TrendLineChart } from "@/components/charts/line-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import type { OutcomeIndicator, Outcome, StrategicObjective, IndicatorValueHistory } from "@/lib/types";

export default async function IndicatorsPage() {
  const supabase = await createClient();

  const [
    { data: objectives },
    { data: outcomes },
    { data: indicators },
    { data: history },
  ] = await Promise.all([
    supabase.from("strategic_objectives").select("*").order("code"),
    supabase.from("outcomes").select("*").order("code"),
    supabase.from("outcome_indicators").select("*").order("created_at"),
    supabase.from("indicator_value_history").select("*").order("recorded_at", { ascending: true }),
  ]);

  const outcomesByObj: Record<string, Outcome[]> = {};
  for (const o of (outcomes ?? [])) {
    outcomesByObj[o.strategic_objective_id] = [...(outcomesByObj[o.strategic_objective_id] ?? []), o];
  }

  const indicatorsByOutcome: Record<string, OutcomeIndicator[]> = {};
  for (const i of (indicators ?? [])) {
    indicatorsByOutcome[i.outcome_id] = [...(indicatorsByOutcome[i.outcome_id] ?? []), i];
  }

  const historyByIndicator: Record<string, IndicatorValueHistory[]> = {};
  for (const h of (history ?? [])) {
    historyByIndicator[h.indicator_id] = [...(historyByIndicator[h.indicator_id] ?? []), h];
  }

  // Overall achievement bar chart
  const achievementBar = (indicators ?? [])
    .filter((i) => i.target > 0)
    .map((i) => ({
      name: i.title.length > 18 ? i.title.slice(0, 18) + "…" : i.title,
      value: Math.min(100, Math.round((i.current_value / i.target) * 100)),
      color: i.current_value >= i.target ? "#22c55e" : i.current_value / i.target >= 0.5 ? "#f59e0b" : "#ef4444",
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Outcome Indicators</h1>
        <p className="text-sm text-muted-foreground mt-1">Track progress against strategic outcome targets</p>
      </div>

      {/* Overall achievement overview */}
      {achievementBar.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Indicator Achievement (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={achievementBar} valueLabel="% Achieved" color="#6366f1" />
          </CardContent>
        </Card>
      )}

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
            <CardContent className="space-y-6">
              {objOutcomes.map((oc: Outcome) => {
                const inds = indicatorsByOutcome[oc.id] ?? [];
                if (inds.length === 0) return null;
                return (
                  <div key={oc.id} className="space-y-4">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-muted-foreground mr-2">{oc.code}</span>
                      {oc.title}
                    </p>
                    {inds.map((ind: OutcomeIndicator) => {
                      const pct = ind.target > 0 ? Math.min(100, Math.round((ind.current_value / ind.target) * 100)) : 0;
                      const indHistory = historyByIndicator[ind.id] ?? [];

                      // Build trend data — last 8 recorded values
                      const trendData = indHistory.slice(-8).map((h) => ({
                        name: new Date(h.recorded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
                        Value: h.value,
                        Target: ind.target,
                      }));

                      return (
                        <div key={ind.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{ind.title}</p>
                              {ind.description && <p className="text-xs text-muted-foreground mt-0.5">{ind.description}</p>}
                            </div>
                            <IndicatorValueForm indicator={ind} />
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Baseline: {ind.baseline} {ind.unit}</span>
                              <span className="font-medium">{ind.current_value} / {ind.target} {ind.unit} ({pct}%)</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct >= 100 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                          </div>

                          {/* Trend chart — only if history exists */}
                          {trendData.length >= 2 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Value Trend</p>
                              <TrendLineChart
                                data={trendData}
                                lines={[
                                  { key: "Value", label: "Actual", color: "#6366f1" },
                                  { key: "Target", label: "Target", color: "#22c55e" },
                                ]}
                              />
                            </div>
                          )}

                          {trendData.length === 1 && (
                            <p className="text-xs text-muted-foreground">Update the value again to see the trend chart.</p>
                          )}
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
