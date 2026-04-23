import {
  getMessages,
  normalizeLocale,
  defaultLocale,
  supportedLocales
} from "@/lib/i18n";
import {
  groupImportSourceFixtures,
  importSourceFixtures
} from "@/lib/import-source-fixtures";

describe("i18n", () => {
  it("normalizes invalid locales to the default", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeLocale("fr")).toBe(defaultLocale);
    expect(supportedLocales).toEqual(["en", "zh-CN"]);
  });

  it("returns translated chrome labels", () => {
    expect(getMessages("en").siteHeader.openZylo).toBe("Open Zylo");
    expect(getMessages("zh-CN").siteHeader.openZylo).toBe("打开 Zylo");
  });
});

describe("import source fixtures", () => {
  it("keeps the shared regression sample mix intact", () => {
    const grouped = groupImportSourceFixtures(importSourceFixtures);

    expect(grouped["travel-good"]).toHaveLength(3);
    expect(grouped["travel-borderline"]).toHaveLength(2);
    expect(grouped["non-travel-trap"]).toHaveLength(2);
    expect(grouped["subtitle-heavy"]).toHaveLength(1);
    expect(grouped["ocr-heavy"]).toHaveLength(1);
  });
});
