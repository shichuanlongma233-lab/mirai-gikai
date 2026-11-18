import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { OPERATOR } from "@/config/operator";

export const metadata: Metadata = {
  title: "プライバシーポリシー | TENJOインタビュー",
  description: "TENJOインタビューのプライバシーポリシー",
};

function Item({ label, children }: { label: string; children: string }) {
  return (
    <>
      <span className="font-semibold text-slate-800">{label}：</span>
      {children}
    </>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      className="bg-transparent pt-24 md:pt-12"
      title="プライバシーポリシー"
      enLabel="Privacy Policy"
      description={`${OPERATOR.name}（以下「運営者」）は、「TENJOインタビュー」（以下「本サービス」）における利用者の情報を、次のとおり取り扱います。`}
    >
      <Container className="space-y-8">
        <p className="text-sm text-mirai-text-muted">
          制定日：{OPERATOR.enactedOn}
        </p>

        <section className="space-y-4">
          <LegalSectionTitle>1. 取得する情報</LegalSectionTitle>
          <LegalList
            items={[
              {
                id: "answers",
                content: (
                  <Item label="インタビューの回答とチャットのやりとり">
                    AIとの会話の内容、選択した評価や立場、レポートの内容
                  </Item>
                ),
              },
              {
                id: "anonymous-id",
                content: (
                  <Item label="匿名の識別子">
                    ログイン不要で利用できるように、端末ごとに発行する匿名のIDです。氏名などとは結びつけません。
                  </Item>
                ),
              },
              {
                id: "cookie",
                content: (
                  <Item label="Cookie等">
                    表示言語の設定、ふりがな表示の設定、匿名IDの保持のために使います。
                  </Item>
                ),
              },
              {
                id: "access",
                content: (
                  <Item label="アクセス情報">
                    IPアドレス、ブラウザの種類、アクセス日時など、サービスの運用や不正防止に必要な技術情報
                  </Item>
                ),
              },
              {
                id: "optional",
                content: (
                  <Item label="任意でご提供いただく情報">
                    専門家としての登録を希望された場合の氏名、所属、メールアドレス
                  </Item>
                ),
              },
            ]}
          />
          <LegalParagraph>
            回答の中に、氏名、住所、連絡先などの個人を特定できる情報を書かないようお願いします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>2. 利用目的</LegalSectionTitle>
          <LegalList
            items={[
              "日本の文化や商品に対する海外の方の感想、関心、購入意向などを把握する市場調査のため",
              "回答の集計、分析、レポートの作成のため",
              "本サービスの提供、改善、不具合の対応のため",
              "不正利用の防止、安全の確保のため",
              "専門家登録をされた方への連絡のため",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>3. AI事業者への提供</LegalSectionTitle>
          <LegalParagraph>
            本サービスは、質問の作成、回答への応答、要約、翻訳のために、外部のAIサービス（Google
            LLCのGeminiなど）を利用します。そのため、回答やチャットの内容がこれらの事業者に送信されます。本サービスはテスト版で、GoogleのGemini
            APIを無料枠で利用しています。無料枠では、送信された内容がGoogleのサービス改善（AIの学習を含みます）に使われ、Googleの担当者が内容を確認することがあります。回答には、個人を特定できる情報や秘密にしたい情報を書かないでください。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            4. 外国にある第三者への提供（海外移転）
          </LegalSectionTitle>
          <LegalParagraph>
            AIサービスやサーバー（Google、Supabase、Vercelなど）の一部は、日本国外（主に米国）にあります。これらの事業者は、それぞれの個人情報保護の方針と安全管理の措置にもとづいて情報を取り扱います。各国の個人情報保護制度については、個人情報保護委員会の公表資料をご覧ください。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>5. 第三者への提供</LegalSectionTitle>
          <LegalParagraph>
            運営者は、次の場合を除き、取得した情報を第三者に提供しません。
          </LegalParagraph>
          <LegalList
            items={[
              "本人の同意がある場合",
              "個人を特定できない形に加工した集計結果を、調査の依頼者や事業者に提供する場合",
              "法令にもとづく場合",
            ]}
          />
          <LegalParagraph>
            回答の内容をそのまま公開するのは、インタビューの最後に公開への同意をいただいた場合に限ります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>6. 保存期間</LegalSectionTitle>
          <LegalParagraph>
            {`インタビューの回答とチャットのやりとりは、${OPERATOR.retention}保存し、その後は削除するか、個人を特定できない形に加工します。専門家登録の情報は、登録の取り消しのお申し出があるまで保存します。`}
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>7. 安全管理</LegalSectionTitle>
          <LegalParagraph>
            運営者は、アクセス権限の管理、通信の暗号化など、情報の漏えいや紛失を防ぐための措置をとります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            8. 開示・訂正・削除のご請求について
          </LegalSectionTitle>
          <LegalParagraph>
            本サービスはテスト版のため、個別のお問い合わせ窓口は設けていません。回答は匿名で受け付けており、ご本人であることを確認できないため、開示、訂正、削除のご請求には対応できないことがあります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>9. 改定</LegalSectionTitle>
          <LegalParagraph>
            本ポリシーは、必要に応じて改定することがあります。重要な変更がある場合は、本サービス上でお知らせします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>10. 運営者</LegalSectionTitle>
          <LegalParagraph>
            {OPERATOR.name}
            <br />
            {OPERATOR.contact ||
              "テスト版のため、お問い合わせ窓口はありません。"}
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
