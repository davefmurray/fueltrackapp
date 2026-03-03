import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEmployeeSession } from "@/lib/session";
import { z } from "zod";

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = pinSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("employee_pin_login", {
      input_pin: pin,
    });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const employee = data[0];
    await createEmployeeSession(employee.employee_id, employee.employee_name);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.employee_id,
        name: employee.employee_name,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
