import { createAdminClient } from "@/lib/supabase/admin";

type AuditInput = {
  userId?: string | null;
  eventType: "auth" | "import" | "security" | "ai" | "api";
  message: string;
  severity: "info" | "warn" | "critical";
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditInput) {
  const admin = createAdminClient();

  if (!admin) {
    return;
  }

  try {
    await admin.from("audit_events").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      message: input.message,
      severity: input.severity,
      metadata: input.metadata ?? {}
    });
  } catch {
    // Avoid breaking user flows if audit logging is unavailable.
  }
}
