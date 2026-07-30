import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeneficiaryForm } from "./beneficiary-form";
import { Users, UserCheck, MapPin } from "lucide-react";
import type { Beneficiary } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function DepartmentBeneficiariesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const [{ data: beneficiaries }, { data: activities }] = await Promise.all([
    supabase.from("beneficiaries").select("*").eq("department_id", deptId).order("created_at", { ascending: false }),
    supabase.from("activities").select("id, description").eq("department_id", deptId).order("created_at", { ascending: false }),
  ]);

  const total = beneficiaries?.length ?? 0;
  const male = beneficiaries?.filter((b) => b.gender === "male").length ?? 0;
  const female = beneficiaries?.filter((b) => b.gender === "female").length ?? 0;
  const withTestimonial = beneficiaries?.filter((b) => b.testimonial).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Beneficiaries</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Beneficiaries</h1>
          <p className="text-sm text-muted-foreground mt-1">Register and track beneficiaries for your activities</p>
        </div>
        <BeneficiaryForm activities={activities ?? []} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total", value: total, icon: Users },
          { label: "Male", value: male, icon: UserCheck },
          { label: "Female", value: female, icon: UserCheck },
          { label: "With Testimonial", value: withTestimonial, icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {(!beneficiaries || beneficiaries.length === 0) ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No beneficiaries registered yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(beneficiaries as Beneficiary[]).map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{b.full_name}</CardTitle>
                  <div className="flex gap-2 shrink-0">
                    {b.gender && <Badge variant="outline" className="capitalize">{b.gender}</Badge>}
                    {b.age && <Badge variant="secondary">{b.age} yrs</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {b.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</span>}
                  {b.contact && <span>{b.contact}</span>}
                </div>
              </CardHeader>
              {(b.feedback || b.testimonial) && (
                <CardContent className="text-sm space-y-2">
                  {b.feedback && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Feedback</p>
                      <p className="mt-0.5">{b.feedback}</p>
                    </div>
                  )}
                  {b.testimonial && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Testimonial</p>
                      <p className="mt-0.5 italic">&quot;{b.testimonial}&quot;</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
