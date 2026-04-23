import type { ExtractedPlaceCandidate } from "@/lib/providers/gemini";
import { containsChineseCharacters } from "@/lib/import-language";

export type TravelScoreResult = {
  score: number;
  looksTravelRelated: boolean;
  positiveSignals: string[];
  negativeSignals: string[];
};

export type RuleBasedPlaceSeed = {
  name: string;
  category: ExtractedPlaceCandidate["category"];
  description: string;
  tags: string[];
  evidence: string[];
  queryHint?: string;
  allowGenericLocation?: boolean;
};

const positiveKeywordGroups = [
  {
    score: 3,
    label: "travel-venue",
    pattern:
      /\b(restaurant|cafe|coffee|bakery|bar|brewery|hotel|hostel|ryokan|resort|museum|gallery|temple|shrine|beach|market|viewpoint|lookout|park|garden|trail|waterfall|lake|island|station|neighborhood|landmark)\b/i
  },
  {
    score: 2,
    label: "trip-language",
    pattern:
      /\b(travel|trip|itinerary|vacation|getaway|city guide|food guide|hidden gem|must visit|things to do|where to eat|where to stay)\b/i
  },
  {
    score: 2,
    label: "trip-language-zh",
    pattern:
      /(旅行|旅游|攻略|行程|路线|必去|打卡|景点|美食|探店|去哪吃|去哪玩|住哪里|自由行)/u
  },
  {
    score: 2,
    label: "travel-format",
    pattern:
      /\b(street food|night market|old street|food crawl|day trip|metro|mrt|rail pass|train station|walking route|travel guide)\b/i
  },
  {
    score: 2,
    label: "travel-format-zh",
    pattern:
      /(夜市|老街|咖啡店|餐厅|酒吧|饭店|酒店|民宿|博物馆|美术馆|寺|神社|海滩|公园|花园|步道|观景台|车站)/u
  },
  {
    score: 2,
    label: "geographic-context",
    pattern:
      /\b(in|near|around|from)\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2}\b/
  },
  {
    score: 1,
    label: "map-language-zh",
    pattern: /(地址|地图|步行|地铁|预约|日落|风景|观景|路线)/u
  },
  {
    score: 1,
    label: "map-language",
    pattern: /\b(address|maps|metro|walk|minutes from|reservation|sunset|view)\b/i
  }
];

const negativeKeywordGroups = [
  {
    score: -3,
    label: "non-travel-topic",
    pattern:
      /\b(makeup|skincare|outfit|haul|grwm|unboxing|gym|workout|meme|prank|dating|boyfriend|girlfriend|nails|lip combo)\b/i
  },
  {
    score: -2,
    label: "creator-only",
    pattern:
      /\b(follow me|link in bio|use my code|subscribe|comment below|dm me|shop my|amazon finds)\b/i
  },
  {
    score: -2,
    label: "creator-only-zh",
    pattern:
      /(关注我|简介链接|折扣码|私信我|评论区|开箱|穿搭|化妆|护肤|健身|情侣|美甲)/u
  }
];

const categoryMatchers: Array<{
  category: ExtractedPlaceCandidate["category"];
  pattern: RegExp;
}> = [
  {
    category: "cafes",
    pattern: /\b(cafe|coffee|espresso|latte|roastery|bakery|brunch)\b|咖啡|咖啡店|甜點/iu
  },
  {
    category: "bars",
    pattern: /\b(bar|cocktail|brewery|pub|wine|speakeasy|nightcap)\b|酒吧|調酒|啤酒/iu
  },
  {
    category: "hotels",
    pattern: /\b(hotel|hostel|ryokan|resort|villa|stay|stays|accommodation)\b|飯店|酒店|旅館|民宿/iu
  },
  {
    category: "photo spots",
    pattern: /\b(photo spots?|instagrammable|rooftop view|sunset spot|viewpoint|lookout)\b|拍照|打卡|觀景|日落/iu
  },
  {
    category: "scenic spots",
    pattern: /\b(beach|park|garden|temple|shrine|market|waterfall|lake|island|museum|gallery|landmark)\b|景點|公園|寺|神社|海邊|夜市|老街|博物館|美術館/iu
  },
  {
    category: "activities",
    pattern: /\b(hike|tour|museum pass|boat|kayak|snorkel|trail|class|workshop)\b|遊艇|體驗|行程|活動|門票|導覽|划船|潛水/iu
  },
  {
    category: "restaurants",
    pattern:
      /\b(food|restaurant|ramen|sushi|pizza|dinner|lunch|bbq|tavern|bistro|eatery|food hall)\b|餐廳|小吃|火鍋|拉麵|壽司|早餐|午餐|晚餐|美食/iu
  }
];

