import { createClient } from "@/lib/supabase/server";
import { KnowledgeSearch } from "@/components/knowledge-search";
import { KnowledgeForm } from "./knowledge-form";
import type { KnowledgeItem } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function OfficerKnowledgePage() {
  const supabase = await createClient();

  const [{ data: items }, { data: departments }] = await Promise.all([
    supabase
      .from("knowledge_items")
      .select("*, departments(name)")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Knowledge Repository</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Knowledge Repository</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage lessons learned, best practices, case studies, and success stories</p>
        </div>
        <KnowledgeForm departments={departments ?? []} />
      </div>

      <KnowledgeSearch items={(items ?? []) as (KnowledgeItem & { departments: { name: string } | null })[]} departments={departments ?? []} />
    </div>
  );
}
