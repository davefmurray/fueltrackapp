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

    // Get today's log — must have start already
    const { data: existing } = await supabase
      .from("mileage_logs")
      .select("*")
      .eq("employee_id", session.employeeId)
      .eq("log_date", today)
      .single();

    if (!existing || existing.start_miles == null) {
      return NextResponse.json(
        { error: "Please log your start-of-day reading first" },
        { status: 400 }
      );
    }

    if (miles < Number(existing.start_miles)) {
      return NextResponse.json(
        { error: "End mileage cannot be less than start mileage" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("mileage_logs")
      .update({
        end_miles: miles,
        end_photo_url: photoUrl,
        end_timestamp: new Date().toISOString(),
        end_lat: lat || null,
        end_lng: lng || null,
      })
      .eq("id", existing.id)
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
