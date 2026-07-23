import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KnowledgeForm } from "./knowledge-form";
import { KnowledgeDeleteButton } from "./knowledge-delete-button";
import type { KnowledgeItem } from "@/lib/types";

const categoryLabel: Record<string, string> = {
  lessons_learned: "Lessons Learned",
  best_practice: "Best Practice",
  case_study: "Case Study",
  success_story: "Success Story",
};

const categoryVariant: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  lessons_learned: "warning",
  best_practice: "success",
  case_study: "outline",
  success_story: "default",
};

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
          <h1 className="text-2xl font-semibold">Knowledge Repository</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage lessons learned, best practices, case studies, and success stories</p>
        </div>
        <KnowledgeForm departments={departments ?? []} />
      </div>

      {(!items || items.length === 0) ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No knowledge entries yet. Add the first one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(items as (KnowledgeItem & { departments: { name: string } | null })[]).map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={categoryVariant[item.category] ?? "secondary"}>
                        {categoryLabel[item.category] ?? item.category}
                      </Badge>
                      {item.departments?.name && (
                        <span className="text-xs text-muted-foreground">{item.departments.name}</span>
                      )}
                      {item.period_reference && (
                        <span className="text-xs text-muted-foreground">{item.period_reference}</span>
                      )}
                    </div>
                  </div>
                  <KnowledgeDeleteButton id={item.id} />
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="whitespace-pre-wrap">{item.content}</p>
                {item.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
