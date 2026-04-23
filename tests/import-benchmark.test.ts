import {
  evaluateImportBenchmark,
  importBenchmarkFixtures,
  summarizeImportBenchmarkFixtures
} from "@/lib/import-benchmark";

describe("import benchmark fixtures", () => {
  it("loads the 30-link gold set from the PDF-derived fixture file", () => {
    expect(importBenchmarkFixtures).toHaveLength(30);
    expect(summarizeImportBenchmarkFixtures()).toEqual({
      fixtureCount: 30,
      expectedPlaceCount: 97
    });
  });

  it("matches aliases and acceptable categories when scoring candidates", () => {
    const fixture = importBenchmarkFixtures.find((item) => item.id === "san-francisco-roundup");

    expect(fixture).toBeDefined();

    const evaluation = evaluateImportBenchmark(fixture!, [
      {
        name: "Golden Gate Bridge",
        category: "photo spots"
      },
      {
        name: "Marshalls Beach",
        category: "activities"
      },
      {
        name: "Pier 39",
        category: "activities"
      },
      {
        name: "Random Spot",
        category: "activities"
      }
    ]);

    expect(evaluation.matchedExpectedNames).toEqual(
      expect.arrayContaining(["Golden Gate Bridge", "Baker Beach", "Pier 39 Sea Lions"])
    );
    expect(evaluation.unexpectedCandidateNames).toEqual(["Random Spot"]);
  });

  it("flags category mismatches separately from name misses", () => {
    const fixture = importBenchmarkFixtures.find(
      (item) => item.id === "guangdong-xinghua-wuji-beef-hotpot"
    );

    expect(fixture).toBeDefined();

    const evaluation = evaluateImportBenchmark(fixture!, [
      {
        name: "Xinghua Wuji Beef Hotpot",
        category: "activities"
      }
    ]);

    expect(evaluation.matchedExpectedNames).toEqual([]);
    expect(evaluation.missingExpectedNames).toEqual([]);
    expect(evaluation.categoryMismatches).toEqual([
      {
        expectedName: "Xinghua Wuji Beef Hotpot",
        candidateName: "Xinghua Wuji Beef Hotpot",
        actualCategory: "activities",
        acceptableCategories: ["restaurants"]
      }
    ]);
  });
});
