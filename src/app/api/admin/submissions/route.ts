import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") || "pending";
  const employeeId = searchParams.get("employee_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  // Build query — join employee name
  let query = supabase
    .from("mileage_logs")
    .select("*, employees!inner(name)")
    .not("start_miles", "is", null)
    .not("end_miles", "is", null)
    .order("log_date", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }
  if (dateFrom) {
    query = query.gte("log_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("log_date", dateTo);
  }

  const { data: logs, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for photos
  const submissions = await Promise.all(
    (logs || []).map(async (log) => {
      let startPhotoSignedUrl: string | null = null;
      let endPhotoSignedUrl: string | null = null;

      if (log.start_photo_url) {
        const { data } = await supabase.storage
          .from("odometer-photos")
          .createSignedUrl(log.start_photo_url, 3600);
        startPhotoSignedUrl = data?.signedUrl || null;
      }
      if (log.end_photo_url) {
        const { data } = await supabase.storage
          .from("odometer-photos")
          .createSignedUrl(log.end_photo_url, 3600);
        endPhotoSignedUrl = data?.signedUrl || null;
      }

      const employeeName =
        (log.employees as unknown as { name: string })?.name || "Unknown";

      return {
        ...log,
        employees: undefined,
        employee_name: employeeName,
        start_photo_signed_url: startPhotoSignedUrl,
        end_photo_signed_url: endPhotoSignedUrl,
      };
    })
  );

  return NextResponse.json({ submissions });
}
