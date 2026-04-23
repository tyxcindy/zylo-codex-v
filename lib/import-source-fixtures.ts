export type ImportSourceFixture = {
  id: string;
  url: string;
  label:
    | "travel-good"
    | "travel-borderline"
    | "non-travel-trap"
    | "subtitle-heavy"
    | "ocr-heavy";
};

export const importSourceFixtures: ImportSourceFixture[] = [
  {
    id: "travel-good-1",
    url: "https://www.instagram.com/p/DPnX-NIkpQR/",
    label: "travel-good"
  },
  {
    id: "travel-good-2",
    url: "https://www.instagram.com/p/DScH2fDkT5R/",
    label: "travel-good"
  },
  {
    id: "travel-good-3",
    url: "https://www.instagram.com/p/DTgW7MiEgzs/",
    label: "travel-good"
  },
  {
    id: "travel-borderline-1",
    url: "https://www.instagram.com/p/DLAc5fmN5wf/",
    label: "travel-borderline"
  },
  {
    id: "travel-borderline-2",
    url: "https://www.instagram.com/p/DJCVpfMPBZU/",
    label: "travel-borderline"
  },
  {
    id: "non-travel-trap-1",
    url: "https://www.instagram.com/p/DIjGyY6ukUn/",
    label: "non-travel-trap"
  },
  {
    id: "non-travel-trap-2",
    url: "https://www.instagram.com/p/DGpfV_TxgxG/",
    label: "non-travel-trap"
  },
  {
    id: "subtitle-heavy-1",
    url: "https://www.instagram.com/p/DIoCVIoh7cv/?img_index=1",
    label: "subtitle-heavy"
  },
  {
    id: "ocr-heavy-1",
    url: "https://www.instagram.com/p/DDg7HR5TfGy/",
    label: "ocr-heavy"
  }
];

export function groupImportSourceFixtures(fixtures: ImportSourceFixture[]) {
  return fixtures.reduce<Record<ImportSourceFixture["label"], ImportSourceFixture[]>>(
    (groups, fixture) => {
      groups[fixture.label].push(fixture);
      return groups;
    },
    {
      "travel-good": [],
      "travel-borderline": [],
      "non-travel-trap": [],
      "subtitle-heavy": [],
      "ocr-heavy": []
    }
  );
}