const stopPhrases = new Set([
  "instagram",
  "tiktok",
  "travel reel",
  "food reel",
  "new link import",
  "things to do",
  "where to eat",
  "where to stay",
  "must visit",
  "hidden gems",
  "hidden gem",
  "saved places",
  "reel",
  "video"
]);

const connectorWords = new Set(["of", "the", "and", "&", "de", "du", "la", "le", "da", "del", "des", "di", "al"]);
const placeSuffixPattern =
  /\b(?:market|markets|temple|shrine|peak|tram|ferry|park|road|street|escalator|estate|promenade|pier|station|museum|gallery|garden|gardens|beach|bay|trail|lookout|viewpoint|point|center|centre|tower|plaza|square|harbor|harbour|island|bridge|disneyland|musea|lane)\b/i;
const landmarkWordPattern =
  /\b(?:spiral|tower|bridge|lane|plaza|square|harbor|harbour|museum|gallery|garden|park|market|temple|tram|peak|ferry|buddha|cable\s+car|escalator)\b/i;
const knownLocalityPattern = /\b(hong kong|shanghai|shenzhen|taipei|tokyo|kyoto|beijing|kaohsiung)\b/i;

function normalizeHashtagToken(token: string) {
  return token
    .replace(/[_-]+/g, " ")
    .replace(/nightmarkets/gi, "night markets")
    .replace(/nightmarket/gi, "night market")
    .replace(/streetfoods/gi, "street foods")
    .replace(/streetfood/gi, "street food")
    .replace(
      /(travel|trip|guide|food|foods|market|markets|nightmarket|nightmarkets|itinerary|cafe|cafes|coffee|restaurant|restaurants|hotel|hotels|taipei|taichung|tainan|kaohsiung)$/i,
      " $1"
    )
    .replace(/\s+/g, " ")
    .trim();
}

function stripSubtitleFormatting(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\\an\d+\}/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/&nbsp;/gi, " ");
}

export function normalizeImportedEvidenceText(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  return stripSubtitleFormatting(input)
    .replace(/\r\n/g, "\n")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/@\w+/g, " ")
    .replace(/#([\p{L}\p{N}_-]+)/gu, (_, token: string) => ` ${normalizeHashtagToken(token)} `)
    .replace(/\s+/g, " ")
    .trim();
}

