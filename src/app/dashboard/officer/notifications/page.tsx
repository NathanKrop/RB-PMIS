import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notification-list";

export default async function OfficerNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Your alerts, reminders, and updates</p>
      </div>
      <NotificationList notifications={notifications ?? []} />
    </div>
  );
}
