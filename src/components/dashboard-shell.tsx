"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, FileText, Upload,
  BarChart2, Settings, LogOut, Menu, X, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import type { UserRole } from "@/lib/types";

interface Profile {
  full_name: string | null;
  email: string;
  role: UserRole;
  departments?: { name: string } | null;
}

const navByRole: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  department_user: [
    { href: "/dashboard/department", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/department/work-plans", label: "Work Plans", icon: ClipboardList },
    { href: "/dashboard/department/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/department/evidence", label: "Evidence", icon: Upload },
  ],
  reporting_officer: [
    { href: "/dashboard/officer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/officer/departments", label: "Departments", icon: Settings },
    { href: "/dashboard/officer/framework", label: "Results Framework", icon: BarChart2 },
    { href: "/dashboard/officer/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/officer/evidence", label: "Evidence Review", icon: Upload },
  ],
  management: [
    { href: "/dashboard/management", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/management/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/management/indicators", label: "Indicators", icon: BarChart2 },
  ],
};

const roleLabel: Record<UserRole, string> = {
  department_user: "Department User",
  reporting_officer: "Reporting Officer",
  management: "Management",
};

export function DashboardShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const role = profile?.role ?? "department_user";
  const isPreview = pathname.startsWith("/preview");
  const roleSlug = { department_user: "department", reporting_officer: "officer", management: "management" }[role];
  const base = isPreview ? `/preview/${roleSlug}` : `/dashboard/${roleSlug}`;
  const nav = navByRole[role].map((item) => ({
    ...item,
    href: item.href.replace(`/dashboard/${roleSlug}`, base),
  }));

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Invalid profile data.</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Invalid profile data.</div>;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:flex"
        )}
      >
        <div className="h-14 flex items-center px-4 border-b font-semibold text-lg shrink-0">
          RB-PMIS
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t space-y-1">
          <p className="text-xs font-medium truncate">{profile.full_name ?? profile.email}</p>
          <p className="text-xs text-muted-foreground">{roleLabel[profile.role]}</p>
          {profile.departments?.name && (
            <p className="text-xs text-muted-foreground truncate">{profile.departments.name}</p>
          )}
          <form action={isPreview ? undefined : logout} className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              {...(isPreview ? { type: "button", onClick: () => window.location.href = "/auth/login" } : { type: "submit" })}
            >
              <LogOut className="h-4 w-4" /> {isPreview ? "Exit Preview" : "Sign out"}
            </Button>
          </form>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="flex-1" />
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
