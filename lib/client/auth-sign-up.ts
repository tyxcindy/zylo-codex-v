import { postJson } from "@/lib/client/api";

export type AuthSignUpRequest = {
  displayName: string;
  email: string;
  password: string;
};

export type AuthSignUpResponse = {
  message?: string;
};

export function signUpWithApi(payload: AuthSignUpRequest) {
  return postJson<AuthSignUpResponse>("/api/auth/sign-up", payload);
}
