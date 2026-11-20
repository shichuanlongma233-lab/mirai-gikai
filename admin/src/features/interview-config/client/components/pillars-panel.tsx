"use client";

import {
  aggregateOf,
  normalizeChoice,
  orderedPillars,
  type PillarIssue,
  type PillarSet,
  pillarSetToCsv,
  validatePillarSet,
} from "@mirai-gikai/shared/pillars";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  checkPillars,
  type PillarSource,
  type QuestionEngine,
  savePillars,
  setQuestionEngine,
} from "../../server/actions/save-pillars";

interface PillarsPanelProps {
  configId: string;
  /** 保存済みの柱（未保存なら null） */
  savedPillars: unknown;
  savedVersion: number;
  engine: QuestionEngine;
}

const ANSWER_TYPE_LABELS: Record<string, string> = {
  free: "自由",
  choice: "選択",
  number: "数値",
  scale: "5段階",
};
const AGGREGATE_LABELS: Record<string, string> = {
  ratio: "割合",
  median: "中央値",
  summary: "要約",
};

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 質問の柱（回答メモ方式）の取り込み・確認・保存・書き出しと、進め方の切り替え。
 */
export function PillarsPanel({
  configId,
  savedPillars,
  savedVersion,
  engine: initialEngine,
}: PillarsPanelProps) {
  const router = useRouter();
  const saved = useMemo(() => {
    if (!savedPillars) return null;
    const r = validatePillarSet(savedPillars);
    return r.ok ? r.set : null;
  }, [savedPillars]);

  const [engine, setEngine] = useState<QuestionEngine>(initialEngine);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [text, setText] = useState("");
  const [meta, setMeta] = useState({
    goal: saved?.goal ?? "",
    audience: saved?.audience ?? "",
    durationMinutes: saved?.durationMinutes ?? 10,
    avoid: (saved?.avoid ?? []).join("\n"),
  });
  const [preview, setPreview] = useState<PillarSet | null>(null);
  const [issues, setIssues] = useState<PillarIssue[]>([]);
  const [isPending, startTransition] = useTransition();
  const idBase = useId();

  const source = (): PillarSource =>
    format === "json"
      ? { kind: "json", text }
      : {
          kind: "csv",
          text,
          meta: {
            goal: meta.goal,
            audience: meta.audience,
            durationMinutes: Number(meta.durationMinutes) || 10,
            avoid: meta.avoid
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        };

  const handleCheck = () =>
    startTransition(async () => {
      const r = await checkPillars(source());
      setIssues(r.issues);
      setPreview(r.ok ? r.set : null);
      if (r.ok) toast.success("取り込めます。内容を確かめて保存してください");
      else toast.error("直すところがあります");
    });

  const handleSave = () =>
    startTransition(async () => {
      const r = await savePillars(configId, source());
      if (r.success) {
        toast.success(`柱を保存しました（第${r.version}版）`);
        setText("");
        setPreview(null);
        setIssues(r.issues);
        router.refresh();
      } else {
        toast.error(r.error);
        if (r.issues) setIssues(r.issues);
      }
    });

  const handleEngine = (next: QuestionEngine) =>
    startTransition(async () => {
      const r = await setQuestionEngine(configId, next);
      if (r.success) {
        setEngine(next);
        toast.success(
          next === "memo"
            ? "回答メモ方式に切り替えました"
            : "従来の進め方に戻しました"
        );
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFormat(file.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
    setPreview(null);
    setIssues([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>質問の柱（回答メモ方式）</CardTitle>
        <CardDescription>
          聞きたい点ごとに「答えた／一部／まだ」を記録しながら進める新しい方式です。
          柱を取り込んで保存し、下のスイッチで切り替えます。従来の質問リストはそのまま残ります。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <div className="text-sm font-medium">質問の進め方</div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={engine === "classic" ? "default" : "outline"}
              disabled={isPending || engine === "classic"}
              onClick={() => handleEngine("classic")}
            >
              従来（質問リスト）
            </Button>
            <Button
              type="button"
              size="sm"
              variant={engine === "memo" ? "default" : "outline"}
              disabled={isPending || engine === "memo" || !saved}
              onClick={() => handleEngine("memo")}
            >
              回答メモ方式（柱）
            </Button>
          </div>
          {!saved && (
            <p className="text-xs text-gray-500">
              回答メモ方式は、柱を保存すると選べます。
            </p>
          )}
        </section>

        {saved && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                保存済みの柱（第{savedVersion}版）
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    download(
                      "pillars.json",
                      `${JSON.stringify(saved, null, 2)}\n`,
                      "application/json"
                    )
                  }
                >
                  JSONで書き出す
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    download(
                      "pillars.csv",
                      `﻿${pillarSetToCsv(saved)}`,
                      "text/csv"
                    )
                  }
                >
                  CSVで書き出す
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFormat("json");
                    setText(JSON.stringify(saved, null, 2));
                    setPreview(null);
                    setIssues([]);
                  }}
                >
                  直す
                </Button>
              </div>
            </div>
            <PillarTable set={saved} />
          </section>
        )}

        <section className="space-y-3">
          <div className="text-sm font-medium">取り込む</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={format === "json" ? "default" : "outline"}
              onClick={() => setFormat("json")}
            >
              JSON
            </Button>
            <Button
              type="button"
              size="sm"
              variant={format === "csv" ? "default" : "outline"}
              onClick={() => setFormat("csv")}
            >
              CSV
            </Button>
            <Input
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="max-w-xs"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {format === "csv" && (
            <div className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-2">
              <p className="text-xs text-gray-500 md:col-span-2">
                CSVには調査全体の項目が入らないので、ここで入れてください。
              </p>
              <div className="text-xs">
                <label htmlFor={`${idBase}-goal`}>調査の目的（goal）</label>
                <Input
                  id={`${idBase}-goal`}
                  value={meta.goal}
                  onChange={(e) => setMeta({ ...meta, goal: e.target.value })}
                />
              </div>
              <div className="text-xs">
                <label htmlFor={`${idBase}-audience`}>対象者（audience）</label>
                <Input
                  id={`${idBase}-audience`}
                  value={meta.audience}
                  onChange={(e) =>
                    setMeta({ ...meta, audience: e.target.value })
                  }
                />
              </div>
              <div className="text-xs">
                <label htmlFor={`${idBase}-durationMinutes`}>
                  目安の時間（分）
                </label>
                <Input
                  id={`${idBase}-durationMinutes`}
                  type="number"
                  min={1}
                  max={60}
                  value={meta.durationMinutes}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="text-xs">
                <label htmlFor={`${idBase}-avoid`}>
                  避けること（1行に1つ）
                </label>
                <Textarea
                  id={`${idBase}-avoid`}
                  rows={2}
                  value={meta.avoid}
                  onChange={(e) => setMeta({ ...meta, avoid: e.target.value })}
                />
              </div>
            </div>
          )}

          <Textarea
            rows={10}
            className="font-mono text-xs"
            placeholder={
              format === "json"
                ? "外で作った柱のJSONを貼り付けるか、ファイルを選んでください"
                : "pillar_id,pillar_name,intent,... の見出し行から貼り付けるか、ファイルを選んでください"
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !text.trim()}
              onClick={handleCheck}
            >
              確認する
            </Button>
            <Button
              type="button"
              disabled={isPending || !preview}
              onClick={handleSave}
            >
              保存する
            </Button>
          </div>

          {issues.length > 0 && (
            <ul className="space-y-1 text-sm">
              {issues.map((i) => (
                <li
                  key={`${i.path}-${i.message}`}
                  className={
                    i.level === "error" ? "text-red-700" : "text-amber-700"
                  }
                >
                  {i.level === "error" ? "要修正" : "注意"}
                  {i.path ? `（${i.path}）` : ""}: {i.message}
                </li>
              ))}
            </ul>
          )}

          {preview && (
            <div className="space-y-2">
              <div className="text-sm font-medium">取り込む内容</div>
              <PillarTable set={preview} />
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function PillarTable({ set }: { set: PillarSet }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-gray-600">
        目的: {set.goal} ／ 対象: {set.audience} ／ 目安 {set.durationMinutes}分
        {set.avoid.length > 0 && ` ／ 避けること: ${set.avoid.join("・")}`}
      </div>
      {orderedPillars(set).map((pillar, i) => (
        <div key={pillar.id} className="rounded border">
          <div className="border-b bg-gray-50 px-3 py-2">
            <span className="font-semibold">
              {i + 1}. {pillar.name}
            </span>
            {!pillar.required && (
              <span className="ml-2 text-xs text-gray-500">任意</span>
            )}
            {pillar.askIf && (
              <span className="ml-2 text-xs text-blue-700">
                条件: {pillar.askIf}
              </span>
            )}
            <div className="text-xs text-gray-600">{pillar.intent}</div>
          </div>
          <table className="w-full text-xs">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-3 py-1">聞きたい点</th>
                <th className="px-3 py-1">質問文</th>
                <th className="px-3 py-1">答えたとみなす条件</th>
                <th className="px-3 py-1">型・選択肢</th>
                <th className="px-3 py-1">深掘り</th>
              </tr>
            </thead>
            <tbody>
              {pillar.points.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="px-3 py-1">
                    {p.name}
                    <div className="text-gray-400">{p.id}</div>
                    {!p.required && <div className="text-gray-500">任意</div>}
                  </td>
                  <td className="px-3 py-1">{p.question}</td>
                  <td className="px-3 py-1">{p.answeredWhen}</td>
                  <td className="px-3 py-1">
                    {ANSWER_TYPE_LABELS[p.answerType]}
                    {p.unit ? `（${p.unit}）` : ""}・
                    {AGGREGATE_LABELS[aggregateOf(p)]}
                    {p.choices.length > 0 && (
                      <div className="text-gray-600">
                        {p.choices
                          .map((c) => normalizeChoice(c, p.id).label)
                          .join(" / ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1">
                    {p.followUp.max}回
                    {p.followUp.ask && (
                      <div className="text-gray-600">{p.followUp.ask}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
