import { describe, expect, it } from "vitest";
import { buildAiLanguageInstruction } from "./ai-language-instruction";
import { getDictionary } from "./get-dictionary";
import { LOCALES, matchAcceptLanguage, resolveLocale } from "./locales";

describe("matchAcceptLanguage", () => {
  it("対応言語のうち優先度の高いものを返す", () => {
    expect(matchAcceptLanguage("en-US,en;q=0.9,ja;q=0.8")).toBe("en");
    expect(matchAcceptLanguage("fr;q=1,ko;q=0.5,en;q=0.4")).toBe("ko");
    expect(matchAcceptLanguage("zh-CN,zh;q=0.9")).toBe("zh");
  });

  it("対応言語が無ければ null", () => {
    expect(matchAcceptLanguage("fr,de")).toBeNull();
    expect(matchAcceptLanguage("")).toBeNull();
    expect(matchAcceptLanguage(null)).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("Cookie の言語を最優先する", () => {
    expect(resolveLocale({ cookieValue: "ko", acceptLanguage: "en" })).toBe(
      "ko"
    );
  });

  it("Cookie が無効ならブラウザの言語、それも無ければ日本語", () => {
    expect(resolveLocale({ cookieValue: "xx", acceptLanguage: "en" })).toBe(
      "en"
    );
    expect(resolveLocale({ cookieValue: null, acceptLanguage: "fr" })).toBe(
      "ja"
    );
  });
});

describe("getDictionary", () => {
  it("すべての言語で日本語と同じキーを持つ", () => {
    const keysOf = (value: unknown, prefix = ""): string[] =>
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? Object.entries(value).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
        : [prefix];
    const jaKeys = keysOf(getDictionary("ja")).sort();
    for (const locale of LOCALES) {
      expect(keysOf(getDictionary(locale)).sort()).toEqual(jaKeys);
    }
  });

  it("LP の特徴は全言語で同じ数", () => {
    for (const locale of LOCALES) {
      expect(getDictionary(locale).lp.features).toHaveLength(
        getDictionary("ja").lp.features.length
      );
    }
  });
});

describe("buildAiLanguageInstruction", () => {
  it("日本語なら何も足さない", () => {
    expect(buildAiLanguageInstruction("ja")).toBe("");
  });

  it("日本語以外なら言語名を含む指示を返す", () => {
    expect(buildAiLanguageInstruction("en")).toContain("English");
    expect(buildAiLanguageInstruction("ko")).toContain("한국어");
  });
});
