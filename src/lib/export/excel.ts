import ExcelJS from "exceljs";
import type { ReportExportData } from "./fetch-report";

export async function generateExcelReport(data: ReportExportData, audience: string = "management"): Promise<Buffer> {
  const { report, activities, indicators } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = "RB-PMIS";
  wb.created = new Date();

  // ── Summary sheet ──────────────────────────────────────────
  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ width: 30 }, { width: 60 }];

  const titleRow = summary.addRow([audience === "management" ? "RB-PMIS Management Summary" : "RB-PMIS Donor Summary"]);
  titleRow.font = { bold: true, size: 14 };
  summary.mergeCells("A1:B1");
  titleRow.alignment = { horizontal: "center" };

  summary.addRow([]);
  summary.addRow(["Department", report.departments?.name ?? "—"]);
  summary.addRow(["Audience", audience === "management" ? "Management" : "Donor"]);
  summary.addRow(["Period", report.reporting_period_name]);
  summary.addRow(["Period Type", report.reporting_period]);
  summary.addRow(["Status", report.status.toUpperCase()]);
  summary.addRow(["Generated", new Date().toLocaleDateString("en-GB")]);
  summary.addRow([]);

  const fields: [string, string | null][] = [
    ["Outcome Progress", report.outcome_progress],
    ["Key Results", report.key_results],
    ["Challenges", report.challenges],
    ["Adaptive Actions", report.adaptive_actions],
    ["Lessons Learned", report.lessons_learned],
    ["Next Period Priorities", report.next_period_priorities],
  ];

  for (const [label, value] of fields) {
    if (value) {
      const labelRow = summary.addRow([label, value]);
      labelRow.getCell(1).font = { bold: true };
      labelRow.getCell(2).alignment = { wrapText: true };
      summary.addRow([]);
    }
  }

  // ── Activities sheet ───────────────────────────────────────
  const actSheet = wb.addWorksheet("Activities");
  actSheet.columns = [
    { header: "Activity", key: "description", width: 35 },
    { header: "Expected Output", key: "expected_output", width: 30 },
    { header: "Output", key: "output", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Start Date", key: "start_date", width: 14 },
    { header: "End Date", key: "end_date", width: 14 },
    { header: "Responsible", key: "responsible_person", width: 20 },
    { header: "Resources", key: "required_resources", width: 25 },
    { header: "Risks", key: "anticipated_risks", width: 25 },
    { header: "Mitigation", key: "mitigation_measures", width: 25 },
  ];

  const actHeader = actSheet.getRow(1);
  actHeader.font = { bold: true };
  actHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  for (const a of activities) {
    actSheet.addRow({
      description: a.description,
      expected_output: a.expected_output,
      output: a.outputs ? `${a.outputs.code} — ${a.outputs.title}` : "—",
      status: a.status.replace("_", " "),
      start_date: a.start_date,
      end_date: a.end_date,
      responsible_person: a.responsible_person ?? "—",
      required_resources: a.required_resources ?? "—",
      anticipated_risks: a.anticipated_risks ?? "—",
      mitigation_measures: a.mitigation_measures ?? "—",
    });
  }

  actSheet.eachRow((row) => { row.alignment = { wrapText: true, vertical: "top" }; });

  // ── Indicators sheet ───────────────────────────────────────
  const indSheet = wb.addWorksheet("Indicators");
  indSheet.columns = [
    { header: "Indicator", key: "title", width: 35 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "Baseline", key: "baseline", width: 12 },
    { header: "Target", key: "target", width: 12 },
    { header: "Current Value", key: "current_value", width: 14 },
    { header: "% Achieved", key: "pct", width: 14 },
  ];

  const indHeader = indSheet.getRow(1);
  indHeader.font = { bold: true };
  indHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  for (const i of indicators) {
    const pct = i.target > 0 ? Math.round((i.current_value / i.target) * 100) : 0;
    const row = indSheet.addRow({ title: i.title, unit: i.unit, baseline: i.baseline, target: i.target, current_value: i.current_value, pct: `${pct}%` });
    row.getCell("pct").font = { color: { argb: pct >= 100 ? "FF16A34A" : pct >= 50 ? "FFD97706" : "FFDC2626" } };
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
