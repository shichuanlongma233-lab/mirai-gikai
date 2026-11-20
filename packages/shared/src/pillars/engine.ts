import { CHECK_FIX_HINTS, checkWriterText, MAX_REWRITES_PER_INTERVIEW } from "./check";
import {
  type Action,
  type AnswerMemo,
  applyUpdates,
  choicesOf,
  createMemo,
  markNotApplicable,
  matchShownChoice,
  type PointUpdate,
  type ShownChoice,
} from "./memo";
import { planNextAction, recordAction } from "./planner";
import {
  buildRecorderPrompt,
  buildWriterPrompt,
  type RecorderOutput,
  type UtteranceKind,
  type WriterOutput,
} from "./prompts";
import { findPoint, type PillarSet } from "./schema";

/**
 * 回答メモ方式の1往復を進める。AIの呼び出しは外から渡す（web と admin で共用するため）。
 *
 * 流れ: 記録係（AI）→ メモ更新 → 進行係（ルール）→ 聞き手（AI）→ 最終チェック
 */

export interface PromptPair {
  system: string;
  prompt: string;
}

export interface EngineDeps {
  /** 記録係を呼ぶ（recorderOutputSchema の形で返す） */
  record: (p: PromptPair) => Promise<RecorderOutput>;
  /** 聞き手を呼ぶ（writerOutputSchema の形で返す） */
  write: (p: PromptPair) => Promise<WriterOutput>;
  now?: () => Date;
}

export type EngineLocale = "ja" | "en" | "zh" | "ko";

export const ENGINE_LANGUAGE_NAMES: Record<EngineLocale, string> = {
  ja: "日本語",
  en: "英語（English）",
  zh: "簡体字中国語（简体中文）",
  ko: "韓国語（한국어）",
};

/** まとめに移るときの決まった文（AIを使わない） */
export const CLOSING_TEXTS: Record<EngineLocale, string> = {
  ja: "ありがとうございました。お話しいただいた内容をまとめますので、少しお待ちください。",
  en: "Thank you very much. I'll put together a summary of what you shared — just a moment.",
  zh: "非常感谢。我来整理一下您刚才分享的内容，请稍等。",
  ko: "감사합니다. 말씀해 주신 내용을 정리하겠습니다. 잠시만 기다려 주세요.",
};

export interface EngineContext {
  set: PillarSet;
  locale: EngineLocale;
  /** 資料の要約（300字まで使う） */
  material: string;
}

export interface EngineResult {
  text: string;
  quickReplies: string[] | null;
  action: Action;
  memo: AnswerMemo;
  nextStage: "chat" | "summary";
  /** 聞いた点のid（まとめなら null） */
  pointId: string | null;
  /** 柱の名前（画面の見出しに使う） */
  pillarName: string | null;
  /** 記録係が判断した発言の種類（最初の質問では null） */
  utterance: UtteranceKind | null;
  /** 今回メモに入った更新（管理画面・ログ用） */
  updates: PointUpdate[];
}

/** インタビューの最初の質問を作る */
export async function startInterview(
  ctx: EngineContext,
  deps: EngineDeps,
  opts: { pillarVersion?: number } = {}
): Promise<EngineResult> {
  const now = deps.now?.() ?? new Date();
  const memo = createMemo(ctx.set, now, opts.pillarVersion ?? 1);
  return askOrClose(ctx, deps, memo, {
    now,
    recent: [],
    isOpening: true,
    utterance: null,
    updates: [],
  });
}

export interface TurnInput {
  memo: AnswerMemo;
  userMessage: string;
  /** 直前にAIが聞いた文 */
  lastQuestion: string;
  /** 直近のやりとり（古い順。最新の回答者の発言を含む） */
  recent: Array<{ role: "assistant" | "user"; content: string }>;
}

