import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Trainer = {
  id: string;
  full_name: string | null;
  email: string;
  department_id: string | null;
  departments: { name: string }[] | null;
};

type WorkPlan = {
  created_by: string | null;
  status: string;
  period_name: string;
  period_type: string;
};

export function WorkPlanSubmissionStatus({ trainers, workPlans }: { trainers: Trainer[]; workPlans: WorkPlan[] }) {
  const latestPlanByTrainer = new Map<string, WorkPlan>();
  const unassignedPlanCount = workPlans.filter((plan) => !plan.created_by).length;

  for (const plan of workPlans) {
    if (plan.created_by && !latestPlanByTrainer.has(plan.created_by)) latestPlanByTrainer.set(plan.created_by, plan);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Trainer Work Plan Submission Status</CardTitle>
        <p className="text-xs text-muted-foreground">Latest work plan per trainer. Draft and no plan are outstanding.</p>
      </CardHeader>
      <CardContent>
        {trainers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No trainers have been added yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {trainers.map((trainer) => {
              const plan = latestPlanByTrainer.get(trainer.id);
              const submitted = Boolean(plan && plan.status !== "draft");
              return (
                <div key={trainer.id} className="flex flex-col gap-1 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{trainer.full_name ?? trainer.email}</p>
                    <p className="text-xs text-muted-foreground">{trainer.departments?.[0]?.name ?? "No department assigned"}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={submitted ? "font-medium text-emerald-600" : "font-medium text-destructive"}>
                      {submitted ? "Submitted" : plan ? "Draft — not submitted" : "Not submitted"}
                    </p>
                    {plan && <p className="text-xs text-muted-foreground">{plan.period_name} · {plan.period_type}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {unassignedPlanCount > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {unassignedPlanCount} legacy work plan{unassignedPlanCount === 1 ? "" : "s"} cannot be matched to a trainer because it was created before owner tracking.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
