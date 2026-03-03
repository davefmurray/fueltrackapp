import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayET, isWorkDay, DEFAULT_WORK_DAYS } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayET();

  // Get work days setting
  const { data: settingRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "work_days")
    .maybeSingle();

  const workDays: number[] = settingRow
    ? JSON.parse(settingRow.value)
    : DEFAULT_WORK_DAYS;

  // Only flag if today is a work day
  if (!isWorkDay(today, workDays)) {
    return NextResponse.json({ message: "Not a work day", flagged: 0 });
  }

  // Get all active employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name")
    .eq("active", true);

  if (!employees || employees.length === 0) {
    return NextResponse.json({ message: "No active employees", flagged: 0 });
  }

  // Get today's logs
  const { data: existingLogs } = await supabase
    .from("mileage_logs")
    .select("employee_id, start_miles, end_miles")
    .eq("log_date", today);

  const loggedEmployees = new Set(
    existingLogs
      ?.filter((l) => l.start_miles != null && l.end_miles != null)
      .map((l) => l.employee_id) || []
  );

  let flaggedCount = 0;

  for (const emp of employees) {
    if (!loggedEmployees.has(emp.id)) {
      // Check if there's already a flagged entry for today
      const { data: existing } = await supabase
        .from("mileage_logs")
        .select("id, flagged")
        .eq("employee_id", emp.id)
        .eq("log_date", today)
        .maybeSingle();

      if (existing && existing.flagged) continue; // Already flagged

      if (existing) {
        // Partial log exists — flag it
        await supabase
          .from("mileage_logs")
          .update({ flagged: true, flag_reason: "Incomplete log for work day" })
          .eq("id", existing.id);
      } else {
        // No log at all — insert flagged entry
        await supabase.from("mileage_logs").insert({
          employee_id: emp.id,
          log_date: today,
          flagged: true,
          flag_reason: "No log submitted for work day",
        });
      }
      flaggedCount++;
    }
  }

  return NextResponse.json({
    message: `Flagged ${flaggedCount} employee(s)`,
    flagged: flaggedCount,
    date: today,
  });
}
