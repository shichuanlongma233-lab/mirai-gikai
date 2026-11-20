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
  title: "利用規約 | TENJOインタビュー",
  description: "TENJOインタビューの利用規約",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="利用規約"
      enLabel="Terms of Service"
      description="TENJOインタビューをご利用いただくにあたっての基本的なルールを定めています。"
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-10">
        <LegalParagraph className="text-right">
          制定日：{OPERATOR.enactedOn}
        </LegalParagraph>

        <LegalParagraph>
          この利用規約（以下「本規約」）は、{OPERATOR.name}
          （以下「運営者」）が提供する「TENJOインタビュー」（以下「本サービス」）の利用条件を定めるものです。本サービスを利用した方は、本規約に同意したものとみなします。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>第1条（本サービスの内容）</LegalSectionTitle>
          <LegalParagraph>
            本サービスは、日本の文化・商品・サービス（以下「トピック」）について、AIが利用者に質問し、感想や意見を伺う市場調査のためのインタビューサービスです。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第2条（利用条件）</LegalSectionTitle>
          <LegalList
            ordered
            items={[
              "利用者は、会員登録せずに本サービスを利用できます。",
              "16歳未満の方は、保護者の同意を得たうえで利用してください。",
              "利用者は、自分の意見を、自分の言葉で答えるものとします。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第3条（禁止事項）</LegalSectionTitle>
          <LegalParagraph>
            利用者は、次の行為をしてはなりません。
          </LegalParagraph>
          <LegalList
            ordered
            items={[
              "法令または公序良俗に反する行為",
              "他人の個人情報、名誉、プライバシー、知的財産を侵害する行為",
              "差別的、暴力的、卑猥な内容の投稿",
              "自動プログラムによる大量の回答、なりすまし、虚偽の回答を意図的に繰り返す行為",
              "本サービスの運営を妨げる行為、または不正アクセス",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第4条（回答内容の利用）</LegalSectionTitle>
          <LegalList
            ordered
            items={[
              "運営者は、利用者の回答内容を、トピックに関わる商品づくり、海外展開の検討、情報発信のための市場調査に利用します。",
              "運営者は、個人を特定できない形に加工した集計結果や要約を、トピックに関わる事業者に共有し、または公表することがあります。",
              "利用者が回答時に公開に同意した場合に限り、回答の要約を本サービス上で公開することがあります。",
              "利用者は、運営者が前各項の範囲で回答内容を無償で利用することを許諾します。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第5条（AIの利用について）</LegalSectionTitle>
          <LegalList
            ordered
            items={[
              "本サービスの質問、翻訳、要約はAIが自動で作成します。内容の正確さを保証するものではありません。",
              "AIがトピックについて答える内容は、運営者が用意した資料の範囲に限られます。購入や利用の判断は、公式の情報もご確認ください。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第6条（免責）</LegalSectionTitle>
          <LegalList
            ordered
            items={[
              "運営者は、本サービスの内容を予告なく変更し、または提供を中断・終了することがあります。",
              "運営者は、本サービスの利用により利用者に生じた損害について、運営者に故意または重大な過失がある場合を除き、責任を負いません。",
              "本サービスは、チームみらいが公開している「みらい議会」のソースコードをもとに運営者が独自に運営するものです。これは政党チームみらいが運営しているものではありません。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第7条（規約の変更）</LegalSectionTitle>
          <LegalParagraph>
            運営者は、必要に応じて本規約を変更できます。変更後の規約は、本サービス上に掲示した時点から効力を生じます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第8条（準拠法・管轄）</LegalSectionTitle>
          <LegalParagraph>
            本規約は日本法に準拠します。本サービスに関する紛争は、
            {OPERATOR.court}
            を第一審の専属的合意管轄裁判所とします。
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
