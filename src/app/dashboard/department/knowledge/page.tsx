import { createClient } from "@/lib/supabase/server";
import { KnowledgeSearch } from "@/components/knowledge-search";
import type { KnowledgeItem } from "@/lib/types";

export default async function DepartmentKnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();

  const { data: items } = await supabase
    .from("knowledge_items")
    .select("*, departments(name)")
    .order("created_at", { ascending: false });

  const filtered = (items ?? []).filter(
    (i) => !i.department_id || i.department_id === profile?.department_id
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Repository</h1>
        <p className="text-sm text-muted-foreground mt-1">Lessons learned, best practices, and success stories</p>
      </div>

      <KnowledgeSearch items={filtered as (KnowledgeItem & { departments: { name: string } | null })[]} hideDepartmentFilter />
    </div>
  );
}
