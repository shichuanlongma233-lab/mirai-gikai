"use client";

import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropzone } from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  arrayToText,
  textToArray,
} from "@/features/interview-config/shared/utils/array-text-conversion";
import { routes } from "@/lib/routes";
import type { TopicDraftGenerationResponse } from "../../server/services/handle-topic-draft-generation";
import { createTopicFromDraft } from "../../server/actions/create-topic-from-draft";
import type { TopicDraft } from "../../shared/schemas";
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_FILE_SIZE,
} from "../../shared/utils/document-file";

const MAX_FILES = 5;

/** 画面で編集する質問。並べ替え・削除のために一意な key を持たせる */
type EditableQuestion = {
  key: string;
  question: string;
  follow_up_guide: string;
  quickRepliesText: string;
};

type EditableDraft = Omit<TopicDraft, "themes" | "questions"> & {
  themesText: string;
  questions: EditableQuestion[];
};

function toEditableDraft(draft: TopicDraft): EditableDraft {
  return {
    name: draft.name,
    title: draft.title,
    summary: draft.summary,
    content: draft.content,
    config_name: draft.config_name,
    themesText: arrayToText(draft.themes),
    questions: draft.questions.map((q) => ({
      key: crypto.randomUUID(),
      question: q.question,
      follow_up_guide: q.follow_up_guide,
      quickRepliesText: arrayToText(q.quick_replies),
    })),
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function TopicFromDocumentForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableDraft | null>(null);
  const [knowledgeSource, setKnowledgeSource] = useState("");
  const [truncated, setTruncated] = useState(false);

  const canGenerate =
    !isGenerating && (files.length > 0 || pastedText.trim().length > 0);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      formData.append("text", pastedText);
      formData.append("instructions", instructions);

      const res = await fetch("/api/topic-from-document/generate", {
        method: "POST",
        body: formData,
      });
      const result = (await res
        .json()
        .catch(() => null)) as TopicDraftGenerationResponse | null;
      if (!result) {
        setError(`生成に失敗しました（${res.status}）`);
        return;
      }
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDraft(toEditableDraft(result.draft));
      setKnowledgeSource(result.knowledgeSource);
      setTruncated(result.truncated);
    } catch {
      setError("生成中に通信エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateDraft = (patch: Partial<EditableDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateQuestion = (key: string, patch: Partial<EditableQuestion>) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.key === key ? { ...q, ...patch } : q
            ),
          }
        : prev
    );

  const handleSave = () => {
    if (!draft) return;
    setError(null);
    startSaving(async () => {
      const result = await createTopicFromDraft({
        name: draft.name,
        title: draft.title,
        summary: draft.summary,
        content: draft.content,
        config_name: draft.config_name,
        themes: textToArray(draft.themesText),
        questions: draft.questions.map((q) => ({
          question: q.question,
          follow_up_guide: q.follow_up_guide,
          quick_replies: textToArray(q.quickRepliesText),
        })),
        knowledge_source: knowledgeSource,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("トピックとインタビュー設定を作成しました");
      router.push(
        routes.billInterviewEdit(result.data.billId, result.data.configId)
      );
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. 資料を読み込む</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            PDF・テキスト・Markdown の資料を読み込むと、AI
            がトピックの記事とインタビューの質問を下書きします。下書きは保存前に編集できます。
          </p>
          <Dropzone
            onFilesAccepted={setFiles}
            maxFiles={MAX_FILES}
            maxSize={MAX_DOCUMENT_FILE_SIZE}
            accept={DOCUMENT_ACCEPT}
            disabled={isGenerating}
          />
          <div className="space-y-2">
            <Label htmlFor="pasted-text">テキストを貼り付け（任意）</Label>
            <Textarea
              id="pasted-text"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Webページの本文やメモなど、ファイル以外の資料を貼り付けられます"
              rows={6}
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">AIへの追加の指示（任意）</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="例: 子育て世帯の声を重点的に聞きたい／質問は6問にしてほしい"
              rows={3}
              disabled={isGenerating}
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {isGenerating
              ? "生成中...（1〜2分かかります）"
              : draft
                ? "もう一度生成する"
                : "AIで下書きを生成"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="whitespace-pre-wrap rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {draft && (
        <>
          {truncated && (
            <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
              資料が長いため、後半の一部を省いて生成しました。
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>2. トピック（記事）を確認する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">トピック名</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">記事タイトル</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">要約</Label>
                <Textarea
                  id="summary"
                  value={draft.summary}
                  onChange={(e) => updateDraft({ summary: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">本文（Markdown）</Label>
                <Textarea
                  id="content"
                  value={draft.content}
                  onChange={(e) => updateDraft({ content: e.target.value })}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">
                  ナレッジソース（読み込んだ資料の本文。インタビューAIが参照します）
                </summary>
                <Textarea
                  value={knowledgeSource}
                  onChange={(e) => setKnowledgeSource(e.target.value)}
                  rows={10}
                  className="mt-2 font-mono text-xs"
                />
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. インタビューを確認する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="config-name">インタビュー設定名</Label>
                <Input
                  id="config-name"
                  value={draft.config_name}
                  onChange={(e) => updateDraft({ config_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themes">テーマ（1行に1つ）</Label>
                <Textarea
                  id="themes"
                  value={draft.themesText}
                  onChange={(e) => updateDraft({ themesText: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                {draft.questions.map((q, index) => (
                  <div key={q.key} className="space-y-2 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        Q{index + 1}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="上へ"
                          disabled={index === 0}
                          onClick={() =>
                            updateDraft({
                              questions: moveItem(
                                draft.questions,
                                index,
                                index - 1
                              ),
                            })
                          }
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="下へ"
                          disabled={index === draft.questions.length - 1}
                          onClick={() =>
                            updateDraft({
                              questions: moveItem(
                                draft.questions,
                                index,
                                index + 1
                              ),
                            })
                          }
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="削除"
                          onClick={() =>
                            updateDraft({
                              questions: draft.questions.filter(
                                (item) => item.key !== q.key
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Label htmlFor={`question-${q.key}`}>質問文</Label>
                    <Textarea
                      id={`question-${q.key}`}
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(q.key, { question: e.target.value })
                      }
                      rows={2}
                    />
                    <Label htmlFor={`guide-${q.key}`}>フォローアップ指針</Label>
                    <Textarea
                      id={`guide-${q.key}`}
                      value={q.follow_up_guide}
                      onChange={(e) =>
                        updateQuestion(q.key, {
                          follow_up_guide: e.target.value,
                        })
                      }
                      rows={3}
                    />
                    <Label htmlFor={`replies-${q.key}`}>
                      クイックリプライ（1行に1つ。空欄なら自由回答）
                    </Label>
                    <Textarea
                      id={`replies-${q.key}`}
                      value={q.quickRepliesText}
                      onChange={(e) =>
                        updateQuestion(q.key, {
                          quickRepliesText: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateDraft({
                      questions: [
                        ...draft.questions,
                        {
                          key: crypto.randomUUID(),
                          question: "",
                          follow_up_guide: "",
                          quickRepliesText: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  質問を追加
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "作成中..."
                : "この内容でトピックとインタビューを作成"}
            </Button>
            <p className="text-sm text-gray-600">
              トピックは下書き、インタビューは非公開で作成されます。作成後にインタビュー設定画面へ移動します。
            </p>
          </div>
        </>
      )}
    </div>
  );
}
