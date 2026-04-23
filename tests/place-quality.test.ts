import { normalizeSavedPlace } from "@/lib/place-quality";

describe("normalizeSavedPlace", () => {
  it("rejects parser fragments that look like travel headlines", () => {
    expect(
      normalizeSavedPlace({
        name: "Explore 24",
        city: "Bordeaux",
        country: "France"
      })
    ).toBeNull();

    expect(
      normalizeSavedPlace({
        name: "24 hours in Hong Kong",
        city: "Hong Kong",
        country: "China"
      })
    ).toBeNull();
  });

  it("keeps concrete venue names", () => {
    expect(
      normalizeSavedPlace({
        name: "Hong Kong Disneyland",
        city: "Hong Kong",
        country: "China"
      })
    ).toEqual(
      expect.objectContaining({
        name: "Hong Kong Disneyland",
        city: "Hong Kong",
        country: "China"
      })
    );
  });
});
