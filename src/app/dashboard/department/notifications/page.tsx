import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notification-list";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

export default async function DepartmentNotificationsPage() {
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
        <Breadcrumb compact className="mb-3">
          <BreadcrumbItem current>Notifications</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Your alerts, reminders, and updates</p>
      </div>
      <NotificationList notifications={notifications ?? []} />
    </div>
  );
}
