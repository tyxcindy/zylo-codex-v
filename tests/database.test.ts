import {
  buildDestinationInsert,
  buildPlaceInsert,
  buildPlaceUpdate,
  ensureProfileForUser,
  resolveProfileSeed,
  upsertDestination,
  upsertPlace
} from "@/lib/database";

describe("database helpers", () => {
  it("resolves fallback profile seed values", () => {
    expect(
      resolveProfileSeed({
        id: "user-1",
        user_metadata: {}
      })
    ).toEqual({
      displayName: "Alex Explorer",
      homeCity: "New York"
    });
  });

  it("prefers user metadata when building the profile seed", () => {
    expect(
      resolveProfileSeed({
        id: "user-1",
        user_metadata: {
          display_name: "Maya",
          home_city: "Tokyo"
        }
      })
    ).toEqual({
      displayName: "Maya",
      homeCity: "Tokyo"
    });
  });

  it("builds destination and place payloads deterministically", () => {
    expect(
      buildDestinationInsert({
        userId: "user-1",
        name: "Kyoto",
        country: "Japan"
      })
    ).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        name: "Kyoto",
        country: "Japan"
      })
    );

    expect(
      buildPlaceInsert({
        userId: "user-1",
        destinationId: "dest-1",
        sourceArtifactId: "artifact-1",
        name: "Men-ya Inoichi",
        city: "Kyoto",
        country: "Japan",
        category: "restaurants",
        address: "Kyoto, Japan",
        description: "Ramen",
        latitude: 35,
        longitude: 135,
        tags: ["ramen"]
      })
    ).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        destination_id: "dest-1",
        source_artifact_id: "artifact-1",
        google_place_id: null
      })
    );

    expect(
      buildPlaceUpdate(
        {
          userId: "user-1",
          destinationId: "dest-1",
          sourceArtifactId: "artifact-1",
          name: "Men-ya Inoichi",
          city: "Kyoto",
          country: "Japan",
          category: "restaurants",
          address: "Kyoto, Japan",
          description: "Ramen",
          latitude: 35,
          longitude: 135,
          tags: ["ramen"]
        },
        {
          times_seen: 3,
          source_count: 4
        }
      )
    ).toEqual(
      expect.objectContaining({
        times_seen: 4,
        source_count: 5
      })
    );
  });

  it("upserts profile and taste rows", async () => {
    const profilesUpsert = vi.fn().mockResolvedValue(undefined);
    const tasteProfilesUpsert = vi.fn().mockResolvedValue(undefined);

    await ensureProfileForUser(
      {
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return { upsert: profilesUpsert };
          }

          if (table === "taste_profiles") {
            return { upsert: tasteProfilesUpsert };
          }

          throw new Error(`Unhandled table ${table}`);
        })
      } as never,
      {
        id: "user-1",
        email: "maya@example.com",
        user_metadata: {
          display_name: "Maya",
          home_city: "Tokyo"
        }
      }
    );

    expect(profilesUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        email: "maya@example.com",
        display_name: "Maya",
        home_city: "Tokyo"
      }),
      { onConflict: "user_id" }
    );
    expect(tasteProfilesUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1"
      }),
      { onConflict: "user_id" }
    );
  });

  it("returns an existing destination id without inserting", async () => {
    const insert = vi.fn();
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "dest-1" }
    });
    const countryEq = vi.fn(() => ({ maybeSingle }));
    const nameEq = vi.fn(() => ({ eq: countryEq }));
    const userEq = vi.fn(() => ({ eq: nameEq }));
    const select = vi.fn(() => ({ eq: userEq }));

    const id = await upsertDestination(
      {
        from: vi.fn(() => ({
          select,
          insert
        }))
      } as never,
      {
        userId: "user-1",
        name: "Kyoto",
        country: "Japan"
      }
    );

    expect(id).toBe("dest-1");
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts a destination when one does not exist", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null
    });
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: "dest-2" },
      error: null
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: insertSingle
      }))
    }));

    const id = await upsertDestination(
      {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle
                }))
              }))
            }))
          })),
          insert
        }))
      } as never,
      {
        userId: "user-1",
        name: "Osaka",
        country: "Japan"
      }
    );

    expect(id).toBe("dest-2");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Osaka",
        country: "Japan"
      })
    );
  });

  it("updates an existing place and increments counters", async () => {
    const updateSingle = vi.fn().mockResolvedValue({
      data: { id: "place-1" },
      error: null
    });
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: updateSingle
          }))
        }))
      }))
    }));

    const result = await upsertPlace(
      {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "place-1",
                        times_seen: 2,
                        source_count: 3
                      }
                    })
                  }))
                }))
              }))
            }))
          })),
          update,
          insert: vi.fn()
        }))
      } as never,
      {
        userId: "user-1",
        destinationId: "dest-1",
        sourceArtifactId: "artifact-1",
        name: "Men-ya Inoichi",
        city: "Kyoto",
        country: "Japan",
        category: "restaurants",
        address: "Kyoto, Japan",
        description: "Ramen",
        tags: ["ramen"]
      }
    );

    expect(result).toEqual({ id: "place-1" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        times_seen: 3,
        source_count: 4
      })
    );
  });

  it("inserts a new place when no duplicate exists", async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: "place-2" },
      error: null
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: insertSingle
      }))
    }));

    const result = await upsertPlace(
      {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null
                    })
                  }))
                }))
              }))
            }))
          })),
          update: vi.fn(),
          insert
        }))
      } as never,
      {
        userId: "user-1",
        destinationId: "dest-1",
        sourceArtifactId: "artifact-1",
        name: "Fuglen Tokyo",
        city: "Tokyo",
        country: "Japan",
        category: "cafes",
        address: "Tokyo, Japan",
        description: "Coffee",
        tags: ["coffee"]
      }
    );

    expect(result).toEqual({ id: "place-2" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Fuglen Tokyo",
        city: "Tokyo"
      })
    );
  });
});
