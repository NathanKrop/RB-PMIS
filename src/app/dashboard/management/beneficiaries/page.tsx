import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DonutChart } from "@/components/charts/donut-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { Users, MapPin } from "lucide-react";
import type { Beneficiary } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function ManagementBeneficiariesPage() {
  const supabase = await createClient();

  const [{ data: beneficiaries }, { data: departments }] = await Promise.all([
    supabase.from("beneficiaries").select("*, departments(name)").order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  const all = beneficiaries ?? [];
  const total = all.length;
  const male = all.filter((b) => b.gender === "male").length;
  const female = all.filter((b) => b.gender === "female").length;
  const other = all.filter((b) => b.gender === "other").length;

  const genderDonut = [
    { name: "Male", value: male, color: "#6366f1" },
    { name: "Female", value: female, color: "#ec4899" },
    { name: "Other", value: other, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const byDept = (departments ?? []).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
    value: all.filter((b) => b.department_id === d.id).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Beneficiaries</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Beneficiaries</h1>
        <p className="text-sm text-muted-foreground mt-1">Organisation-wide beneficiary demographics and impact tracking</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Beneficiaries", value: total },
          { label: "Male", value: male },
          { label: "Female", value: female },
          { label: "With Testimonials", value: all.filter((b) => b.testimonial).length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gender Distribution</CardTitle></CardHeader>
          <CardContent><DonutChart data={genderDonut} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Beneficiaries by Department</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={byDept} valueLabel="Beneficiaries" /></CardContent>
        </Card>
      </div>

      {all.filter((b) => b.testimonial).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Testimonials</h2>
          <div className="space-y-3">
            {(all.filter((b) => b.testimonial) as (Beneficiary & { departments: { name: string } | null })[]).map((b) => (
              <Card key={b.id}>
                <CardContent className="py-4">
                  <p className="text-sm italic">&quot;{b.testimonial}&quot;</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs font-medium">{b.full_name}</span>
                    {b.gender && <Badge variant="outline" className="text-xs capitalize">{b.gender}</Badge>}
                    {b.departments?.name && <span className="text-xs text-muted-foreground">{b.departments.name}</span>}
                    {b.location && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
