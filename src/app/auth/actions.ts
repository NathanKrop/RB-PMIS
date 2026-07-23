"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login failed." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");

  const role = profile?.role as UserRole;
  if (role === "reporting_officer") redirect("/dashboard/officer");
  if (role === "management") redirect("/dashboard/management");
  redirect("/dashboard/department");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const departmentId = formData.get("department_id");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        department_id: typeof departmentId === "string" ? departmentId : null,
      },
    },
  });

  if (error) return { error: error.message };

  // If session is null, email confirmation is still enabled on Supabase
  if (!data.session) {
    // Sign in immediately after signup
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: "Account created. Please sign in manually." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/department");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
