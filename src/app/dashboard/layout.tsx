import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("users").select("*, departments(name)").eq("id", user.id).single(),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  if (!profile) redirect("/auth/login");

  return (
    <DashboardShell profile={profile} notifications={notifications ?? []}>
      {children}
    </DashboardShell>
  );
}
