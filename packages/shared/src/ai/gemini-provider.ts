import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Gemini の API キーだけで動かすための設定。
 *
 * 通常、モデルは "openai/gpt-5.2" のような Vercel AI Gateway 形式の文字列で指定し、
 * AI SDK が Gateway 経由で呼び出す。環境変数 GOOGLE_GENERATIVE_AI_API_KEY が
 * 設定されているときは、AI SDK の既定プロバイダーを Gemini に差し替え、
 * どのモデル指定でも Gemini で動くようにする（AI_PROVIDER=gateway で無効化）。
 */

/** Gemini 以外のモデルが指定されたときに使う既定のモデル */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

type ProviderEnv = {
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_THINKING_LEVEL?: string;
  AI_PROVIDER?: string;
};

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

/** 既定の思考レベル。速度とコストを優先して low にする（GEMINI_THINKING_LEVEL で変更可） */
export const DEFAULT_GEMINI_THINKING_LEVEL: ThinkingLevel = "low";

export function toThinkingLevel(value: string | undefined): ThinkingLevel {
  const v = value?.trim();
  return v === "minimal" || v === "low" || v === "medium" || v === "high"
    ? v
    : DEFAULT_GEMINI_THINKING_LEVEL;
}

type CallOptions = {
  providerOptions?: Record<string, Record<string, unknown> | undefined>;
};

/** 呼び出し側で思考設定が無ければ、既定の思考レベルを足す */
export function withDefaultThinking<T extends CallOptions>(
  options: T,
  thinkingLevel: ThinkingLevel
): T {
  const google = options.providerOptions?.google ?? {};
  if ("thinkingConfig" in google) {
    return options;
  }
  return {
    ...options,
    providerOptions: {
      ...options.providerOptions,
      google: { ...google, thinkingConfig: { thinkingLevel } },
    },
  };
}

/**
 * Gateway 形式のモデル ID を Gemini のモデル ID にする。
 * コストと提供終了リスクを抑えるため、Gateway 形式の指定（"google/..." を含む）は
 * すべて既定モデルに寄せる。"gemini-" で始まる素の ID だけはそのまま使う。
 */
export function toGeminiModelId(modelId: string, fallbackModel: string): string {
  if (modelId.startsWith("gemini-")) {
    return modelId;
  }
  return fallbackModel;
}

/** Gemini に差し替えるかどうか */
export function shouldUseGemini(env: ProviderEnv): boolean {
  return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) && env.AI_PROVIDER !== "gateway";
}

let configured = false;

/**
 * 条件を満たすとき、AI SDK の既定プロバイダーを Gemini にする。
 * サーバー側でだけ動かし、何度呼んでも1回だけ設定する。
 */
export function configureGeminiDefaultProvider(
  env: ProviderEnv = (globalThis as { process?: { env: ProviderEnv } })
    .process?.env ?? {}
): void {
  if (configured || typeof window !== "undefined" || !shouldUseGemini(env)) {
    return;
  }
  configured = true;

  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  });
  const fallbackModel = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const thinkingLevel = toThinkingLevel(env.GEMINI_THINKING_LEVEL);

  (globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown }).AI_SDK_DEFAULT_PROVIDER =
    {
      specificationVersion: "v3",
      languageModel: (modelId: string) => {
        const base = google.languageModel(
          toGeminiModelId(modelId, fallbackModel)
        );
        return {
          specificationVersion: base.specificationVersion,
          provider: base.provider,
          modelId: base.modelId,
          supportedUrls: base.supportedUrls,
          doGenerate: (options: Parameters<typeof base.doGenerate>[0]) =>
            base.doGenerate(withDefaultThinking(options, thinkingLevel)),
          doStream: (options: Parameters<typeof base.doStream>[0]) =>
            base.doStream(withDefaultThinking(options, thinkingLevel)),
        };
      },
      embeddingModel: (modelId: string) => google.embeddingModel(modelId),
      imageModel: (modelId: string) => google.imageModel(modelId),
    };
}
