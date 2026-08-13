"use client"
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RedemptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) return setError('Missing invite token')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    try {
      setLoading(true)
      const res = await fetch('/api/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      // Redirect to login or dashboard
      router.push('/auth/signin')
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 border rounded">
      <h2 className="text-lg font-semibold mb-4">Redeem Invite</h2>
      <p className="text-sm text-muted-foreground mb-4">Set a password for your account.</p>
      <div className="mb-3">
        <label className="block text-sm mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1">Confirm Password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
        {loading ? 'Please wait...' : 'Create account'}
      </button>
    </form>
  )
}
