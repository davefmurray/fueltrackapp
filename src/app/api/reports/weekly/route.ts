import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStart, getWeekEnd, getWeekDays, formatDate, getDayName, todayET } from "@/lib/date-utils";
import { calculateDailyReimbursement } from "@/lib/reimbursement";
import type { WeeklyReport, DailyReportEntry } from "@/types";

export async function GET(request: NextRequest) {
  const session = await getEmployeeSession();
  const { searchParams } = new URL(request.url);

  // Admin can specify an employee_id; employees can only see their own
  let employeeId = searchParams.get("employee_id") || session?.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = searchParams.get("date") || todayET();
  const weekStart = getWeekStart(dateParam);
  const weekEnd = getWeekEnd(dateParam);
  const weekDays = getWeekDays(dateParam);

  const supabase = createAdminClient();

  // Get employee details
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();

  if (empError || !employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Get logs for the week
  const { data: logs } = await supabase
    .from("mileage_logs")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("log_date", formatDate(weekStart))
    .lte("log_date", formatDate(weekEnd))
    .order("log_date");

  // Get gas price for this period
  const month = weekStart.getMonth() + 1;
  const year = weekStart.getFullYear();
  const { data: gasPrice } = await supabase
    .from("gas_prices")
    .select("price_per_gallon")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  const gasPriceValue = gasPrice ? Number(gasPrice.price_per_gallon) : 0;

  // Build daily entries
  const logsByDate = new Map(logs?.map((l) => [l.log_date, l]) || []);
  let totalMiles = 0;
  let totalExcessMiles = 0;
  let totalReimbursement = 0;

  const days: DailyReportEntry[] = weekDays.map((day) => {
    const dateStr = formatDate(day);
    const log = logsByDate.get(dateStr);
    const hasComplete = log?.start_miles != null && log?.end_miles != null;
    const logStatus = log?.status || "pending";
    const isApproved = logStatus === "approved";

    if (hasComplete) {
      // Only calculate reimbursement for approved logs
      const calc = isApproved
        ? calculateDailyReimbursement({
            startMiles: Number(log!.start_miles),
            endMiles: Number(log!.end_miles),
            commuteMiles: Number(employee.commute_miles),
            vehicleMpg: Number(employee.vehicle_mpg),
            gasPricePerGallon: gasPriceValue,
          })
        : {
            totalMiles: Math.max(0, Number(log!.end_miles) - Number(log!.start_miles)),
            excessMiles: 0,
            reimbursement: 0,
          };

      if (isApproved) {
        totalMiles += calc.totalMiles;
        totalExcessMiles += calc.excessMiles;
        totalReimbursement += calc.reimbursement;
      }

      return {
        date: dateStr,
        dayOfWeek: getDayName(day),
        startMiles: Number(log!.start_miles),
        endMiles: Number(log!.end_miles),
        totalMiles: calc.totalMiles,
        excessMiles: calc.excessMiles,
        reimbursement: calc.reimbursement,
        flagged: log!.flagged,
        flagReason: log!.flag_reason,
        status: logStatus,
      };
    }

    return {
      date: dateStr,
      dayOfWeek: getDayName(day),
      startMiles: log?.start_miles != null ? Number(log.start_miles) : null,
      endMiles: log?.end_miles != null ? Number(log.end_miles) : null,
      totalMiles: 0,
      excessMiles: 0,
      reimbursement: 0,
      flagged: log?.flagged || false,
      flagReason: log?.flag_reason || null,
      status: logStatus,
    };
  });

  const report: WeeklyReport = {
    employee: {
      id: employee.id,
      name: employee.name,
      commute_miles: Number(employee.commute_miles),
      vehicle_mpg: Number(employee.vehicle_mpg),
      active: employee.active,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    },
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    days,
    totalMiles: Math.round(totalMiles * 100) / 100,
    totalExcessMiles: Math.round(totalExcessMiles * 100) / 100,
    totalReimbursement: Math.round(totalReimbursement * 100) / 100,
    gasPriceUsed: gasPriceValue,
  };

  return NextResponse.json(report);
}
