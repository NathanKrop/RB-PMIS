import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@rb-pmis.org";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function requireManagement() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "management") return null;
  return user;
}

async function sendInviteEmail(email: string, token: string) {
  if (!SENDGRID_API_KEY) return;
  sgMail.setApiKey(SENDGRID_API_KEY);
  const redeemUrl = `${APP_URL}/redeem?token=${token}`;
  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: "You are invited to RB-PMIS",
    text: `You have been invited to RB-PMIS. Redeem your invite here: ${redeemUrl}`,
    html: `<p>You have been invited to <strong>RB-PMIS</strong>.</p><p><a href="${redeemUrl}">Click here to accept your invitation</a></p><p>This link expires in 7 days.</p>`,
  });
}

// GET — list all invites
export async function GET() {
  const user = await requireManagement();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("invites")
    .select("id, email, role, department_id, redeemed, redeemed_at, expires_at, revoked, created_at, departments(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invites: data });
}

// POST — create invite
export async function POST(req: Request) {
  const user = await requireManagement();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, role, department_id, expires_in_days = 7 } = body || {};
  if (!email || !role) return NextResponse.json({ error: "Missing email or role" }, { status: 400 });

  const supabase = adminClient();
  const token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + Number(expires_in_days) * 24 * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("invites")
    .insert({ token, email, role, department_id: department_id || null, expires_at, redeemed: false, revoked: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try { await sendInviteEmail(email, token); } catch (e) { console.error("SendGrid error", e); }

  return NextResponse.json({ ok: true, invite: data }, { status: 201 });
}

// DELETE — revoke invite
export async function DELETE(req: Request) {
  const user = await requireManagement();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = adminClient();
  const { error } = await supabase.from("invites").update({ revoked: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — resend invite email
export async function PATCH(req: Request) {
  const user = await requireManagement();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = adminClient();
  const { data: invite, error } = await supabase
    .from("invites")
    .select("email, token, redeemed, revoked, expires_at")
    .eq("id", id)
    .single();

  if (error || !invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.redeemed) return NextResponse.json({ error: "Invite already redeemed" }, { status: 400 });
  if (invite.revoked) return NextResponse.json({ error: "Invite has been revoked" }, { status: 400 });

  // Extend expiry by 7 days from now
  const expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  await supabase.from("invites").update({ expires_at }).eq("id", id);

  try { await sendInviteEmail(invite.email, invite.token); } catch (e) { console.error("SendGrid error", e); }

  return NextResponse.json({ ok: true });
}
