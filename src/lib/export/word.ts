import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType,
} from "docx";
import type { ReportExportData } from "./fetch-report";

function section(title: string, content: string | null) {
  if (!content) return [];
  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
    new Paragraph({ text: content, spacing: { after: 200 } }),
  ];
}

function cell(text: string, bold = false) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: text ?? "", bold, size: 20 })] })],
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
}

export async function generateWordReport(data: ReportExportData, audience: string = "donor"): Promise<Buffer> {
  const { report, activities, indicators } = data;
  const deptName = report.departments?.name ?? "Unknown Department";
  const generatedAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const activityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell("Activity", true), cell("Expected Output", true), cell("Status", true),
          cell("Start", true), cell("End", true), cell("Responsible", true),
        ],
      }),
      ...(activities.length === 0
        ? [new TableRow({ children: [new TableCell({ columnSpan: 6, children: [new Paragraph("No activities recorded.")] })] })]
        : activities.map((a) =>
            new TableRow({
              children: [
                cell(a.description),
                cell(a.expected_output),
                cell(a.status.replace("_", " ")),
                cell(a.start_date),
                cell(a.end_date),
                cell(a.responsible_person ?? "—"),
              ],
            })
          )),
    ],
  });

  const indicatorTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [cell("Indicator", true), cell("Unit", true), cell("Baseline", true), cell("Target", true), cell("Current", true), cell("% Achieved", true)],
      }),
      ...(indicators.length === 0
        ? [new TableRow({ children: [new TableCell({ columnSpan: 6, children: [new Paragraph("No indicators defined.")] })] })]
        : indicators.map((i) => {
            const pct = i.target > 0 ? Math.round((i.current_value / i.target) * 100) : 0;
            return new TableRow({
              children: [
                cell(i.title), cell(i.unit),
                cell(String(i.baseline)), cell(String(i.target)),
                cell(String(i.current_value)), cell(`${pct}%`),
              ],
            });
          })),
    ],
  });

  const title = audience === "management" ? "RB-PMIS Management Brief" : "RB-PMIS Donor Report";
  const subtitle = audience === "management"
    ? "Management-focused summary of achievements, risks, and follow-up actions"
    : "Donor-facing summary of results, progress, and evidence of impact";

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({ text: deptName, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: subtitle, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
        new Paragraph({ text: `Period: ${report.reporting_period_name}`, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `Status: ${report.status.toUpperCase()}`, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `Generated: ${generatedAt}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

        ...section("Outcome Progress", report.outcome_progress),
        ...section("Key Results", report.key_results),
        ...section("Challenges", report.challenges),
        ...section("Adaptive Actions", report.adaptive_actions),
        ...section("Lessons Learned", report.lessons_learned),
        ...section("Next Period Priorities", report.next_period_priorities),

        new Paragraph({ text: "Activities", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        activityTable,

        new Paragraph({ text: "Outcome Indicators", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
        indicatorTable,
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
