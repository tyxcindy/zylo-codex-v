export const supportedLocales = ["en", "zh-CN"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "zylo-locale";

export function normalizeLocale(input: string | null | undefined): Locale {
  return supportedLocales.includes(input as Locale) ? (input as Locale) : defaultLocale;
}

const messages = {
  en: {
    locale: {
      label: "Language",
      en: "EN",
      zh: "中文"
    },
    theme: {
      toggle: "Toggle theme",
      light: "Light",
      dark: "Dark"
    },
    siteHeader: {
      preview: "Preview",
      learnMore: "Learn more",
      startFree: "Start free",
      openZylo: "Open Zylo"
    },
    siteFooter: {
      description:
        "A personal space that filters your saved reels, isolates the travel ones, and turns them into places worth remembering.",
      howItWorks: "How It Works",
      signIn: "Sign in",
      openApp: "Open app"
    },
    appShell: {
      home: "Home",
      import: "Import",
      destinations: "Destinations",
      trips: "Trips",
      search: "Search",
      map: "Map",
      settings: "Settings",
      signedInAs: "Signed in as",
      importReelLink: "Import a reel link"
    }
  },
  "zh-CN": {
    locale: {
      label: "语言",
      en: "EN",
      zh: "中文"
    },
    theme: {
      toggle: "切换主题",
      light: "浅色",
      dark: "深色"
    },
    siteHeader: {
      preview: "预览",
      learnMore: "了解更多",
      startFree: "免费开始",
      openZylo: "打开 Zylo"
    },
    siteFooter: {
      description:
        "一个属于你的整理空间，筛出值得保存的旅行内容，并把它们变成真正值得记住的地点。",
      howItWorks: "工作方式",
      signIn: "登录",
      openApp: "打开应用"
    },
    appShell: {
      home: "首页",
      import: "导入",
      destinations: "目的地",
      trips: "行程",
      search: "搜索",
      map: "地图",
      settings: "设置",
      signedInAs: "当前登录",
      importReelLink: "导入 Reel 链接"
    }
  }
} as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}
