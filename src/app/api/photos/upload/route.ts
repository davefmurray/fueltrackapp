import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayET } from "@/lib/date-utils";

export async function POST(request: NextRequest) {
  const session = await getEmployeeSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const step = formData.get("step") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const today = todayET();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${session.employeeId}/${today}/${step}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("odometer-photos")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the storage path (will be used to generate signed URLs later)
    return NextResponse.json({ url: path });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
