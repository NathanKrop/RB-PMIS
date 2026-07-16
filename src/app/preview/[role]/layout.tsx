import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";

const mockProfiles: Record<string, any> = {
  department: {
    id: "preview-dept",
    email: "dept@preview.local",
    full_name: "Department User (Preview)",
    role: "department_user",
    department_id: "preview-dept-id",
    departments: { name: "ICT Department" },
  },
  officer: {
    id: "preview-officer",
    email: "officer@preview.local",
    full_name: "Reporting Officer (Preview)",
    role: "reporting_officer",
    department_id: null,
    departments: null,
  },
  management: {
    id: "preview-mgmt",
    email: "mgmt@preview.local",
    full_name: "Management User (Preview)",
    role: "management",
    department_id: null,
    departments: null,
  },
};

export default async function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const profile = mockProfiles[role];
  if (!profile) redirect("/auth/login");
  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
