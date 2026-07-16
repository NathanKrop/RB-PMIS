"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserDepartment } from "@/lib/actions";
import type { Department } from "@/lib/types";

export function UserDepartmentForm({ userId, departments }: { userId: string; departments: Department[] }) {
  const [deptId, setDeptId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!deptId) return;
    setLoading(true);
    await updateUserDepartment(userId, deptId);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Select onValueChange={setDeptId}>
        <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Assign dept." /></SelectTrigger>
        <SelectContent>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" disabled={!deptId || loading} onClick={handle}>
        {loading ? "…" : "Assign"}
      </Button>
    </div>
  );
}
