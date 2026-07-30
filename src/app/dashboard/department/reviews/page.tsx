import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReviewMeetingForm } from "./review-meeting-form";
import { ReflectionForm } from "./reflection-form";

type ReviewActionItem = {
  id: string;
  meeting_id: string;
  description: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  users?: { full_name: string | null } | { full_name: string | null }[] | null;
};

function getReminderMeta(item: ReviewActionItem) {
  if (item.status === "completed") {
    return { label: "Completed", variant: "success" as const };
  }

  if (!item.due_date) {
    return { label: "No due date", variant: "secondary" as const };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(item.due_date);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { label: "Overdue", variant: "destructive" as const };
  }
  if (diffDays <= 3) {
    return { label: "Due soon", variant: "warning" as const };
  }
  return { label: "On track", variant: "secondary" as const };
}

function getReflectionReminder(status: string) {
  switch (status) {
    case "submitted":
      return { label: "Shared", variant: "success" as const };
    case "reviewed":
      return { label: "Reviewed", variant: "secondary" as const };
    case "archived":
      return { label: "Archived", variant: "outline" as const };
    default:
      return { label: "Draft", variant: "warning" as const };
  }
}

export default async function DepartmentReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("department_id").eq("id", user!.id).single();
  const deptId = profile?.department_id;

  const { data: meetings } = await supabase
    .from("weekly_meetings")
    .select("*")
    .eq("department_id", deptId)
    .order("meeting_date", { ascending: false });

  const { data: reflections } = await supabase
    .from("monthly_reflections")
    .select("*")
    .eq("department_id", deptId)
    .order("reflection_date", { ascending: false });

  const meetingIds = (meetings ?? []).map((meeting) => meeting.id);
  const { data: actionItems } = meetingIds.length > 0
    ? await supabase
        .from("meeting_action_items")
        .select("id, description, status, due_date, assigned_to, meeting_id, users!meeting_action_items_assigned_to_fkey(full_name)")
        .in("meeting_id", meetingIds)
    : { data: [] as ReviewActionItem[] };

  const actionItemsByMeeting = (actionItems ?? []).reduce<Record<string, ReviewActionItem[]>>((acc, item) => {
    acc[item.meeting_id] = [...(acc[item.meeting_id] ?? []), item];
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Review Cycle</h1>
        <p className="text-sm text-muted-foreground">Track weekly review meetings and monthly reflections in one place.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly Review Meetings</h2>
            <p className="text-sm text-muted-foreground">Summaries, decisions, attendees, and actions.</p>
          </div>
          <ReviewMeetingForm />
        </div>
        {(!meetings || meetings.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">No weekly review meetings recorded yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{meeting.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{meeting.meeting_date} · {meeting.location ?? "Location pending"}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{meeting.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{meeting.agenda}</p>
                  {meeting.decisions && <p><span className="font-medium">Decisions:</span> {meeting.decisions}</p>}
                  {meeting.discussion_notes && <p><span className="font-medium">Notes:</span> {meeting.discussion_notes}</p>}

                  <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review action items</p>
                      <Badge variant="outline" className="text-[11px]">
                        {(actionItemsByMeeting[meeting.id] ?? []).length} item{(actionItemsByMeeting[meeting.id] ?? []).length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {(actionItemsByMeeting[meeting.id] ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No follow-up actions logged yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border/60 text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">Action</th>
                              <th className="py-2 pr-3 font-medium">Owner</th>
                              <th className="py-2 pr-3 font-medium">Due</th>
                              <th className="py-2 pr-3 font-medium">Status</th>
                              <th className="py-2 font-medium">Reminder</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(actionItemsByMeeting[meeting.id] ?? []).map((item) => {
                              const reminder = getReminderMeta(item);
                              const assignee = Array.isArray(item.users)
                                ? item.users[0]?.full_name ?? "Unassigned"
                                : item.users?.full_name ?? "Unassigned";
                              return (
                                <tr key={item.id} className="border-b border-border/40 last:border-0">
                                  <td className="py-2 pr-3">{item.description}</td>
                                  <td className="py-2 pr-3">{assignee}</td>
                                  <td className="py-2 pr-3">{item.due_date ?? "—"}</td>
                                  <td className="py-2 pr-3">
                                    <Badge variant={item.status === "completed" ? "success" : item.status === "overdue" ? "destructive" : "outline"} className="capitalize">
                                      {item.status.replace(/_/g, " ")}
                                    </Badge>
                                  </td>
                                  <td className="py-2">
                                    <Badge variant={reminder.variant} className="capitalize">{reminder.label}</Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Monthly Reflections</h2>
            <p className="text-sm text-muted-foreground">Capture lessons learned and adaptive actions for the month.</p>
          </div>
          <ReflectionForm />
        </div>
        {(!reflections || reflections.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">No monthly reflections captured yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reflections.map((reflection) => (
              <Card key={reflection.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{reflection.period_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{reflection.reflection_date}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{reflection.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getReflectionReminder(reflection.status).variant} className="capitalize">
                      {getReflectionReminder(reflection.status).label}
                    </Badge>
                    <Badge variant="outline">Next review: {reflection.period_name}</Badge>
                  </div>
                  {reflection.what_worked_well && <p><span className="font-medium">What worked well:</span> {reflection.what_worked_well}</p>}
                  {reflection.key_challenges && <p><span className="font-medium">Challenges:</span> {reflection.key_challenges}</p>}
                  {reflection.adaptive_actions_taken && <p><span className="font-medium">Adaptive actions:</span> {reflection.adaptive_actions_taken}</p>}
                  {reflection.lessons_learned && <p><span className="font-medium">Lessons learned:</span> {reflection.lessons_learned}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
