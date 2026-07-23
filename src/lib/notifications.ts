"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/", "layout");
}

export async function createNotification(userId: string, title: string, message: string, type: "reminder" | "escalation" | "info" = "info") {
  const supabase = await createClient();
  await supabase.from("notifications").insert({ user_id: userId, title, message, notification_type: type });
}
