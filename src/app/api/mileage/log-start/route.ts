import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayET } from "@/lib/date-utils";
import { z } from "zod";

const schema = z.object({
  miles: z.number().min(0),
  photoUrl: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { miles, photoUrl, lat, lng } = schema.parse(body);
    const supabase = createAdminClient();
    const today = todayET();

    // Upsert: create log for today or update if exists (e.g., from a flagged entry)
    const { data, error } = await supabase
      .from("mileage_logs")
      .upsert(
        {
          employee_id: session.employeeId,
          log_date: today,
          start_miles: miles,
          start_photo_url: photoUrl,
          start_timestamp: new Date().toISOString(),
          start_lat: lat || null,
          start_lng: lng || null,
          flagged: false,
          flag_reason: null,
        },
        { onConflict: "employee_id,log_date" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
