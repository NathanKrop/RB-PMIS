import { createClient } from "@/lib/supabase/server";
import { KnowledgeSearch } from "@/components/knowledge-search";
import type { KnowledgeItem } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function ManagementKnowledgePage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("knowledge_items")
    .select("*, departments(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Knowledge Repository</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Knowledge Repository</h1>
        <p className="text-sm text-muted-foreground mt-1">Institutional knowledge, lessons learned, and best practices</p>
      </div>

      <KnowledgeSearch items={(items ?? []) as (KnowledgeItem & { departments: { name: string } | null })[]} />
    </div>
  );
}
