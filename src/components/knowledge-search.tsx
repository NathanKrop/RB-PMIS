"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { KnowledgeItem } from "@/lib/types";

const categoryLabel: Record<string, string> = {
  lessons_learned: "Lessons Learned",
  best_practice: "Best Practice",
  case_study: "Case Study",
  success_story: "Success Story",
};

interface KnowledgeSearchItem extends KnowledgeItem {
  departments?: { name: string } | null;
}

interface KnowledgeSearchProps {
  items: KnowledgeSearchItem[];
  departments?: { id: string; name: string }[];
  hideDepartmentFilter?: boolean;
}

export function KnowledgeSearch({ items, departments = [], hideDepartmentFilter = false }: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [period, setPeriod] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).filter(Boolean),
    [items]
  );

  const periods = useMemo(
    () => Array.from(new Set(items.map((item) => item.period_reference).filter(Boolean))) as string[],
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (department && item.departments?.name !== department) return false;
      if (period && item.period_reference !== period) return false;

      if (!normalizedQuery) return true;
      const haystack = [
        item.title,
        item.content,
        item.tags,
        item.period_reference,
        item.departments?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, category, department, period, query]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Knowledge Search</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Search title, content, tags, category, department, and period.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search knowledge items..."
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-w-[10rem]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">Any</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabel[cat] ?? cat}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {!hideDepartmentFilter && (
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="min-w-[10rem]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="">Any</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="min-w-[10rem]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">Any</SelectItem>
                    {periods.map((periodValue) => (
                      <SelectItem key={periodValue} value={periodValue}>
                        {periodValue}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No knowledge items match your search and filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{categoryLabel[item.category] ?? item.category}</Badge>
                      {item.departments?.name && <span>{item.departments.name}</span>}
                      {item.period_reference && <span>{item.period_reference}</span>}
                    </div>
                  </div>
                  {item.tags && (
                    <div className="flex flex-wrap items-center gap-1">
                      {item.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-6">
                <p className="whitespace-pre-wrap">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
