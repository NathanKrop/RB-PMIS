"use client"
import { useState } from 'react'

export default function AdminInviteForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('department_user')
  const [departmentId, setDepartmentId] = useState('')
  const [expires, setExpires] = useState(7)
  const [adminKey, setAdminKey] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminKey },
        body: JSON.stringify({ email, role, department_id: departmentId || null, expires_in_days: expires }),
      })
      const json = await res.json()
      setResult({ status: res.status, body: json })
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="max-w-md p-6 border rounded">
      <h3 className="text-lg font-semibold mb-3">Create Invite</h3>
      <div className="mb-2">
        <label className="block text-sm">Admin Key</label>
        <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border rounded">
          <option value="department_user">department_user</option>
          <option value="reporting_officer">reporting_officer</option>
          <option value="management">management</option>
          <option value="finance">finance</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm">Department ID (optional)</label>
        <input value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="mb-4">
        <label className="block text-sm">Expires (days)</label>
        <input type="number" value={expires} onChange={(e) => setExpires(Number(e.target.value))} className="w-24 p-2 border rounded" />
      </div>
      <button disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Creating...' : 'Create Invite'}</button>

      {result && (
        <pre className="mt-4 p-2 bg-gray-50 border rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </form>
  )
}
