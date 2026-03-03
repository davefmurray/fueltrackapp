import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  const { data, error, count } = await supabase
    .from("mileage_logs")
    .select("*", { count: "exact" })
    .eq("employee_id", session.employeeId)
    .order("log_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: data,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
