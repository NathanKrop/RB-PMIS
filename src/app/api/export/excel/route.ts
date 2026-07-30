import { NextRequest, NextResponse } from "next/server";
import { fetchReportData } from "@/lib/export/fetch-report";
import { generateExcelReport } from "@/lib/export/excel";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const audience = req.nextUrl.searchParams.get("audience") ?? "management";
  if (!id) return NextResponse.json({ error: "Missing report id" }, { status: 400 });

  const data = await fetchReportData(id);
  if (!data) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const buffer = await generateExcelReport(data, audience);
  const filename = `${audience}-${data.report.reporting_period_name.replace(/\s+/g, "-")}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
