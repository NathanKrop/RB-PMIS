import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const CATEGORIES = ["lessons_learned", "best_practice", "case_study", "success_story"] as const;

export default async function ManagementKnowledgePage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("knowledge_items")
    .select("*, departments(name)")
    .order("created_at", { ascending: false });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = (items ?? []).filter((i) => i.category === cat);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Repository</h1>
        <p className="text-sm text-muted-foreground mt-1">Institutional knowledge, lessons learned, and best practices</p>
      </div>

      {(!items || items.length === 0) ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No knowledge entries available yet.
          </CardContent>
        </Card>
      ) : (
        CATEGORIES.map((cat) => {
          const catItems = grouped[cat] ?? [];
          if (catItems.length === 0) return null;
          return (
            <section key={cat} className="space-y-3">
              <h2 className="text-base font-semibold">{categoryLabel[cat]}</h2>
              <div className="space-y-3">
                {(catItems as (KnowledgeItem & { departments: { name: string } | null })[]).map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={categoryVariant[item.category] ?? "secondary"}>
                            {categoryLabel[item.category]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.departments?.name && <span>{item.departments.name}</span>}
                        {item.period_reference && <span>{item.period_reference}</span>}
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
            </section>
          );
        })
      )}
    </div>
  );
}
