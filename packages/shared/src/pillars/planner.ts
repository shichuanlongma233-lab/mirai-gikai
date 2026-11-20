import type { Action, AnswerMemo } from "./memo";
import { pillarApplies, pointMemoOf } from "./memo";
import { findPoint, orderedPoints, type PillarSet } from "./schema";

/** 設定時間を超えてよい分 */
const OVERTIME_MINUTES = 3;
/** 1回のインタビューの往復の上限 */
const MAX_TURNS = 25;
/** 残りがこれより少ないと、深掘りと任意の点を省く */
const SHORT_ON_TIME_MINUTES = 2;

export interface PlanInput {
  set: PillarSet;
  memo: AnswerMemo;
  now: Date;
  /** 回答者が終わりたいと言った */
  userWantsToEnd?: boolean;
}

export function elapsedMinutes(memo: AnswerMemo, now: Date): number {
  return (now.getTime() - new Date(memo.startedAt).getTime()) / 60000;
}

/**
 * 進行係。回答メモだけを見て次の一手をルールで決める（AIは使わない）。
 * 上から順に当てはまったものを選ぶ:
 * 1. 回答者が終わりたい → まとめ
 * 2. 時間（設定+3分）か往復数（25）を超えた → まとめ
 * 3. 直前の点が「一部」で、深掘りの上限内 → 足りない部分を聞く
 * 4. 直前の点が「答えた」が浅く、深掘りの上限内で時間もある → 理由を聞く
 * 5. 設定順で、条件(askIf)に合う点のうち、
 *    自分から話して「一部」になった点 → 足りない部分 / まだの点 → 最初の質問
 * 6. 残りなし → まとめ
 */
export function planNextAction({
  set,
  memo,
  now,
  userWantsToEnd,
}: PlanInput): Action {
  if (userWantsToEnd) return { kind: "summary", reason: "user_end" };

  const elapsed = elapsedMinutes(memo, now);
  if (elapsed > set.durationMinutes + OVERTIME_MINUTES || memo.turns >= MAX_TURNS) {
    return { kind: "summary", reason: "time" };
  }
  const shortOnTime = set.durationMinutes - elapsed < SHORT_ON_TIME_MINUTES;

  const last = memo.lastAction;
  if (last?.kind === "ask" && !shortOnTime) {
    const found = findPoint(set, last.pointId);
    const pm = pointMemoOf(memo, last.pointId);
    if (found && pm.followUps < found.point.followUp.max) {
      if (pm.status === "partial") {
        return { kind: "ask", pointId: last.pointId, mode: "missing" };
      }
      if (
        pm.status === "answered" &&
        pm.depth === "shallow" &&
        last.mode !== "reason"
      ) {
        return { kind: "ask", pointId: last.pointId, mode: "reason" };
      }
    }
  }

  for (const { pillar, point } of orderedPoints(set)) {
    const pm = pointMemoOf(memo, point.id);
    if (!pillarApplies(pillar.askIf, memo)) continue;
    // 自分から話して一部だけ埋まった点は、足りない部分だけを聞く
    if (pm.status === "partial" && pm.asked === 0 && !shortOnTime) {
      return { kind: "ask", pointId: point.id, mode: "missing" };
    }
    if (pm.status !== "unasked") continue;
    // 一度聞いて答えが出なかった点は、もう一度同じことを聞かない
    if (pm.asked > 0) continue;
    if (shortOnTime && (!pillar.required || !point.required)) continue;
    return { kind: "ask", pointId: point.id, mode: "first" };
  }

  return { kind: "summary", reason: "done" };
}

/** 決めた一手をメモに記録する（元のメモは変えない） */
export function recordAction(memo: AnswerMemo, action: Action): AnswerMemo {
  const next: AnswerMemo = structuredClone(memo);
  next.lastAction = action;
  if (action.kind === "ask") {
    const pm = pointMemoOf(next, action.pointId);
    next.points[action.pointId] = {
      ...pm,
      asked: pm.asked + 1,
      followUps: action.mode === "first" ? pm.followUps : pm.followUps + 1,
    };
  }
  return next;
}
