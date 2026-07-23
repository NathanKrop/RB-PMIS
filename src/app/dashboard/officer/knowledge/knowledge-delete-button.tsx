"use client";

import { Button } from "@/components/ui/button";
import { deleteKnowledgeItem } from "@/lib/actions";
import { Trash2 } from "lucide-react";

export function KnowledgeDeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("Delete this knowledge entry?")) return;
    await deleteKnowledgeItem(id);
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
