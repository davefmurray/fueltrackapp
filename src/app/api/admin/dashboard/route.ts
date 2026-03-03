import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayET } from "@/lib/date-utils";
import { format } from "date-fns";

export async function GET() {
  const supabase = createAdminClient();
  const today = todayET();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Active employees count
  const { count: activeEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Employees who logged today (have start_miles)
  const { count: loggedToday } = await supabase
    .from("mileage_logs")
    .select("*", { count: "exact", head: true })
    .eq("log_date", today)
    .not("start_miles", "is", null);

  // Total flagged days across all employees
  const { count: flaggedDays } = await supabase
    .from("mileage_logs")
    .select("*", { count: "exact", head: true })
    .eq("flagged", true);

  // Current month gas price
  const { data: gasPrice } = await supabase
    .from("gas_prices")
    .select("price_per_gallon")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  return NextResponse.json({
    activeEmployees: activeEmployees || 0,
    loggedToday: loggedToday || 0,
    notLoggedToday: (activeEmployees || 0) - (loggedToday || 0),
    flaggedDays: flaggedDays || 0,
    currentGasPrice: gasPrice ? Number(gasPrice.price_per_gallon) : null,
    currentMonth: format(now, "MMMM yyyy"),
  });
}
