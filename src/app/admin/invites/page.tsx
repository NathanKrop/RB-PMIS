import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteManager } from "./InviteManager";

export default async function AdminInvitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "management") redirect("/dashboard/management");

  const [{ data: invites }, { data: departments }] = await Promise.all([
    supabase.from("invites")
      .select("id, email, role, department_id, redeemed, redeemed_at, expires_at, revoked, created_at, departments(name)")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">User Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite new users, track redemption status, revoke or resend invitations
          </p>
        </div>
        <InviteManager invites={invites ?? []} departments={departments ?? []} />
      </div>
    </div>
  );
}
