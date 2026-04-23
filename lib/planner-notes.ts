type SupabaseLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export type SavePlannerNotesResult =
  | {
      ok: true;
      status: 200;
      notes: string;
    }
  | {
      ok: false;
      status: 409 | 500;
      error: string;
    };

export function normalizePlannerNotes(notes: string) {
  return notes.replace(/\r\n/g, "\n");
}

export async function savePlannerNotes(input: {
  supabase: SupabaseLike;
  userId: string;
  notes: string;
}): Promise<SavePlannerNotesResult> {
  const notes = normalizePlannerNotes(input.notes);

  const { error } = await input.supabase
    .from("profiles")
    .update({ planner_notes: notes })
    .eq("user_id", input.userId);

  if (error) {
    if (error.message.includes("planner_notes")) {
      return {
        ok: false,
        status: 409,
        error: "Planner notes need one SQL migration before they can save remotely."
      };
    }

    return {
      ok: false,
      status: 500,
      error: "Could not save planner notes."
    };
  }

  return {
    ok: true,
    status: 200,
    notes
  };
}