export function subtitleToPlainText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) {
        return false;
      }

      if (/^\d+$/.test(line)) {
        return false;
      }

      if (
        /^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[.,]\d{3}$/.test(line) ||
        /^\d{2}:\d{2}[.:]\d{2}[.,]\d{3}\s+-->\s+\d{2}:\d{2}[.:]\d{2}[.,]\d{3}$/.test(line)
      ) {
        return false;
      }

      if (/^WEBVTT$/i.test(line)) {
        return false;
      }

      return true;
    })
    .map((line) => stripSubtitleFormatting(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCombinedEvidenceText(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => normalizeImportedEvidenceText(part))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function scoreTravelEvidence(input: {
  text: string;
  destinationHint?: string;
}): TravelScoreResult {
  const text = buildCombinedEvidenceText([input.text]);
  let score = 0;
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  for (const group of positiveKeywordGroups) {
    if (group.pattern.test(text)) {
      score += group.score;
      positiveSignals.push(group.label);
    }
  }

  for (const group of negativeKeywordGroups) {
    if (group.pattern.test(text)) {
      score += group.score;
      negativeSignals.push(group.label);
    }
  }

  if (input.destinationHint && text.toLowerCase().includes(input.destinationHint.toLowerCase())) {
    score += 1;
    positiveSignals.push("destination-hint");
  }

  if (/\b(restaurant|cafe|hotel|museum|temple|market)\b/i.test(text) && /\b(in|near)\b/i.test(text)) {
    score += 1;
    positiveSignals.push("place-context");
  }

  return {
    score,
    looksTravelRelated: score >= 2,
    positiveSignals,
    negativeSignals
  };
}

function inferCategoryFromContext(context: string) {
  for (const matcher of categoryMatchers) {
    if (matcher.pattern.test(context)) {
      return matcher.category;
    }
  }

  return "activities" satisfies ExtractedPlaceCandidate["category"];
}

function splitStructuredCategoryText(value: string) {
  return value
    .split(/[;,/]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ");
}

function isUsefulName(name: string) {
  const normalized = name.trim();

  if (normalized.length < 3 || normalized.length > 80) {
    return false;
  }

  if (stopPhrases.has(normalized.toLowerCase())) {
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return false;
  }

  if (/^(best|top|travel|guide|reel|video|caption)$/i.test(normalized)) {
    return false;
  }

  if (/^(then|and|or|plus|visit|ride|head|stop|start|end)$/i.test(normalized)) {
    return false;
  }

  if (/\b(?:morning|mid-morning|afternoon|evening|itinerary|guide|hours?)\b/i.test(normalized)) {
    return false;
  }

  return true;
}

function normalizeCandidateName(input: string) {
  return input
    .replace(/([\p{Script=Han}])([A-Za-z0-9])/gu, "$1 $2")
    .replace(/([A-Za-z0-9])([\p{Script=Han}])/gu, "$1 $2")
    .replace(/^[^%\p{L}\p{N}]+/u, "")
    .replace(
      /^(?:(?:and|then|plus|visit|ride|head|go|stop|start|end|your|our|my|morning|afternoon|evening|the|a|an|famous|historic|iconic|popular|local)\s+)+/i,
      ""
    )
    .replace(/\b(for|with|near|from|at|in|on|to)\b.*$/i, "")
    .replace(/\b(?:and|or|but|then)\b$/i, "")
    .replace(/[（(][^()（）]{0,40}[）)]$/u, "")
    .replace(/[.,!?:;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWords(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractChineseAddressHint(input: string) {
  return (
    input
      .match(/(?:集合地點|地址|地點|位置)[：:]\s*([^\n#()（）]{6,80})/u)?.[1]
      ?.replace(/\s+/g, " ")
      .trim() ?? null
  );
}

function isLikelyChineseLocationLabel(label: string) {
  const normalized = label.trim();

  if (!normalized) {
    return false;
  }

  if (/(攻略|旅行|旅遊|景點|美食|行程|推薦|最新|打卡|必去|去哪|餐廳|咖啡|酒店|飯店)/u.test(normalized)) {
    return false;
  }

  if (normalized.length > 4 && !/(市|縣|區|鎮|鄉|村|島)$/u.test(normalized)) {
    return false;
  }

  return true;
}

function isLikelyLocalitySegment(value: string, destinationHint?: string) {
  const normalized = value.trim();

  if (!normalized) {
    return true;
  }

  const comparable = normalized.toLowerCase();
  const destinationComparable = destinationHint?.trim().toLowerCase();

  if (destinationComparable && comparable === destinationComparable) {
    return true;
  }

  return (
    /(district|city|county|province|region|sar)$/i.test(normalized) ||
    /^(hong kong|shenzhen|shanghai|taipei|tokyo|kyoto|futian)$/i.test(normalized) ||
    /[市區区縣县鎮镇鄉乡省州郡道府]$/u.test(normalized)
  );
}

function trimTrailingLocalitySegments(value: string, destinationHint?: string) {
  const segments = value
    .split(/\s*,\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  while (segments.length > 1 && isLikelyLocalitySegment(segments[segments.length - 1] ?? "", destinationHint)) {
    segments.pop();
  }

  return segments.join(", ");
}

function inferSegmentQueryHint(segment: string, destinationHint?: string) {
  if (destinationHint?.trim()) {
    return destinationHint.trim();
  }

  const upperLocality =
    segment.match(/\b([A-Z]{3,}(?:\s+[A-Z]{2,}){0,2})\b/u)?.[1] ??
    null;
  if (upperLocality) {
    return titleCaseWords(upperLocality);
  }

  const sentenceLocality =
    segment.match(/\b(?:in|at|near|around|from)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\b/u)?.[1] ??
    segment.match(knownLocalityPattern)?.[1] ??
    null;

  return sentenceLocality ?? undefined;
}

function normalizeStructuredLineName(name: string) {
  const normalized = normalizeCandidateName(name.replace(/^\d+\.\s*/, "").trim());
  const parts = normalized
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return normalized;
  }

  const suffix = parts[1] ?? "";
  if (
    /^(a|an|the|known|wild|rolling|mystical|wrapped|part|one|white|turquoise|cliffside|centuries-old|some|just|raw|slow)\b/i.test(
      suffix
    ) ||
    (/[a-z]/.test(suffix) && suffix.split(/\s+/).length >= 4)
  ) {
    return parts[0] ?? normalized;
  }

  return normalized;
}

function collectStructuredLineSeeds(input: {
  combined: string;
  destinationHint?: string;
  maxSeeds: number;
}) {
  const seeds: RuleBasedPlaceSeed[] = [];
  const seen = new Set<string>();
  const lines = input.combined
    .split(/\n|(?=\b\d+\.\s)/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!/^\d+\.\s*/.test(line)) {
      continue;
    }

    let remainder = line.replace(/^\d+\.\s*/, "").trim();
    const categoryMatch = remainder.match(/^\(([^)]+)\)\s*[:;]?\s*/u);
    const rawCategory = splitStructuredCategoryText(categoryMatch?.[1] ?? "");

    if (categoryMatch) {
      remainder = remainder.slice(categoryMatch[0].length).trim();
    }

    const parts = remainder
      .split(/\s*;\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
    const rawName = normalizeStructuredLineName(parts[0] ?? remainder);
    const trailingContext = [parts.slice(1).join(", "), input.destinationHint]
      .filter(Boolean)
      .join(" ");

    if (!rawName || !isUsefulName(rawName)) {
      continue;
    }

    const key = rawName.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    seeds.push({
      name: rawName,
      category: inferCategoryFromContext([rawCategory, line].filter(Boolean).join(" ")),
      description: `Recovered from structured travel list evidence: ${line.slice(0, 160)}`,
      tags: Array.from(
        new Set(
          [input.destinationHint, rawCategory]
            .filter((value): value is string => Boolean(value))
            .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/i))
            .filter((token) => token.length >= 4)
        )
      ).slice(0, 6),
      evidence: [line],
      queryHint: inferSegmentQueryHint(trailingContext, input.destinationHint),
      allowGenericLocation:
        !/\s/.test(rawName) ||
        /^[A-Z][\p{L}'’-]+(?:\s+-\s+[A-Z][\p{L}'’-]+){0,1}$/u.test(rawName)
    });

    if (seeds.length >= input.maxSeeds) {
      break;
    }
  }

  return seeds;
}

function collectPinnedLineSeeds(input: {
  combined: string;
  destinationHint?: string;
}) {
  const seeds: RuleBasedPlaceSeed[] = [];
  const seen = new Set<string>();

  const pinnedLines = input.combined
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /(?:^|[\s])📍|^(?:location|place|spot|地址|地点|地點)[：:]/iu.test(line));

  for (const line of pinnedLines) {
    const trimmedLine = line
      .replace(/^(?:📍\s*)+/u, "")
      .replace(/^(?:location|place|spot|地址|地点|地點)[：:]\s*/iu, "")
      .trim();

    if (!trimmedLine) {
      continue;
    }

    const rawChunks = trimmedLine
      .split(/[，、;；]/u)
      .map((chunk) => trimTrailingLocalitySegments(chunk, input.destinationHint))
      .flatMap((chunk) => chunk.split(/\s{2,}|\s+[|/]\s+/))
      .map((chunk) => normalizeCandidateName(chunk))
      .filter(Boolean);

    for (const chunk of rawChunks) {
      if (!isUsefulName(chunk) || isLikelyLocalitySegment(chunk, input.destinationHint)) {
        continue;
      }

      const key = chunk.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      seeds.push({
        name: chunk,
        category: inferCategoryFromContext(line),
        description: `Recovered from pinned travel evidence: ${trimmedLine}`,
        tags: Array.from(
          new Set(
            [input.destinationHint]
              .filter((value): value is string => Boolean(value))
          )
        ).slice(0, 4),
        evidence: [line],
        queryHint: input.destinationHint
      });
    }
  }

  return seeds;
}

function collectChineseLabeledSeeds(input: {
  combined: string;
  destinationHint?: string;
}) {
  const seeds: RuleBasedPlaceSeed[] = [];
  const seen = new Set<string>();
  const addressHint = extractChineseAddressHint(input.combined);
  const labelPattern =
    /(?:^|[\s\n])(?:📍\s*)?([\p{Script=Han}]{2,12})[。．·・:：]\s*([\p{Script=Han}A-Za-z0-9%&'’().\-]{2,32})/gu;

  for (const match of input.combined.matchAll(labelPattern)) {
    const cityOrArea = match[1]?.trim();
    const name = normalizeCandidateName(match[2] ?? "");
    const evidence = match[0]?.trim() || name;

    if (
      !cityOrArea ||
      !isLikelyChineseLocationLabel(cityOrArea) ||
      !containsChineseCharacters(name) ||
      !isUsefulName(name)
    ) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    seeds.push({
      name,
      category: inferCategoryFromContext(evidence),
      description: `Recovered from labeled reel evidence: ${evidence}`,
      tags: Array.from(
        new Set(
          [cityOrArea, input.destinationHint].filter(
            (value): value is string => Boolean(value)
          )
        )
      ).slice(0, 4),
      evidence: [evidence],
      queryHint: [cityOrArea, addressHint, input.destinationHint].filter(Boolean).join(", ")
    });
  }

  return seeds;
}

function collectSegmentCandidates(segment: string, destinationHint?: string) {
  const candidates: string[] = [];
  const trimmed = segment.trim();
  const normalizedSegment = trimmed.replace(/[‑–—]/g, "-");

  const cueRegex =
    /\b(?:at|in|try|visit|stay at|book|eat at|drink at|head to|go to|stop at)\s+(?:(?:the|a|an|famous|historic|iconic|popular|local)\s+){0,2}([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,6})/gu;
  const destinationCueRegex =
    /\bto\s+(?:(?:the|a|an|famous|historic|iconic|popular|local)\s+){0,2}([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,6})/gu;
  const suffixPhraseRegex =
    /([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,6}\s+(?:Market|Temple|Peak|Tram|Park|Garden|Museum|Gallery|Street|Tower|Lane))/gu;
  const uppercaseLocalityLandmarkRegex =
    /\b[A-Z]{3,}(?:\s+[A-Z]{2,}){0,2}\s+([a-z]+(?:\s+[a-z]+){1,3})\b/gu;

  for (const match of normalizedSegment.matchAll(cueRegex)) {
    if (match[1]) {
      candidates.push(match[1]);
    }
  }

  for (const match of normalizedSegment.matchAll(destinationCueRegex)) {
    if (match[1]) {
      candidates.push(match[1]);
    }
  }

  for (const match of normalizedSegment.matchAll(suffixPhraseRegex)) {
    if (match[1]) {
      candidates.push(match[1]);
    }
  }

  const leadingPhrase =
    normalizedSegment.match(/^([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,6})/u)?.[1] ??
    null;

  if (leadingPhrase) {
    if (
      placeSuffixPattern.test(leadingPhrase) ||
      landmarkWordPattern.test(leadingPhrase) ||
      /^%/.test(leadingPhrase) ||
      containsChineseCharacters(leadingPhrase)
    ) {
      candidates.push(leadingPhrase);
    }
  }

  const postColonPhrase =
    normalizedSegment.match(/:\s*([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,6})/u)?.[1] ??
    null;

  if (postColonPhrase) {
    candidates.push(postColonPhrase);
  }

  for (const match of normalizedSegment.matchAll(uppercaseLocalityLandmarkRegex)) {
    const landmarkPhrase = match[1]?.trim();
    if (landmarkPhrase && landmarkWordPattern.test(landmarkPhrase)) {
      candidates.push(titleCaseWords(landmarkPhrase));
    }
  }

  const words = normalizedSegment.match(/[%A-Za-z0-9][\p{L}\p{N}%&'’/().-]*/gu) ?? [];
  for (let start = 0; start < words.length; start += 1) {
    if (!/^[%A-Z0-9]/.test(words[start] ?? "")) {
      continue;
    }

    const phraseWords = [words[start] as string];
    if (/-/.test(phraseWords[0] ?? "")) {
      candidates.push(phraseWords[0] as string);
    }

    let bestPhrase: string | null = null;
    for (let end = start + 1; end < Math.min(words.length, start + 8); end += 1) {
      const word = words[end] ?? "";
      const lowerWord = word.toLowerCase();

      if (/^[%A-Z0-9]/.test(word) || connectorWords.has(lowerWord)) {
        phraseWords.push(word);
      } else {
        break;
      }

      const phrase = phraseWords.join(" ");
      if (placeSuffixPattern.test(phrase)) {
        bestPhrase = phrase;
      }
    }

    if (bestPhrase) {
      candidates.push(bestPhrase);
    }
  }

  return candidates
    .map((candidate) => normalizeCandidateName(candidate))
    .filter((candidate) => {
      const tokenCount = candidate.split(/\s+/).filter(Boolean).length;
      return (
        isUsefulName(candidate) &&
        !isLikelyLocalitySegment(candidate, destinationHint) &&
        (tokenCount >= 2 || /[-%&/]/.test(candidate) || /\b(park|bar|cafe|hotel|museum|temple)\b/i.test(segment))
      );
    })
    .sort((left, right) => right.length - left.length)
    .filter((candidate, index, all) => {
      const normalizedCandidate = candidate.toLowerCase();
      return !all.slice(0, index).some((existing) => {
        const normalizedExisting = existing.toLowerCase();
        return normalizedExisting !== normalizedCandidate && normalizedExisting.includes(normalizedCandidate);
      });
    });
}

function shouldSplitPlaceLists(segment: string) {
  const normalized = segment.trim();

  if (!normalized) {
    return false;
  }

  if (/(?:^|[\s])📍|^(?:location|place|spot|地址|地点|地點)[：:]/iu.test(normalized)) {
    return true;
  }

  const listCandidateCount = (
    normalized.match(
      /(?:^|,\s+|\band\s+|:\s+)([%A-Z][\p{L}\p{N}%&'’/().-]*(?:\s+[%A-Z0-9][\p{L}\p{N}%&'’/().-]*){0,4})/gu
    ) ?? []
  ).length;

  return listCandidateCount >= 2;
}

export function extractRuleBasedPlaceSeeds(input: {
  text: string;
  destinationHint?: string;
  maxSeeds?: number;
}) {
  const combined = input.text.replace(/\r\n/g, "\n").trim();
  const maxSeeds = input.maxSeeds ?? 8;
  const segments = combined
    .split(/\n|[•|]/)
    .flatMap((line) =>
      line
        .split(/[.!?。！？；;]/)
        .flatMap((segment) =>
          shouldSplitPlaceLists(segment) ? segment.split(/(?:,|;)/) : [segment]
        )
    )
    .map((segment) => segment.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const seeds = [
    ...collectStructuredLineSeeds({
      combined,
      destinationHint: input.destinationHint,
      maxSeeds
    }),
    ...collectPinnedLineSeeds({
      combined,
      destinationHint: input.destinationHint
    }),
    ...collectChineseLabeledSeeds({
      combined,
      destinationHint: input.destinationHint
    })
  ].slice(0, maxSeeds);

  for (const seed of seeds) {
    seen.add(seed.name.toLowerCase());
  }

  for (const segment of segments) {
    const segmentCandidates = collectSegmentCandidates(segment, input.destinationHint);
    const segmentQueryHint = inferSegmentQueryHint(segment, input.destinationHint);
    for (const candidate of segmentCandidates) {
      const key = candidate.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      seeds.push({
        name: candidate,
        category: inferCategoryFromContext(segment),
        description: `Recovered from saved reel evidence: ${segment.slice(0, 160)}`,
        tags: Array.from(
          new Set(
            segment
              .toLowerCase()
              .split(/[^a-z0-9]+/i)
              .filter((token) => token.length >= 4)
          )
        ).slice(0, 6),
        evidence: [segment],
        queryHint: segmentQueryHint
      });
    }

    if (seeds.length >= maxSeeds) {
      break;
    }
  }

  return seeds.slice(0, maxSeeds);
}
