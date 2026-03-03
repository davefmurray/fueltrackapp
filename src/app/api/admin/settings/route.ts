import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("app_settings").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
}

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = updateSchema.parse(body);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
