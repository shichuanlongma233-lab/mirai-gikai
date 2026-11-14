import { describe, expect, it } from "vitest";
import { shouldUseGemini, toGeminiModelId } from "./gemini-provider";

describe("toGeminiModelId", () => {
  it("Gateway 形式の Gemini 指定も既定モデルに寄せる", () => {
    expect(toGeminiModelId("google/gemini-3-flash", "fallback")).toBe(
      "fallback"
    );
  });

  it("素の gemini- ID はそのまま使う", () => {
    expect(toGeminiModelId("gemini-3.8-flash", "fallback")).toBe(
      "gemini-3.8-flash"
    );
  });

  it("Gemini 以外のモデルは既定モデルにする", () => {
    expect(toGeminiModelId("openai/gpt-5.2", "gemini-3.8-flash")).toBe(
      "gemini-3.8-flash"
    );
    expect(toGeminiModelId("anthropic/claude-haiku-4.5", "x")).toBe("x");
  });
});

describe("shouldUseGemini", () => {
  it("API キーがあれば Gemini を使う", () => {
    expect(shouldUseGemini({ GOOGLE_GENERATIVE_AI_API_KEY: "k" })).toBe(true);
  });

  it("キーが無い・空白のみ・AI_PROVIDER=gateway なら使わない", () => {
    expect(shouldUseGemini({})).toBe(false);
    expect(shouldUseGemini({ GOOGLE_GENERATIVE_AI_API_KEY: "  " })).toBe(false);
    expect(
      shouldUseGemini({
        GOOGLE_GENERATIVE_AI_API_KEY: "k",
        AI_PROVIDER: "gateway",
      })
    ).toBe(false);
  });
});
