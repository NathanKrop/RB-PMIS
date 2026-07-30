import { NextRequest, NextResponse } from "next/server";
import { buildReportDraft } from "@/lib/reports/report-draft";

export async function GET(request: NextRequest) {
  const workPlanId = request.nextUrl.searchParams.get("work_plan_id");
  if (!workPlanId) {
    return NextResponse.json({ error: "Missing work_plan_id" }, { status: 400 });
  }

  const draft = await buildReportDraft(workPlanId);
  if (!draft) {
    return NextResponse.json({ error: "Work plan not found" }, { status: 404 });
  }

  return NextResponse.json(draft);
}
