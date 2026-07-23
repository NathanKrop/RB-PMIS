import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvidenceUploadForm } from "./evidence-upload-form";
import { MapPin } from "lucide-react";
import type { Evidence } from "@/lib/types";

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

export default async function EvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();

  const [{ data: evidence }, { data: activities }, { data: objectives }, { data: outcomes }, { data: outputs }, { data: indicators }, { data: reports }] = await Promise.all([
    supabase.from("evidence").select("*").eq("uploaded_by", user!.id).order("created_at", { ascending: false }),
    supabase.from("activities").select("id, description").eq("department_id", profile?.department_id).order("created_at", { ascending: false }),
    supabase.from("strategic_objectives").select("id, code, title").order("code"),
    supabase.from("outcomes").select("id, code, title").order("code"),
    supabase.from("outputs").select("id, code, title").order("code"),
    supabase.from("indicators").select("id, title").order("created_at", { ascending: false }),
    supabase.from("reports").select("id, reporting_period_name").eq("department_id", profile?.department_id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evidence</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage supporting evidence files</p>
        </div>
        <EvidenceUploadForm activities={activities ?? []} objectives={objectives ?? []} outcomes={outcomes ?? []} outputs={outputs ?? []} indicators={indicators ?? []} reports={reports ?? []} />
      </div>

      {(!evidence || evidence.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No evidence uploaded yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(evidence ?? []).map((e: Evidence) => (
          <Card key={e.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-snug">{e.title}</CardTitle>
                <Badge variant={statusVariant[e.verification_status] ?? "secondary"} className="capitalize shrink-0 text-xs">
                  {e.verification_status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              {e.caption && <p className="text-foreground text-xs">{e.caption}</p>}
              <p>{e.file_type} · {formatBytes(e.file_size)}</p>
              {e.location && (
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</p>
              )}
              {e.latitude && e.longitude && (
                <p className="font-mono">GPS: {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}</p>
              )}
              <p>{new Date(e.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
