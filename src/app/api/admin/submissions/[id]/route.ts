import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().optional().default(""),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const { data, error } = await supabase
      .from("mileage_logs")
      .update({
        status: validated.status,
        reviewed_at: new Date().toISOString(),
        review_note: validated.review_note || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission: data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
