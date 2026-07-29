import { createClient } from "@/lib/supabase/server";
import { createEvidenceSignedUrl } from "@/lib/evidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvidenceActions } from "./evidence-actions";
import { Download, Eye } from "lucide-react";
import type { Evidence } from "@/lib/types";

type EvidenceUploader = {
  full_name: string | null;
  email: string;
  departments: { name: string } | null;
};

type EvidenceItemWithPreview = Evidence & { users: EvidenceUploader | null; preview_url?: string | null };

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  pending: "warning",
  verified: "success",
  requires_clarification: "outline",
  rejected: "destructive",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function OfficerEvidencePage() {
  const supabase = await createClient();

  const { data: evidence } = await supabase
    .from("evidence")
    .select("*, users(full_name, email, departments(name))")
    .order("created_at", { ascending: false });

  const evidenceWithPreview = await Promise.all(
    (evidence ?? []).map(async (item: EvidenceItemWithPreview) => ({
      ...item,
      preview_url: item.file_path ? await createEvidenceSignedUrl(item.file_path) : null,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Evidence Review</h1>
        <p className="text-sm text-muted-foreground mt-1">Verify or reject submitted evidence files</p>
      </div>

      {(!evidenceWithPreview || evidenceWithPreview.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No evidence submissions yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {evidenceWithPreview.map((e) => (
          <Card key={e.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-snug">{e.title}</CardTitle>
                <Badge variant={statusVariant[e.verification_status] ?? "secondary"} className="capitalize shrink-0 text-xs">
                  {e.verification_status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{e.file_type} · {formatBytes(e.file_size)}</p>
                <p>{e.users?.full_name ?? e.users?.email} · {e.users?.departments?.name}</p>
                <p>{new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {e.preview_url && (
                  <a
                    href={e.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </a>
                )}
                {e.preview_url && (
                  <a
                    href={e.preview_url}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
              </div>
              <EvidenceActions evidence={e} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
