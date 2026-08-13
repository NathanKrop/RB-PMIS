import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Will throw at runtime if missing; keeping lightweight for this endpoint
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    const { token, password } = typeof body === "object" && body !== null
      ? body as { token?: unknown; password?: unknown }
      : {};
    if (typeof token !== "string" || typeof password !== "string" || !token || !password) {
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string)

    // Fetch invite
    const { data: invite, error: invErr } = await supabase.from('invites').select('*').eq('token', token).single()
    if (invErr || !invite) return NextResponse.json({ error: 'Invalid invite token' }, { status: 400 })
    if (invite.redeemed) return NextResponse.json({ error: 'Invite already redeemed' }, { status: 400 })
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })

    // Create auth user with metadata so the DB trigger seeds public.users with role/department
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      user_metadata: { role: invite.role, department_id: invite.department_id },
      email_confirm: true,
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })

    // Mark invite redeemed
    await supabase.from('invites').update({ redeemed: true, redeemed_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ ok: true, user: created }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
