import { describe, expect, it } from "vitest";
import {
  shouldUseGemini,
  toGeminiModelId,
  toThinkingLevel,
  withDefaultThinking,
} from "./gemini-provider";

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

describe("withDefaultThinking", () => {
  it("思考設定が無ければ既定レベルを足す", () => {
    const result = withDefaultThinking(
      { prompt: "x", providerOptions: { google: { foo: 1 } } },
      "low"
    );
    expect(result.providerOptions?.google).toEqual({
      foo: 1,
      thinkingConfig: { thinkingLevel: "low" },
    });
    expect(result.prompt).toBe("x");
  });

  it("呼び出し側の思考設定は上書きしない", () => {
    const options = {
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    };
    expect(withDefaultThinking(options, "low")).toBe(options);
  });
});

describe("toThinkingLevel", () => {
  it("不正値・未設定なら low", () => {
    expect(toThinkingLevel(undefined)).toBe("low");
    expect(toThinkingLevel("max")).toBe("low");
    expect(toThinkingLevel(" minimal ")).toBe("minimal");
  });
});
