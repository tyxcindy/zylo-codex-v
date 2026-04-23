import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth";
import { savePlannerNotes } from "@/lib/planner-notes";

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
    return NextResponse.json(
      { error: "Planner notes must be 4,000 characters or fewer." },
      { status: 400 }
    );
  }

  const result = await savePlannerNotes({
    supabase,
    userId: user.id,
    notes: parsed.data.notes
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, notes: result.notes });
}
