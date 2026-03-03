import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, commute_miles, vehicle_mpg, active, created_at, updated_at")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employees: data });
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  commute_miles: z.number().min(0).default(40.2),
  vehicle_mpg: z.number().min(0.1).default(15),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pin, commute_miles, vehicle_mpg } = createSchema.parse(body);
    const supabase = createAdminClient();

    // Hash the PIN using the database function
    const { data: hashResult } = await supabase.rpc("hash_pin", { pin });

    if (!hashResult) {
      return NextResponse.json({ error: "Failed to hash PIN" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({
        name,
        pin_hash: hashResult,
        commute_miles,
        vehicle_mpg,
      })
      .select("id, name, commute_miles, vehicle_mpg, active, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employee: data }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
