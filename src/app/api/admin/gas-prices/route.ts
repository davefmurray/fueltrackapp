import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gas_prices")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prices: data });
}

const createSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  price_per_gallon: z.number().min(0.001),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, price_per_gallon } = createSchema.parse(body);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("gas_prices")
      .upsert(
        { month, year, price_per_gallon },
        { onConflict: "month,year" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ price: data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
