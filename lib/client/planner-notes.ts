import { postJson } from "@/lib/client/api";

export type SavePlannerNotesRequest = {
  notes: string;
};

export type SavePlannerNotesResponse = {
  ok?: boolean;
};

export function savePlannerNotesRequest(payload: SavePlannerNotesRequest) {
  return postJson<SavePlannerNotesResponse>("/api/profile/planner-notes", payload);
}
