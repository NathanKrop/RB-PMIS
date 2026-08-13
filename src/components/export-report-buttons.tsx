"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sheet, Loader2, Presentation } from "lucide-react";
import type { ReportExportData } from "@/lib/export/fetch-report";
import type { HookData } from "jspdf-autotable";

type PdfReportData = ReportExportData;
type PdfDocument = InstanceType<typeof import("jspdf").default> & {
  lastAutoTable?: { finalY: number };
};

interface ExportReportButtonProps {
  reportId: string;
  periodName: string;
}

export function ExportReportButtons({ reportId, periodName }: ExportReportButtonProps) {
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  async function downloadFile(format: "word" | "excel") {
    setLoadingFormat(format);
    try {
      const audience = format === "word" ? "donor" : "management";
      const res = await fetch(`/api/export/${format}?id=${reportId}&audience=${audience}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${audience}-${periodName.replace(/\s+/g, "-")}.${format === "word" ? "docx" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingFormat(null);
    }
  }

  async function downloadPDF() {
    setLoadingFormat("pdf");
    try {
      const res = await fetch(`/api/export/pdf?id=${reportId}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json() as PdfReportData;

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const deptName = data.report.departments?.name ?? "Unknown Department";
      const generatedAt = new Date().toLocaleDateString("en-GB");

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RB-PMIS Performance Report", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(deptName, 105, 28, { align: "center" });
      doc.text(`Period: ${data.report.reporting_period_name}`, 105, 35, { align: "center" });
      doc.text(`Status: ${data.report.status.toUpperCase()}  |  Generated: ${generatedAt}`, 105, 42, { align: "center" });

      let y = 52;

      const fields: [string, string | null][] = [
        ["Outcome Progress", data.report.outcome_progress],
        ["Key Results", data.report.key_results],
        ["Challenges", data.report.challenges],
        ["Adaptive Actions", data.report.adaptive_actions],
        ["Lessons Learned", data.report.lessons_learned],
        ["Next Period Priorities", data.report.next_period_priorities],
      ];

      for (const [label, value] of fields) {
        if (!value) continue;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, 180);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 4;
        if (y > 270) { doc.addPage(); y = 20; }
      }

      // Activities table
      autoTable(doc, {
        startY: y + 4,
        head: [["Activity", "Expected Output", "Status", "Start", "End", "Responsible"]],
        body: data.activities.map((a) => [
          a.description, a.expected_output,
          a.status.replace("_", " "), a.start_date, a.end_date,
          a.responsible_person ?? "—",
        ]),
        headStyles: { fillColor: [30, 30, 30] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 40 } },
        didDrawPage: (details: HookData) => {
          if (details.cursor) y = details.cursor.y;
        },
      });

      // Indicators table
      const finalY = (doc as PdfDocument).lastAutoTable?.finalY ?? y;
      autoTable(doc, {
        startY: finalY + 8,
        head: [["Indicator", "Unit", "Baseline", "Target", "Current", "% Achieved"]],
        body: data.indicators.map((i) => {
          const pct = i.target > 0 ? Math.round((i.current_value / i.target) * 100) : 0;
          return [i.title, i.unit, i.baseline, i.target, i.current_value, `${pct}%`];
        }),
        headStyles: { fillColor: [30, 30, 30] },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      doc.save(`report-${periodName.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost" size="sm"
        className="h-7 px-2 text-xs gap-1"
        disabled={!!loadingFormat}
        onClick={() => downloadFile("word")}
        title="Export donor-facing Word brief"
      >
        {loadingFormat === "word" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
        Word
      </Button>
      <Button
        variant="ghost" size="sm"
        className="h-7 px-2 text-xs gap-1"
        disabled={!!loadingFormat}
        onClick={() => downloadFile("excel")}
        title="Export management Excel summary"
      >
        {loadingFormat === "excel" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sheet className="h-3 w-3" />}
        Excel
      </Button>
      <Button
        variant="ghost" size="sm"
        className="h-7 px-2 text-xs gap-1"
        disabled={!!loadingFormat}
        onClick={downloadPDF}
        title="Export PDF briefing"
      >
        {loadingFormat === "pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Presentation className="h-3 w-3" />}
        Brief
      </Button>
    </div>
  );
}
