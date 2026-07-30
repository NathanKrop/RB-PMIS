import { createClient } from "@/lib/supabase/server";
import { RiskRegister } from "@/components/risk-register";
import type { Department, Risk } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function OfficerRisksPage() {
  const supabase = await createClient();
  const [{ data: risks }, { data: departments }] = await Promise.all([supabase.from("risks").select("*, departments(name)").order("created_at", { ascending: false }), supabase.from("departments").select("*").order("name")]);
  return <div className="space-y-6"><div><Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Risk Register</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Risk Register</h1><p className="mt-1 text-sm text-muted-foreground">Track risks, escalation, and mitigation effectiveness</p></div><RiskRegister risks={(risks ?? []) as (Risk & { departments: { name: string } | null })[]} departments={(departments ?? []) as Department[]} editable /></div>;
}
