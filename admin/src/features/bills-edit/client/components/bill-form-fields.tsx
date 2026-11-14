"use client";

import {
  BILL_PROPOSAL_TYPE_LABELS,
  type BillProposalType,
} from "@mirai-gikai/shared/bill-proposal-type/labels";
import { AlertTriangle } from "lucide-react";
import type { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ARTICLE_KIND_LABELS,
  type BillArticleKind,
  type BillStatus,
  HOUSE_LABELS,
  type OriginatingHouse,
} from "@/features/bills/shared/types";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import type { BillCreateInput } from "../../shared/types";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
import { ShareImageGenerator } from "./share-image-generator";
import { ThumbnailUpload } from "./thumbnail-upload";

const BILL_STATUS_OPTIONS: Array<{ value: BillStatus; label: string }> = [
  { value: "preparing", label: "準備中" },
  { value: "introduced", label: "提出済み" },
  { value: "in_originating_house", label: "審議中（提出院）" },
  { value: "in_receiving_house", label: "審議中（送付院）" },
  { value: "enacted", label: "成立" },
  { value: "rejected", label: "否決" },
];

const ORIGINATING_HOUSE_OPTIONS = Object.entries(HOUSE_LABELS).map(
  ([value, label]) => ({
    value: value as OriginatingHouse,
    label,
  })
);

// Select は空文字を値にできないため、未設定はこの値で表す
const PROPOSAL_TYPE_UNSET_VALUE = "unset";

const PROPOSAL_TYPE_OPTIONS = Object.entries(BILL_PROPOSAL_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as BillProposalType,
    label,
  })
);

const ARTICLE_KIND_OPTIONS = Object.entries(ARTICLE_KIND_LABELS).map(
  ([value, label]) => ({
    value: value as BillArticleKind,
    label,
  })
);

interface BillFormFieldsProps {
  control: Control<BillCreateInput>;
  billId?: string;
  dietSessions: DietSession[];
  shareImageDefaultTitle?: string;
}

export function BillFormFields({
  control,
  billId,
  dietSessions,
  shareImageDefaultTitle,
}: BillFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>トピック名 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              管理用のトピック名を入力してください（最大200文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="hidden">
        <div className="hidden">
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ステータス *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BILL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  現在の審議状況を選択してください
                </FormDescription>
                {shouldAutoCloseInterviewOnBillStatus(field.value) && (
                  <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded flex items-start gap-2">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <span>
                      保存すると、このトピックに紐づく公開中のインタビューは自動でクローズされます。
                    </span>
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="hidden">
          <FormField
            control={control}
            name="originating_house"
            render={({ field }) => (
              <FormItem>
                <FormLabel>提出院 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="提出院を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ORIGINATING_HOUSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  トピックを提出した議院を選択してください
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="hidden">
          <FormField
            control={control}
            name="proposal_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>トピックの種類</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(
                      PROPOSAL_TYPE_OPTIONS.find((o) => o.value === value)
                        ?.value ?? null
                    )
                  }
                  value={field.value ?? PROPOSAL_TYPE_UNSET_VALUE}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PROPOSAL_TYPE_UNSET_VALUE}>
                      未設定
                    </SelectItem>
                    {PROPOSAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  内閣が提出した閣法か、議員が提出した議員立法かを選択してください。未設定の場合は公開サイトや速報画像に表示しません
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="hidden">
        <FormField
          control={control}
          name="status_note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ステータス備考</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                審議状況の詳細や補足情報を入力してください（最大500文字）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="hidden">
        <FormField
          control={control}
          name="submitted_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>登録日 *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                トピックの提出日を設定してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>サムネイル画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
              />
            </FormControl>
            <FormDescription>
              トピックのサムネイル画像を設定してください（任意）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="share_thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>シェア用OGP画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
                storagePrefix="share"
              />
            </FormControl>
            <FormDescription>
              Twitter等のSNSでシェアされた際に表示される画像を設定してください（任意）。設定しない場合はサムネイル画像が使用されます。
            </FormDescription>
            <FormMessage />
            {billId && shareImageDefaultTitle !== undefined && (
              <ShareImageGenerator
                billId={billId}
                defaultTitle={shareImageDefaultTitle}
                onGenerated={field.onChange}
              />
            )}
          </FormItem>
        )}
      />

      <div className="hidden">
        <FormField
          control={control}
          name="shugiin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>衆議院URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="https://www.shugiin.go.jp/..."
                />
              </FormControl>
              <FormDescription>
                衆議院のトピックページURLを入力してください（「これから掲載されるトピック」表示時に外部リンクとして使用）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="japanese-tableware"
              />
            </FormControl>
            <FormDescription>
              コンテンツ同期用の識別子です（最大200文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="hidden">
        <FormField
          control={control}
          name="diet_session_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>国会会期</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="国会会期を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dietSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}（{session.start_date}〜{session.end_date}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                トピックが提出された国会会期を選択してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="is_featured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>注目のトピック</FormLabel>
              <FormDescription>
                トップページなどで優先的に表示されます
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="is_review_completed"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>記事レビュー完了</FormLabel>
              <FormDescription>
                未完了の場合、記事にレビュー中バナーが表示されます
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="article_kind"
        render={({ field }) => (
          <FormItem>
            <FormLabel>記事の種別</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="記事の種別を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ARTICLE_KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              AI自動生成版は、人のレビューを経ていない記事として表示されます。レビュー後に通常版へ戻す場合は「記事レビュー完了」もオンにしてください
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="knowledge_source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ナレッジソース</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="トピックの補足情報や、調査で確かめたい仮説などを入力"
                className="min-h-[200px] resize-y"
              />
            </FormControl>
            <FormDescription>
              AIインタビュー（常時参照）と、AIチャット（下のトグルで参照可否を切替）で使われる補足情報です。最大40,000文字。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="use_knowledge_source_in_chat"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>AIチャットでもナレッジソースを使用する</FormLabel>
              <FormDescription>
                ONにすると、トピックページのAIチャットのシステムプロンプトに上のナレッジソースが追加されます。AIインタビューでは常に使用されます。
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
