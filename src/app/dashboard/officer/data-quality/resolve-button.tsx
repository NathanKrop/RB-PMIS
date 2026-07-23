"use client";

import { Button } from "@/components/ui/button";
import { resolveDataQualityCheck } from "@/lib/actions";
import { CheckCircle2 } from "lucide-react";

export function ResolveCheckButton({ id }: { id: string }) {
  async function handle() {
    await resolveDataQualityCheck(id);
  }
  return (
    <form action={handle}>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-green-600 hover:text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
      </Button>
    </form>
  );
}
