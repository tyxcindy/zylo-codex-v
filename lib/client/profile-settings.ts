import { postJson } from "@/lib/client/api";

export type SaveProfileSettingsRequest = {
  displayName: string;
  homeCity: string;
};

export type SaveProfileSettingsResponse = {
  ok?: boolean;
  profile?: {
    displayName: string;
    homeCity: string;
  };
};

export function saveProfileSettingsRequest(payload: SaveProfileSettingsRequest) {
  return postJson<SaveProfileSettingsResponse>("/api/profile/settings", payload);
}
