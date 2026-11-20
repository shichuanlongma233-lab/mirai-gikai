import { requireAdmin } from "@/features/auth/server/lib/auth-server";

export const maxDuration = 120;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

type ModelInfo = {
  name: string;
  supportedGenerationMethods?: string[];
};

/**
 * 運用確認用: この環境の Gemini API キーで使えるモデル一覧と、
 * 主な flash 系モデルの応答時間を返す（キーの値は返さない）。
 * ?probe=gemini-a,gemini-b で試すモデルを指定できる。
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({
      error: "GOOGLE_GENERATIVE_AI_API_KEY が未設定です",
    });
  }
  const headers = {
    "x-goog-api-key": apiKey,
    "content-type": "application/json",
  };

  const listRes = await fetch(`${API_BASE}/models?pageSize=200`, { headers });
  const listJson = (await listRes.json()) as { models?: ModelInfo[] };
  const models = (listJson.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""));

  const probeParam = new URL(req.url).searchParams.get("probe");
  const candidates = probeParam
    ? probeParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : models.filter((m) => m.includes("flash")).slice(0, 8);

  const probes = await Promise.all(
    candidates.map(async (model) => {
      const started = Date.now();
      try {
        const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: "Say hello in one word." }] },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        const body = (await res.json()) as { error?: { message?: string } };
        return {
          model,
          status: res.status,
          ms: Date.now() - started,
          error: body.error?.message?.slice(0, 200),
        };
      } catch (error) {
        return {
          model,
          status: 0,
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return Response.json({ listStatus: listRes.status, models, probes });
}
