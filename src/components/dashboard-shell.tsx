"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, FileText, Upload,
  BarChart2, Settings, LogOut, Menu, X, BookOpen, Bell, Target,
  ClipboardCheck, ShieldAlert, Users, Briefcase, CalendarClock,
  MessageSquareText, DollarSign, Receipt, FilePlus, Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import { NotificationBell } from "@/components/notification-bell";
import type { UserRole } from "@/lib/types";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  notification_type: "reminder" | "escalation" | "info";
  created_at: string;
}

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
    { href: "/dashboard/department/reports", label: "Report", icon: FileText },
    { href: "/dashboard/department/evidence", label: "Evidence", icon: Upload },
    { href: "/dashboard/department/reviews", label: "Reviews", icon: MessageSquareText },
    { href: "/dashboard/department/beneficiaries", label: "Beneficiaries", icon: Users },
    { href: "/dashboard/department/resources", label: "Resources", icon: Briefcase },
    { href: "/dashboard/department/knowledge", label: "Knowledge", icon: BookOpen },
    { href: "/dashboard/department/notifications", label: "Notifications", icon: Bell },
  ],
  reporting_officer: [
    { href: "/dashboard/officer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/officer/departments", label: "Departments", icon: Settings },
    { href: "/dashboard/officer/framework", label: "Results Framework", icon: BarChart2 },
    { href: "/dashboard/officer/reports", label: "Report", icon: FileText },
    { href: "/dashboard/officer/evidence", label: "Evidence Review", icon: Upload },
    { href: "/dashboard/officer/beneficiaries", label: "Beneficiaries", icon: Users },
    { href: "/dashboard/officer/resources", label: "Resources", icon: Briefcase },
    { href: "/dashboard/officer/data-quality", label: "Data Quality", icon: ClipboardCheck },
    { href: "/dashboard/officer/deadlines", label: "Deadlines", icon: CalendarClock },
    { href: "/dashboard/officer/risks", label: "Risk Register", icon: ShieldAlert },
    { href: "/dashboard/officer/knowledge", label: "Knowledge", icon: BookOpen },
    { href: "/dashboard/officer/notifications", label: "Notifications", icon: Bell },
  ],
  management: [
    { href: "/dashboard/management", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/management/objectives", label: "Objectives", icon: Target },
    { href: "/dashboard/management/activities", label: "Activities", icon: ClipboardList },
    { href: "/dashboard/management/indicators", label: "Indicators", icon: BarChart2 },
    { href: "/dashboard/management/reports", label: "Report", icon: FileText },
    { href: "/dashboard/management/beneficiaries", label: "Beneficiaries", icon: Users },
    { href: "/dashboard/management/resources", label: "Resources", icon: Briefcase },
    { href: "/dashboard/management/data-quality", label: "Data Quality", icon: ClipboardCheck },
    { href: "/dashboard/management/risks", label: "Risk Register", icon: ShieldAlert },
    { href: "/dashboard/management/knowledge", label: "Knowledge", icon: BookOpen },
    { href: "/dashboard/management/notifications", label: "Notifications", icon: Bell },
  ],
  finance: [
    { href: "/dashboard/finance", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/finance/budget", label: "Budget Lines", icon: DollarSign },
    { href: "/dashboard/finance/requests", label: "Budget Requests", icon: FilePlus },
    { href: "/dashboard/finance/expenditures", label: "Expenditures", icon: Receipt },
    { href: "/dashboard/finance/travel", label: "Travel Requests", icon: Plane },
    { href: "/dashboard/finance/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/finance/notifications", label: "Notifications", icon: Bell },
  ],
};

const roleLabel: Record<UserRole, string> = {
  department_user: "Trainer",
  reporting_officer: "Reporting Officer",
  management: "Management",
  finance: "Finance Officer",
};

export function DashboardShell({ profile, notifications = [], children }: { profile: Profile; notifications?: Notification[]; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const role = profile?.role ?? "department_user";
  const nav = navByRole[role].map((item) => item);

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
          <form action={logout} className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              type="submit"
            >
              <LogOut className="h-4 w-4" /> Sign out
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
          <NotificationBell notifications={notifications} />
          <form action={logout}>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" type="submit">
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Sign out</span>
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
