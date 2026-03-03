import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStart, getWeekEnd, getWeekDays, formatDate, formatDateLong, getDayName, todayET } from "@/lib/date-utils";
import { calculateDailyReimbursement } from "@/lib/reimbursement";

export async function GET(request: NextRequest) {
  const session = await getEmployeeSession();
  const { searchParams } = new URL(request.url);

  let employeeId = searchParams.get("employee_id") || session?.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = searchParams.get("date") || todayET();
  const weekStart = getWeekStart(dateParam);
  const weekEnd = getWeekEnd(dateParam);
  const weekDays = getWeekDays(dateParam);

  const supabase = createAdminClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const { data: logs } = await supabase
    .from("mileage_logs")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("log_date", formatDate(weekStart))
    .lte("log_date", formatDate(weekEnd))
    .order("log_date");

  const month = weekStart.getMonth() + 1;
  const year = weekStart.getFullYear();
  const { data: gasPrice } = await supabase
    .from("gas_prices")
    .select("price_per_gallon")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  const { data: settingsData } = await supabase.from("app_settings").select("*");
  const settings: Record<string, string> = {};
  settingsData?.forEach((row) => (settings[row.key] = row.value));

  const gasPriceValue = gasPrice ? Number(gasPrice.price_per_gallon) : 0;
  const companyName = settings.company_name || "JJ Service Fixed Operations LLC";

  // Build PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(16);
  doc.text(companyName, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.text("Weekly Mileage Report", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Employee info
  doc.setFontSize(10);
  doc.text(`Employee: ${employee.name}`, 14, y);
  y += 6;
  doc.text(
    `Week: ${formatDateLong(weekStart)} - ${formatDateLong(weekEnd)}`,
    14,
    y
  );
  y += 6;
  doc.text(`Commute: ${employee.commute_miles} mi (round-trip)`, 14, y);
  y += 6;
  doc.text(`Vehicle MPG: ${employee.vehicle_mpg}`, 14, y);
  y += 6;
  doc.text(`Gas Price: $${gasPriceValue.toFixed(3)}/gal`, 14, y);
  y += 10;

  // Table headers
  const cols = [14, 40, 65, 90, 115, 140, 165];
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Day", cols[0], y);
  doc.text("Date", cols[1], y);
  doc.text("Start", cols[2], y);
  doc.text("End", cols[3], y);
  doc.text("Total Mi", cols[4], y);
  doc.text("Excess Mi", cols[5], y);
  doc.text("Reimb.", cols[6], y);
  y += 2;
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  const logsByDate = new Map(logs?.map((l) => [l.log_date, l]) || []);
  let totalMiles = 0;
  let totalExcess = 0;
  let totalReimb = 0;

  weekDays.forEach((day) => {
    const dateStr = formatDate(day);
    const log = logsByDate.get(dateStr);
    const hasComplete = log?.start_miles != null && log?.end_miles != null;

    doc.text(getDayName(day).slice(0, 3), cols[0], y);
    doc.text(dateStr.slice(5), cols[1], y);

    if (hasComplete) {
      const calc = calculateDailyReimbursement({
        startMiles: Number(log!.start_miles),
        endMiles: Number(log!.end_miles),
        commuteMiles: Number(employee.commute_miles),
        vehicleMpg: Number(employee.vehicle_mpg),
        gasPricePerGallon: gasPriceValue,
      });
      totalMiles += calc.totalMiles;
      totalExcess += calc.excessMiles;
      totalReimb += calc.reimbursement;

      doc.text(String(Number(log!.start_miles)), cols[2], y);
      doc.text(String(Number(log!.end_miles)), cols[3], y);
      doc.text(calc.totalMiles.toFixed(1), cols[4], y);
      doc.text(calc.excessMiles.toFixed(1), cols[5], y);
      doc.text(`$${calc.reimbursement.toFixed(2)}`, cols[6], y);
    } else if (log?.flagged) {
      doc.text("FLAGGED", cols[2], y);
    } else {
      doc.text("—", cols[2], y);
    }
    y += 6;
  });

  // Totals
  y += 2;
  doc.line(14, y, pageWidth - 14, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", cols[0], y);
  doc.text(totalMiles.toFixed(1), cols[4], y);
  doc.text(totalExcess.toFixed(1), cols[5], y);
  doc.text(`$${totalReimb.toFixed(2)}`, cols[6], y);
  y += 12;

  // Formula explanation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Formula: Reimbursement = (Excess Miles ÷ Vehicle MPG) × Gas Price/Gallon", 14, y);
  y += 4;
  doc.text("Excess Miles = max(0, Total Daily Miles - Round-Trip Commute Miles)", 14, y);
  y += 8;
  doc.text(`Generated: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET`, 14, y);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${employee.name.replace(/\s+/g, "-")}-${formatDate(weekStart)}.pdf"`,
    },
  });
}
