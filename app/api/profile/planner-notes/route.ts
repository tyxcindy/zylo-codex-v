import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth";

const plannerNotesSchema = z.object({
  notes: z.string().max(4000)
});

export async function POST(request: Request) {
  const { supabase, user } = await requireApiUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = plannerNotesSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Planner notes must be 4,000 characters or fewer." }, { status: 400 });
  }

  const notes = parsed.data.notes.replace(/\r\n/g, "\n");

  const { error } = await supabase
    .from("profiles")
    .update({ planner_notes: notes })
    .eq("user_id", user.id);

  if (error) {
    if (error.message.includes("planner_notes")) {
      return NextResponse.json(
        { error: "Planner notes need one SQL migration before they can save remotely." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Could not save planner notes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notes });
}
