import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  pin: z.string().regex(/^\d{4}$/).optional(),
  commute_miles: z.number().min(0).optional(),
  vehicle_mpg: z.number().min(0.1).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = updateSchema.parse(body);
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.commute_miles !== undefined) updateData.commute_miles = updates.commute_miles;
    if (updates.vehicle_mpg !== undefined) updateData.vehicle_mpg = updates.vehicle_mpg;
    if (updates.active !== undefined) updateData.active = updates.active;

    if (updates.pin) {
      const { data: hashResult } = await supabase.rpc("hash_pin", {
        pin: updates.pin,
      });
      if (!hashResult) {
        return NextResponse.json({ error: "Failed to hash PIN" }, { status: 500 });
      }
      updateData.pin_hash = hashResult;
    }

    const { data, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
      .select("id, name, commute_miles, vehicle_mpg, active, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employee: data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Soft delete — just deactivate
  const { error } = await supabase
    .from("employees")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
