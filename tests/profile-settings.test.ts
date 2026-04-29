export {};

const mockCreateAdminClient = vi.hoisted(() => vi.fn());
const mockRecordAuditEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

import { saveProfileSettings } from "@/lib/profile-settings";

describe("profile settings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdminClient.mockReturnValue(null);
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("updates an existing profile row", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({
      eq: updateEq
    }));
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        display_name: "Alex Explorer",
        home_city: "New York"
      },
      error: null
    });

    const result = await saveProfileSettings({
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "profiles") {
            throw new Error(`Unhandled table ${table}`);
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle
              }))
            })),
            update
          };
        })
      } as never,
      userId: "user-1",
      email: "alex@example.com",
      displayName: "Alex Horizon",
      homeCity: "Tokyo"
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      profile: {
        displayName: "Alex Horizon",
        homeCity: "Tokyo"
      }
    });
    expect(update).toHaveBeenCalledWith({
      display_name: "Alex Horizon",
      home_city: "Tokyo"
    });
    expect(updateEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("creates a profile row when the user is missing one", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });

    const result = await saveProfileSettings({
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "profiles") {
            throw new Error(`Unhandled table ${table}`);
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle
              }))
            })),
            update: vi.fn(),
            upsert
          };
        })
      } as never,
      userId: "user-1",
      email: "traveler@example.com",
      displayName: "Traveler",
      homeCity: "Tokyo"
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      profile: {
        displayName: "Traveler",
        homeCity: "Tokyo"
      }
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        email: "traveler@example.com",
        display_name: "Traveler",
        home_city: "Tokyo"
      },
      { onConflict: "user_id" }
    );
  });

  it("fails safely when a missing profile cannot be created because auth email is unavailable", async () => {
    const upsert = vi.fn();
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });

    const result = await saveProfileSettings({
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "profiles") {
            throw new Error(`Unhandled table ${table}`);
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle
              }))
            })),
            update: vi.fn(),
            upsert
          };
        })
      } as never,
      userId: "user-1",
      displayName: "Traveler",
      homeCity: "Tokyo"
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "Could not save profile settings."
    });
    expect(upsert).not.toHaveBeenCalled();
  });
});
