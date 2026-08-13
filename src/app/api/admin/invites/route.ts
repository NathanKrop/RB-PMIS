import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
const ADMIN_INVITE_KEY = process.env.ADMIN_INVITE_KEY

export async function POST(req: Request) {
  try {
    const adminSecret = req.headers.get('x-admin-secret')
    if (!ADMIN_INVITE_KEY || adminSecret !== ADMIN_INVITE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, role, department_id, expires_in_days } = body || {}
    if (!email || !role) return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string)

    const token = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
    const expires_at = expires_in_days ? new Date(Date.now() + Number(expires_in_days) * 24 * 3600 * 1000).toISOString() : null

    const payload: any = { token, email, role, redeemed: false }
    if (department_id) payload.department_id = department_id
    if (expires_at) payload.expires_at = expires_at

    const { data, error } = await supabase.from('invites').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // TODO: send email with token using SMTP or transactional provider if configured

    return NextResponse.json({ ok: true, invite: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
