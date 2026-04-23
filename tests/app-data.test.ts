import { getUserLibrarySnapshot } from "@/lib/app-data";
import { destinations as demoDestinations, places as demoPlaces } from "@/lib/data";

function createSupabaseMock(options?: {
  destinationsData?: any[];
  placesData?: any[];
  artifactsData?: any[];
  importJobsData?: any[];
  profileData?: any;
}) {
  const destinationsData = options?.destinationsData ?? [];
  const placesData = options?.placesData ?? [];
  const artifactsData = options?.artifactsData ?? [];
  const importJobsData = options?.importJobsData ?? [];
  const profileData = options?.profileData ?? null;

  return {
    from: vi.fn((table: string) => {
      if (table === "destinations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: destinationsData
                })
              }))
            }))
          }))
        };
      }

      if (table === "places") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: placesData
              })
            }))
          }))
        };
      }

      if (table === "source_artifacts") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: artifactsData
                })
              }))
            }))
          }))
        };
      }

      if (table === "import_jobs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: importJobsData
            })
          }))
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: profileData
              })
            }))
          }))
        };
      }

      throw new Error(`Unhandled table ${table}`);
    })
  };
}

describe("getUserLibrarySnapshot", () => {
  it("falls back to the demo library when a new account has no places yet", async () => {
    const snapshot = await getUserLibrarySnapshot(
      createSupabaseMock() as never,
      "user-1"
    );

    expect(snapshot.destinations).toEqual(demoDestinations);
    expect(snapshot.places).toEqual(demoPlaces);
    expect(snapshot.destinations).toHaveLength(8);
    expect(snapshot.places.length).toBeGreaterThan(20);
  });

  it("uses the real library when user destinations and places exist", async () => {
    const snapshot = await getUserLibrarySnapshot(
      createSupabaseMock({
        destinationsData: [
          {
            id: "dest-live-1",
            name: "Kyoto",
            country: "Japan",
            vibe: "",
            cover_tone: null
          }
        ],
        placesData: [
          {
            id: "place-live-1",
            destination_id: "dest-live-1",
            name: "Men-ya Inoichi",
            city: "Kyoto",
            country: "Japan",
            category: "restaurants",
            address: "Kyoto, Japan",
            description: "Ramen stop",
            latitude: 35.0044,
            longitude: 135.7641,
            times_seen: 4,
            source_count: 2,
            is_visited: false,
            is_in_trip: true,
            tags: ["#ramen", "#kyoto"],
            image_url: "https://images.example.com/inoichi.jpg",
            created_at: "2026-04-20T10:00:00Z"
          },
          {
            id: "place-live-2",
            destination_id: "dest-live-1",
            name: "Instagram Kyoto",
            city: "Kyoto",
            country: "Japan",
            category: "activities",
            address: "",
            description: "Noisy placeholder.",
            latitude: null,
            longitude: null,
            times_seen: 1,
            source_count: 1,
            is_visited: false,
            is_in_trip: false,
            tags: ["instagram"],
            image_url: null,
            created_at: "2026-04-20T10:05:00Z"
          }
        ],
        profileData: {
          display_name: "Maya",
          email: "maya@example.com",
          home_city: "Kyoto",
          planner_notes: "Prioritize lunch spots."
        }
      }) as never,
      "user-1"
    );

    expect(snapshot.destinations).toEqual([
      expect.objectContaining({
        id: "dest-live-1",
        name: "Kyoto",
        placeCount: 1,
        vibe: "Imported from saved travel content.",
        coverTone: "from-emerald-400/24 via-cyan-300/14 to-sky-400/20",
        imageUrl: "https://images.example.com/inoichi.jpg",
        spotlightTags: ["#ramen", "#kyoto"]
      })
    ]);
    expect(snapshot.places).toEqual([
      expect.objectContaining({
        id: "place-live-1",
        name: "Men-ya Inoichi",
        destinationId: "dest-live-1",
        imageUrl: "https://images.example.com/inoichi.jpg",
        coordinates: {
          lat: 35.0044,
          lng: 135.7641
        }
      })
    ]);
    expect(snapshot.places).toHaveLength(1);
    expect(snapshot.destinations).toHaveLength(1);
    expect(snapshot.profile).toEqual({
      displayName: "Maya",
      email: "maya@example.com",
      homeCity: "Kyoto",
      plannerNotes: "Prioritize lunch spots."
    });
  });

  it("hides imported destinations that only contain invalid leftover places", async () => {
    const snapshot = await getUserLibrarySnapshot(
      createSupabaseMock({
        destinationsData: [
          {
            id: "dest-bad-1",
            name: "Bordeaux",
            country: "France",
            vibe: "",
            cover_tone: null,
            is_local: false
          },
          {
            id: "dest-good-1",
            name: "Hong Kong",
            country: "China",
            vibe: "",
            cover_tone: null,
            is_local: false
          }
        ],
        placesData: [
          {
            id: "place-bad-1",
            destination_id: "dest-bad-1",
            name: "Explore 24",
            city: "Bordeaux",
            country: "France",
            category: "activities",
            address: "",
            description: "Recovered from a bad parser fragment.",
            latitude: 0,
            longitude: 0,
            times_seen: 1,
            source_count: 1,
            is_visited: false,
            is_in_trip: false,
            tags: ["explore"],
            image_url: null,
            created_at: "2026-04-22T00:00:00Z"
          },
          {
            id: "place-good-1",
            destination_id: "dest-good-1",
            name: "Victoria Peak",
            city: "Hong Kong",
            country: "China",
            category: "scenic spots",
            address: "Hong Kong",
            description: "A real place.",
            latitude: 22.2759,
            longitude: 114.1455,
            times_seen: 1,
            source_count: 1,
            is_visited: false,
            is_in_trip: false,
            tags: ["peak"],
            image_url: null,
            created_at: "2026-04-22T00:00:00Z"
          }
        ]
      }) as never,
      "user-1"
    );

    expect(snapshot.places).toEqual([
      expect.objectContaining({
        id: "place-good-1",
        name: "Victoria Peak"
      })
    ]);
    expect(snapshot.destinations).toEqual([
      expect.objectContaining({
        id: "dest-good-1",
        name: "Hong Kong"
      })
    ]);
  });
});
