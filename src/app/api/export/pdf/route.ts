import { NextRequest, NextResponse } from "next/server";
import { fetchReportData } from "@/lib/export/fetch-report";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing report id" }, { status: 400 });

  const data = await fetchReportData(id);
  if (!data) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // jspdf must run in browser — return JSON for client-side PDF generation
  return NextResponse.json(data);
}
