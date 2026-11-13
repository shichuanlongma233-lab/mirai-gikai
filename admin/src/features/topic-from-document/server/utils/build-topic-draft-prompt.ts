import "server-only";

import { FOLLOW_UP_DEPTH_LIMIT_RULE } from "@/features/interview-config/shared/utils/default-questions-template";

/**
 * 資料からトピック記事とインタビュー設定の下書きを作るためのプロンプト。
 */
export function buildTopicDraftPrompt(params: {
  documentText: string;
  instructions?: string;
}): { system: string; user: string } {
  const { documentText, instructions } = params;

  const system = `あなたは、市民から意見を集める「AIインタビュー」の企画・設計を支援する専門家です。
管理者から渡された資料を読み込み、次の2つを作成してください。

1. トピック記事: 資料の内容を一般の人にもわかるように中立的に解説する記事（トピック名・タイトル・要約・本文）
2. インタビュー設計: そのトピックについて、回答者の立場・経験・意見・懸念・要望を引き出すためのテーマと質問

## 記事のルール
- 資料に書かれている事実だけを使い、推測や誇張をしない。資料にない数字や固有名詞を作らない。
- 賛否が分かれる点は、どちらかに肩入れせず両方の見方を紹介する。
- 専門用語には短い説明を添える。

## 質問のルール
- 5〜8問。最初は答えやすい質問（関心のある論点・回答者の立場や関わり方）から始め、徐々に具体的な意見・懸念・提案に進む。
- 最初の質問は「関心のあるテーマ」を選ぶ質問にし、選択肢には themes と同じ論点を並べる。
- 2問目は「回答者の立場・関わり方」を選ぶ質問にし、資料の内容で影響を受けそうな立場を4〜5件並べる。汎用枠として「一般市民として関心がある」を含める。
- 評価や理解度などを尋ねる質問は、選択式（quick_replies 3〜6件）にする。
- 理由や具体例を聞く質問は自由回答（quick_replies は空配列）にする。
- 最後の質問は「この取り組みを進める人に伝えたいこと」のような、要望を一言で受け止める質問にする。
- 「その他（自由記述）」はシステムが自動で付けるので、quick_replies に含めない。
- follow_up_guide には、AIインタビュアーが何を引き出すべきか、どうなったら次の質問へ進むかを具体的に書く。自由回答の質問では末尾に次の文を付ける:「${FOLLOW_UP_DEPTH_LIMIT_RULE}」
- 質問文は1つの質問で1つのことだけを聞き、誘導的な言い回しを避ける。`;

  const instructionSection = instructions?.trim()
    ? `\n\n## 管理者からの追加の指示\n${instructions.trim()}`
    : "";

  const user = `以下の資料をもとに、トピック記事とインタビュー設計を作成してください。${instructionSection}

<document>
${documentText}
</document>`;

  return { system, user };
}
