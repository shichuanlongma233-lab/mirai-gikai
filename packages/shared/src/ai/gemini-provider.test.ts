import { describe, expect, it } from "vitest";
import { shouldUseGemini, toGeminiModelId } from "./gemini-provider";

describe("toGeminiModelId", () => {
  it("google/ の付いたモデルは接頭辞を外して使う", () => {
    expect(toGeminiModelId("google/gemini-3-flash", "fallback")).toBe(
      "gemini-3-flash"
    );
  });

  it("Gemini 以外のモデルは既定モデルにする", () => {
    expect(toGeminiModelId("openai/gpt-5.2", "gemini-2.5-flash")).toBe(
      "gemini-2.5-flash"
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
