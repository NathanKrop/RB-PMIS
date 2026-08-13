"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Invite {
  id: string;
  email: string;
  role: string;
  department_id: string | null;
  redeemed: boolean;
  redeemed_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
  departments: { name: string }[] | null;
}

interface Dept { id: string; name: string; }

const ROLE_LABELS: Record<string, string> = {
  department_user: "Trainer",
  reporting_officer: "Reporting Officer",
  management: "Management",
  finance: "Finance Officer",
};

const STATUS_COLORS: Record<string, string> = {
  redeemed: "bg-green-100 text-green-700",
  revoked: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
};

function inviteStatus(inv: Invite): string {
  if (inv.redeemed) return "redeemed";
  if (inv.revoked) return "revoked";
  if (inv.expires_at && new Date(inv.expires_at) < new Date()) return "expired";
  return "pending";
}

export function InviteManager({ invites: initial, departments }: { invites: Invite[]; departments: Dept[] }) {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("department_user");
  const [deptId, setDeptId] = useState("");
  const [expires, setExpires] = useState(7);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, department_id: deptId || null, expires_in_days: expires }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed"); return; }
    setOpen(false);
    setEmail(""); setRole("department_user"); setDeptId(""); setExpires(7);
    startTransition(() => router.refresh());
    // Optimistically prepend
    setInvites((prev) => [json.invite, ...prev]);
  }

  async function handleRevoke(id: string) {
    setActionError(null);
    const res = await fetch("/api/admin/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) { setActionError(json.error ?? "Failed"); return; }
    setInvites((prev) => prev.map((i) => i.id === id ? { ...i, revoked: true } : i));
  }

  async function handleResend(id: string) {
    setActionError(null);
    const res = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) { setActionError(json.error ?? "Failed"); return; }
  }

  const counts = {
    total: invites.length,
    pending: invites.filter((i) => inviteStatus(i) === "pending").length,
    redeemed: invites.filter((i) => inviteStatus(i) === "redeemed").length,
    revoked: invites.filter((i) => inviteStatus(i) === "revoked").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total", value: counts.total },
          { label: "Pending", value: counts.pending },
          { label: "Redeemed", value: counts.redeemed },
          { label: "Revoked", value: counts.revoked },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Create button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Send Invitation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Send Invitation</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department (optional)</Label>
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expires in (days)</Label>
                <Input type="number" min={1} max={30} value={expires} onChange={(e) => setExpires(Number(e.target.value))} className="w-24" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>Send Invite</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {/* Invite list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">All Invitations</CardTitle></CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
          ) : (
            <div className="divide-y text-sm">
              {invites.map((inv) => {
                const status = inviteStatus(inv);
                const canAct = status === "pending" || status === "expired";
                return (
                  <div key={inv.id} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[inv.role] ?? inv.role}
                        {inv.departments?.[0]?.name && ` · ${inv.departments[0].name}`}
                        {inv.expires_at && ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                        {inv.redeemed_at && ` · Redeemed ${new Date(inv.redeemed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>{status}</span>
                      {canAct && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleResend(inv.id)}>
                            Resend
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-700 border-red-300" onClick={() => handleRevoke(inv.id)}>
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