/** 回答者の発言を受けて1往復進める */
export async function runTurn(
  ctx: EngineContext,
  deps: EngineDeps,
  input: TurnInput
): Promise<EngineResult> {
  const now = deps.now?.() ?? new Date();
  let memo: AnswerMemo = { ...input.memo, turns: input.memo.turns + 1 };

  // 1. 記録係（選択肢を押しただけならAIを使わない）
  let utterance: UtteranceKind = "answer";
  let updates: PointUpdate[] = matchShownChoice(memo, input.userMessage) ?? [];
  if (updates.length === 0) {
    const recorded = await deps.record(
      buildRecorderPrompt({
        set: ctx.set,
        memo,
        lastQuestion: input.lastQuestion,
        userMessage: input.userMessage,
      })
    );
    utterance = recorded.utterance;
    updates = recorded.updates.map((u) => ({
      id: u.id,
      status: u.status,
      value: u.value,
      quote: u.quote,
      missing: u.missing,
      depth: u.depth,
    }));
  }

  // 2. メモを更新し、条件に合わない柱を対象外にする
  memo = applyUpdates(memo, updates, ctx.set);
  memo = markNotApplicable(ctx.set, memo);

  // 3. 質問・それた話のときは、直前の点を1回だけ聞き直してよい
  const last = memo.lastAction;
  const retryLast =
    (utterance === "question" || utterance === "off_topic") &&
    last?.kind === "ask" &&
    updates.length === 0 &&
    (memo.points[last.pointId]?.asked ?? 0) < 2;

  return askOrClose(ctx, deps, memo, {
    now,
    recent: input.recent.slice(-4),
    isOpening: false,
    utterance,
    updates,
    userWantsToEnd: utterance === "end",
    forced: retryLast && last?.kind === "ask" ? last : null,
  });
}

async function askOrClose(
  ctx: EngineContext,
  deps: EngineDeps,
  memoIn: AnswerMemo,
  opts: {
    now: Date;
    recent: TurnInput["recent"];
    isOpening: boolean;
    utterance: UtteranceKind | null;
    updates: PointUpdate[];
    userWantsToEnd?: boolean;
    forced?: Extract<Action, { kind: "ask" }> | null;
  }
): Promise<EngineResult> {
  const action =
    opts.forced ??
    planNextAction({
      set: ctx.set,
      memo: memoIn,
      now: opts.now,
      userWantsToEnd: opts.userWantsToEnd,
    });
  let memo = recordAction(memoIn, action);

  if (action.kind === "summary") {
    memo = { ...memo, shownChoices: [] };
    return {
      text: CLOSING_TEXTS[ctx.locale],
      quickReplies: null,
      action,
      memo,
      nextStage: "summary",
      pointId: null,
      pillarName: null,
      utterance: opts.utterance,
      updates: opts.updates,
    };
  }

  const found = findPoint(ctx.set, action.pointId);
  if (!found) throw new Error(`point not found: ${action.pointId}`);

  const respondTo =
    opts.utterance === "question" || opts.utterance === "off_topic"
      ? opts.utterance
      : null;
  const writerInput = {
    set: ctx.set,
    memo,
    action,
    languageName: ENGINE_LANGUAGE_NAMES[ctx.locale],
    material: ctx.material,
    recent: opts.recent,
    isOpening: opts.isOpening,
    respondTo,
  };

  let out = await deps.write(buildWriterPrompt(writerInput));
  let problem = checkWriterText(out.text, memo.askedTexts);
  if (problem && memo.rewrites < MAX_REWRITES_PER_INTERVIEW) {
    memo = { ...memo, rewrites: memo.rewrites + 1 };
    const retry = await deps.write(
      buildWriterPrompt({ ...writerInput, fixHint: CHECK_FIX_HINTS[problem] })
    );
    const retryProblem = checkWriterText(retry.text, memo.askedTexts);
    // 直した方が良くなっていれば使う（どちらもだめなら、空でない方）
    if (!retryProblem || problem === "empty") {
      out = retry;
      problem = retryProblem;
    }
  }

  // 選択肢は「最初の質問」のときだけ出す。訳の数が合わなければ元の文字を使う
  const choices = action.mode === "first" ? choicesOf(found.point) : [];
  const translated =
    out.quick_replies && out.quick_replies.length === choices.length
      ? out.quick_replies
      : choices.map((c) => c.label);
  const shownChoices: ShownChoice[] = choices.map((c, i) => ({
    shown: translated[i] ?? c.label,
    label: c.label,
    fills: c.fills,
  }));

  memo = {
    ...memo,
    shownChoices,
    askedTexts: [...memo.askedTexts, out.text.trim()],
  };

  return {
    text: out.text.trim(),
    quickReplies: shownChoices.length > 0 ? shownChoices.map((c) => c.shown) : null,
    action,
    memo,
    nextStage: "chat",
    pointId: action.pointId,
    pillarName: found.pillar.name,
    utterance: opts.utterance,
    updates: opts.updates,
  };
}
