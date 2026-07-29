import { createClient } from "@/lib/supabase/server";
import { createEvidenceSignedUrl } from "@/lib/evidence";
import { Card, CardContent } from "@/components/ui/card";
import { EvidenceUploadForm } from "./evidence-upload-form";
import { EvidenceGallery } from "@/components/evidence-gallery";
import type { Evidence } from "@/lib/types";

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

  const evidenceWithPreview = await Promise.all(
    (evidence ?? []).map(async (item: Evidence) => ({
      ...item,
      preview_url: item.file_path ? await createEvidenceSignedUrl(item.file_path) : null,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evidence</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage supporting evidence files</p>
        </div>
        <EvidenceUploadForm activities={activities ?? []} objectives={objectives ?? []} outcomes={outcomes ?? []} outputs={outputs ?? []} indicators={indicators ?? []} reports={reports ?? []} />
      </div>

      {(!evidenceWithPreview || evidenceWithPreview.length === 0) ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No evidence uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <EvidenceGallery items={evidenceWithPreview} />
      )}
    </div>
  );
}
