import type { RespondentInsight } from "../schemas";

export interface RespondentSource {
  topicTitle: string;
  summary: string | null;
  messages: Array<{ role: "assistant" | "user"; content: string }>;
}

const MAX_MESSAGE_CHARS = 1200;

/** 回答者1人分の会話から、市場調査の項目を読み取るためのプロンプト */
export function buildRespondentInsightPrompt(source: RespondentSource): {
  system: string;
  user: string;
} {
  const transcript = source.messages
    .map(
      (m) =>
        `${m.role === "user" ? "回答者" : "インタビュアー"}: ${m.content.slice(0, MAX_MESSAGE_CHARS)}`
    )
    .join("\n");
  return {
    system: [
      "あなたは市場調査のアナリストです。",
      "日本の文化・商品について、海外の人などにAIがインタビューした会話を読み、決められた項目を抜き出します。",
      "会話で触れていないことは推測せず unknown や空文字にしてください。",
      "引用（quoteOriginal）は回答者の発言をそのまま使い、言い換えないでください。",
      "quoteOriginal 以外の文章はすべて日本語で書いてください。",
    ].join("\n"),
    user: [
      `トピック: ${source.topicTitle}`,
      source.summary ? `インタビューの要約: ${source.summary}` : "",
      "会話:",
      transcript,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/** 複数の回答者をまとめて1回で読み取るためのプロンプト（リクエスト数を減らす） */
export function buildBatchRespondentInsightPrompt(
  topicTitle: string,
  sources: Array<Omit<RespondentSource, "topicTitle">>
): { system: string; user: string } {
  const single = buildRespondentInsightPrompt({
    topicTitle,
    summary: null,
    messages: [],
  });
  const blocks = sources.map((s, i) => {
    const transcript = s.messages
      .map(
        (m) =>
          `${m.role === "user" ? "回答者" : "インタビュアー"}: ${m.content.slice(0, MAX_MESSAGE_CHARS)}`
      )
      .join("\n");
    return [
      `=== 回答者 #${i + 1} ===`,
      s.summary ? `要約: ${s.summary}` : "",
      transcript,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return {
    system: `${single.system}\n回答者ごとに1件ずつ、番号の順に、ちょうど${sources.length}件を返してください。`,
    user: [`トピック: ${topicTitle}`, "", ...blocks].join("\n\n"),
  };
}

/** 全員分の読み取り結果から、論点をまとめるためのプロンプト */
export function buildInsightSummaryPrompt(
  topicTitle: string,
  insights: RespondentInsight[]
): { system: string; user: string } {
  const lines = insights.map((r, i) =>
    [
      `#${i + 1} 言語=${r.language} 反応=${r.overall} 購入=${r.purchaseIntent} ギフト=${r.giftIntent} 価格=${r.priceImpression}`,
      `  一言: ${r.oneLine}`,
      `  良い点: ${r.positives.join(" / ") || "なし"}`,
      `  不満点: ${r.negatives.join(" / ") || "なし"}`,
      r.priceComment ? `  価格: ${r.priceComment}` : "",
      r.quoteJa ? `  発言: ${r.quoteJa}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
  return {
    system: [
      "あなたは日本の文化・商品の海外展開を支援する市場調査のアナリストです。",
      "回答者ごとの読み取り結果を読み、似た意見をテーマにまとめます。",
      "テーマごとに、そのテーマを挙げた回答者の番号（#の数字）をすべて挙げてください。人数は書かないでください。",
      "すべて日本語で、事業者がすぐ行動に移せるように具体的に書いてください。",
    ].join("\n"),
    user: [
      `トピック: ${topicTitle}`,
      `回答者数: ${insights.length}`,
      "",
      ...lines,
    ].join("\n"),
  };
}
