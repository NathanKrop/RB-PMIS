import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DepartmentForm } from "./department-form";
import { UserDepartmentForm } from "./user-department-form";
import type { Department, UserProfile } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function DepartmentsPage() {
  const supabase = await createClient();

  const [{ data: departments }, { data: users }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("users").select("*").order("full_name"),
  ]);

  const usersByDept: Record<string, UserProfile[]> = {};
  const unassigned: UserProfile[] = [];
  for (const u of (users ?? [])) {
    if (u.department_id) {
      usersByDept[u.department_id] = [...(usersByDept[u.department_id] ?? []), u];
    } else {
      unassigned.push(u);
    }
  }

  const roleLabel: Record<string, string> = {
    department_user: "Dept. User",
    reporting_officer: "Officer",
    management: "Management",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Departments</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage departments and user assignments</p>
        </div>
        <DepartmentForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(departments ?? []).map((d: Department) => (
          <Card key={d.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{d.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(usersByDept[d.id] ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No users assigned</p>
              ) : (
                (usersByDept[d.id] ?? []).map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{u.full_name ?? u.email}</span>
                    <Badge variant="secondary" className="text-xs ml-2 shrink-0">{roleLabel[u.role]}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unassigned Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassigned.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{u.full_name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel[u.role]}</p>
                </div>
                {u.role === "department_user" && (
                  <UserDepartmentForm userId={u.id} departments={departments ?? []} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
