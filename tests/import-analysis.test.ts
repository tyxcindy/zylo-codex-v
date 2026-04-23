import {
  buildCombinedEvidenceText,
  extractRuleBasedPlaceSeeds,
  scoreTravelEvidence,
  subtitleToPlainText
} from "@/lib/import-analysis";

describe("subtitleToPlainText", () => {
  it("removes cue timing and formatting", () => {
    const text = subtitleToPlainText(`WEBVTT

00:00:01.000 --> 00:00:03.000
<c.colorE5E5E5>Try Men-ya Inoichi in Kyoto</c>

00:00:03.000 --> 00:00:05.000
Then walk to Kiyomizu-dera at sunset
`);

    expect(text).toContain("Try Men-ya Inoichi in Kyoto");
    expect(text).toContain("Then walk to Kiyomizu-dera at sunset");
    expect(text).not.toContain("WEBVTT");
    expect(text).not.toContain("-->");
  });
});

describe("scoreTravelEvidence", () => {
  it("scores travel imports above threshold", () => {
    const result = scoreTravelEvidence({
      text: buildCombinedEvidenceText([
        "Kyoto food guide",
        "Try Men-ya Inoichi, % Arabica Kyoto Higashiyama, and Kiyomizu-dera."
      ]),
      destinationHint: "Kyoto"
    });

    expect(result.looksTravelRelated).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.positiveSignals.length).toBeGreaterThan(0);
  });

  it("penalizes obvious non-travel creator content", () => {
    const result = scoreTravelEvidence({
      text: "GRWM makeup haul, use my code, link in bio, amazon finds"
    });

    expect(result.looksTravelRelated).toBe(false);
    expect(result.score).toBeLessThan(2);
  });

  it("keeps travel signal from hashtags instead of deleting it", () => {
    const combined = buildCombinedEvidenceText([
      "#taiwantravel #taipei #nightmarket #streetfood"
    ]);
    const result = scoreTravelEvidence({
      text: combined
    });

    expect(combined).toContain("taiwan travel");
    expect(combined).toContain("night market");
    expect(result.looksTravelRelated).toBe(true);
    expect(result.positiveSignals).toContain("trip-language");
  });

  it("recognizes chinese travel signals", () => {
    const result = scoreTravelEvidence({
      text: buildCombinedEvidenceText([
        "台北美食攻略",
        "这家餐厅在台北很适合旅行时打卡，附近就是夜市。"
      ]),
      destinationHint: "台北"
    });

    expect(result.looksTravelRelated).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.positiveSignals).toContain("trip-language-zh");
  });

  it("scores chinese instagram descriptions recovered from yt-dlp", () => {
    const result = scoreTravelEvidence({
      text: buildCombinedEvidenceText([
        "高雄最新！全台唯一的海上遊艇超跑！",
        "下次來高雄又有新的行程可以安排了！！！",
        "📍高雄。艇萌玩家",
        "集合地點：高雄市苓雅區海邊路31號",
        "#高雄景點 #高雄旅遊 #高雄旅行"
      ])
    });

    expect(result.looksTravelRelated).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.positiveSignals).toContain("trip-language-zh");
  });

  it("does not let the destination hint alone create travel confidence", () => {
    const result = scoreTravelEvidence({
      text: "Instagram",
      destinationHint: "Hong Kong"
    });

    expect(result.looksTravelRelated).toBe(false);
    expect(result.score).toBe(0);
    expect(result.positiveSignals).not.toContain("destination-hint");
  });
});

describe("extractRuleBasedPlaceSeeds", () => {
  it("pulls concrete place names from mixed evidence text", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: "Kyoto food reel: Men-ya Inoichi for ramen, % Arabica Kyoto Higashiyama for coffee, and Kiyomizu-dera at sunset.",
      destinationHint: "Kyoto"
    });

    const names = seeds.map((seed) => seed.name);
    expect(names).toContain("Men-ya Inoichi");
    expect(names).toContain("% Arabica Kyoto Higashiyama");
    expect(names).toContain("Kiyomizu-dera");
  });

  it("pulls chinese labeled venues from instagram-style descriptions", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: `高雄最新！全台唯一的海上遊艇超跑！
📍高雄。艇萌玩家
集合地點：高雄市苓雅區海邊路31號
#高雄景點 #高雄旅遊 #高雄旅行`
    });

    expect(seeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "艇萌玩家"
        })
      ])
    );
  });

  it("splits mixed-language pinned location lines into separate concrete place seeds", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: `There's nothing quite like the magic&beauty of Shenzhen at night

📍Baimei Stone白眉石，Meilin Mountain Park 梅林山公园, Futian, Shenzhen`,
      destinationHint: "Shenzhen",
      maxSeeds: 8
    });

    expect(seeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Baimei Stone 白眉石"
        }),
        expect.objectContaining({
          name: "Meilin Mountain Park 梅林山公园"
        })
      ])
    );
  });

  it("does not extract a place seed from the destination hint alone", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: "Instagram",
      destinationHint: "Hong Kong"
    });

    expect(seeds).toEqual([]);
  });

  it("extracts venue names from long-form blog prose with unicode dashes", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: buildCombinedEvidenceText([
        "24 Hours in Hong Kong",
        "Start your morning at the Goldfish Market before heading to the Yuen Po Street Bird Market.",
        "Then visit the famous Man‑Mo Temple, ride the Peak Tram to Victoria Peak, and end the day at Temple Street Night Market."
      ]),
      destinationHint: "Hong Kong",
      maxSeeds: 12
    });

    const names = seeds.map((seed) => seed.name);
    expect(names).toContain("Goldfish Market");
    expect(names).toContain("Yuen Po Street Bird Market");
    expect(names.some((name) => /man[- ]mo temple/i.test(name))).toBe(true);
    expect(names).toContain("Peak Tram");
    expect(names).toContain("Victoria Peak");
    expect(names).toContain("Temple Street Night Market");
    expect(names).not.toContain("Then");
    expect(names).not.toContain("Victoria Peak and");
  });

  it("extracts landmark-style OCR phrases and carries the locality as query context", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: "SHANGHAI endless spiral",
      maxSeeds: 8
    });

    expect(seeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Endless Spiral",
          queryHint: "Shanghai"
        })
      ])
    );
  });

  it("extracts numbered roundup entries and keeps single-place destination names", () => {
    const seeds = extractRuleBasedPlaceSeeds({
      text: `1. (Activities, Photo Spots); Ronda - a cliffside town split by a breathtaking gorge
2. (Activities); Hanoi - culture, history, and daily life in motion
3. (Food); Grotta Palazzese;
4. (Stays); ISEYA Hotel - Chongqing Jiefangbei Flagship; 28 Minquan Rd`,
      destinationHint: "Spain",
      maxSeeds: 12
    });

    expect(seeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Ronda",
          category: "photo spots",
          allowGenericLocation: true
        }),
        expect.objectContaining({
          name: "Hanoi",
          category: "activities",
          allowGenericLocation: true
        }),
        expect.objectContaining({
          name: "Grotta Palazzese",
          category: "restaurants"
        }),
        expect.objectContaining({
          name: "ISEYA Hotel - Chongqing Jiefangbei Flagship",
          category: "hotels"
        })
      ])
    );
  });
});
