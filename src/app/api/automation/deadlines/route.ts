import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get("authorization");
  const isCron = secretHeader === `Bearer ${process.env.CRON_SECRET}`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });

  if (isCron) {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
    const { data, error } = await supabase.rpc("process_reporting_deadlines");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notifications_created: data });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          return;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporting_officer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const serviceClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
  const { data, error } = await serviceClient.rpc("process_reporting_deadlines");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications_created: data });
}
