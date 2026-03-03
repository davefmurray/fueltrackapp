import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayET } from "@/lib/date-utils";

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayET();

  // Get today's log
  const { data: todayLog } = await supabase
    .from("mileage_logs")
    .select("*")
    .eq("employee_id", session.employeeId)
    .eq("log_date", today)
    .maybeSingle();

  // Count flagged days
  const { count: flaggedCount } = await supabase
    .from("mileage_logs")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", session.employeeId)
    .eq("flagged", true);

  return NextResponse.json({
    employee: { id: session.employeeId, name: session.employeeName },
    todayLog,
    todayDate: today,
    flaggedCount: flaggedCount || 0,
  });
}
