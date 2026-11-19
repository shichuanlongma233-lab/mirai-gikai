#!/usr/bin/env node
/**
 * 集計ダッシュボード確認用の「架空の回答」を入れる / 消すスクリプト。
 *
 *   node scripts/seed-demo-insights.mjs <envファイル>          … 入れる
 *   node scripts/seed-demo-insights.mjs <envファイル> --delete … 消す
 *   node scripts/seed-demo-insights.mjs <envファイル> --add-profiles … 入れ済みの架空データに国・年代を付ける
 *
 * envファイルには NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY が必要。
 * 入れた行は interview_sessions.langfuse_session_id = "seed-demo-insights" で見分ける
 * （消すときはこの印のついたセッションだけを消す。メッセージとレポートは連動して消える）。
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const MARK = "seed-demo-insights";
const [envPath, flag] = process.argv.slice(2);
if (!envPath) {
  console.error("使い方: node scripts/seed-demo-insights.mjs <envファイル> [--delete|--add-profiles]");
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SECRET_KEY;
if (!URL_ || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL か SUPABASE_SECRET_KEY が見つかりません");
  process.exit(1);
}

async function rest(method, path, body) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const BILLS = {
  kutani: "9ba37cbe-37a4-44d4-84aa-d25a8a6fbe8f",
  kintsugi: "655a0834-e50e-4e45-90dc-e007ed8416dc",
};

// [言語, スタンス, 要約(日本語), [AIの質問, 回答] の組]
const DATA = {
  kutani: [
    ["en", "for", "鮮やかな色絵に強く惹かれ、自宅用に小皿を買いたい。価格は手描きなら妥当と感じる。", [
      ["What was your first impression of Kutani-ware?", "Wow, the colors are so bold! The deep green and yellow look like a painting, not just a plate."],
      ["Would you want to own one?", "Yes, I'd definitely buy a small plate for my apartment. Maybe for sweets or as decoration."],
      ["How do you feel about the price range of 5,000 to 20,000 yen?", "For hand-painted pieces that's fair. I pay similar for handmade ceramics back home in the US."],
    ]],
    ["en", "conditional_for", "デザインは好きだが、食洗機や電子レンジに使えるかが購入の条件。", [
      ["What did you think of the designs?", "Really beautiful, especially the bird patterns."],
      ["Is there anything that would stop you from buying?", "Honestly I need to know if it's dishwasher safe. If I have to hand-wash everything I probably won't use it daily."],
      ["Would you give it as a gift?", "Maybe, as a wedding gift it would be nice, but shipping fragile items worries me."],
    ]],
    ["en", "for", "ギフトとして最適だと感じた。物語（職人・歴史）を添えると価値が伝わる。", [
      ["How would you use Kutani-ware?", "I'd give it as a gift to my parents. They love Japanese culture."],
      ["What would make it more appealing?", "A small card explaining the artisan and the history. The story is what makes it special as a present."],
      ["What about the price?", "A bit expensive for me personally, but for a gift it's okay."],
    ]],
    ["en", "neutral", "華やかすぎて自分の食卓には合わない。シンプルな柄があれば検討する。", [
      ["What was your first impression?", "It's impressive but a little too busy for my taste. My kitchen is very minimalist."],
      ["Would a different design change your mind?", "If there were simpler patterns, like just one color, I might consider it."],
      ["Would you buy it now?", "Probably not right now."],
    ]],
    ["zh", "for", "色彩と金彩に高級感を感じ、お土産や贈答品として買いたい。価格はむしろ安いと感じる。", [
      ["您对九谷烧的第一印象是什么？", "颜色非常华丽，金色的部分很有高级感，很适合送礼。"],
      ["您会购买吗？", "会的，我会买来送给长辈，作为日本旅行的伴手礼。"],
      ["价格方面您怎么看？", "和中国的高端瓷器相比，这个价格其实挺便宜的。"],
    ]],
    ["zh", "for", "収集したい。限定品や作家物があれば高くても買う。", [
      ["您觉得九谷烧怎么样？", "我很喜欢，尤其是有作家签名的作品。"],
      ["什么会让您更想买？", "如果有限定款或者编号的作品，我愿意花更多钱收藏。"],
      ["您会在网上买吗？", "会，但希望有中文说明和安全的包装。"],
    ]],
    ["zh", "conditional_against", "割れやすさと海外配送の不安から、購入をためらう。", [
      ["您的第一印象是？", "很漂亮，但看起来很容易碎。"],
      ["您会购买吗？", "我担心寄到国外会摔坏，而且运费可能很贵。"],
      ["怎样才能让您放心？", "如果有破损包赔和专业包装，我会考虑。"],
    ]],
    ["ko", "for", "手描きの繊細さに感動。韓国の青磁とは違う華やかさが新鮮で、自分用に欲しい。", [
      ["구타니야키의 첫인상은 어떠셨나요?", "손으로 그린 그림이 정말 섬세해서 감동했어요. 한국 청자와는 다른 화려함이 새로워요."],
      ["사고 싶으신가요?", "네, 작은 접시나 찻잔을 제 것으로 사고 싶어요."],
      ["가격은 어떻게 생각하세요?", "조금 비싸지만 수공예품이니까 괜찮은 것 같아요."],
    ]],
    ["ko", "neutral", "興味はあるが用途が思い浮かばない。使い方の提案が欲しい。", [
      ["어떻게 사용하실 것 같나요?", "예쁘긴 한데 어디에 써야 할지 잘 모르겠어요."],
      ["무엇이 있으면 좋을까요?", "실제로 음식을 담은 사진이나 스타일링 예시가 있으면 좋겠어요."],
      ["선물로는 어떠세요?", "선물로는 괜찮을 것 같아요."],
    ]],
    ["en", "against", "価格が高すぎ、日常使いの食器にこの値段は払えない。", [
      ["What do you think about Kutani-ware?", "It's pretty, but the price is way too high for everyday dishes."],
      ["What price would feel right?", "Maybe 2,000 yen for a small plate. Over 10,000 is luxury territory for me."],
      ["Would you buy it as a gift?", "No, I'd rather buy something more practical."],
    ]],
  ],
  kintsugi: [
    ["en", "for", "壊れたものを直して美しくする考え方に深く共感。体験ワークショップに参加したい。", [
      ["What did you think when you learned about kintsugi?", "I love the philosophy, that broken things can become more beautiful. It's very moving."],
      ["Would you try it yourself?", "Yes! I'd pay for a workshop in Kanazawa, maybe 10,000 yen for half a day is fine."],
      ["Would you buy a kintsugi kit?", "Maybe, if the instructions are in English and it's food safe."],
    ]],
    ["en", "for", "自分の大切な器を直したい。修理サービスがあれば利用したい。", [
      ["How would kintsugi fit in your life?", "I have a cup from my grandmother that broke. I'd love to have it repaired with gold."],
      ["Would you send it to Japan for repair?", "If there were a mail-in service with a clear price, absolutely."],
      ["What about the price?", "For something sentimental I'd pay a lot. It's worth it."],
    ]],
    ["en", "conditional_for", "キットに興味はあるが、本物の漆か、食器として安全かが気になる。", [
      ["What is your impression?", "Beautiful, but I've seen cheap kits online with epoxy. Is this real urushi?"],
      ["What would make you trust it?", "Clear explanation of materials and whether it's safe for food."],
      ["Would you gift it?", "As a gift for a crafty friend, yes."],
    ]],
    ["zh", "for", "哲学的な意味に惹かれ、ギフトとして完成品を買いたい。", [
      ["您对金继有什么感想？", "很有禅意，破碎之后变得更美，这个理念很打动人。"],
      ["您会购买金继的作品吗？", "会，我想买一个金继的茶碗送给朋友。"],
      ["价格呢？", "价格有点高，但有故事的东西值得。"],
    ]],
    ["zh", "neutral", "面白いが時間がかかりすぎる。短時間の体験なら考える。", [
      ["您想体验金继吗？", "有兴趣，但听说要好几周才能完成，太久了。"],
      ["怎样会更有吸引力？", "如果有一两个小时的简易体验，我会去。"],
      ["您会买工具包吗？", "可能不会，感觉太难了。"],
    ]],
    ["ko", "for", "SNS映えすると感じ、体験して写真を撮りたい。", [
      ["킨츠기를 보고 어떤 느낌이 드셨나요?", "금색 선이 너무 예뻐서 사진 찍고 싶어요. 인스타그램에 올리면 반응이 좋을 것 같아요."],
      ["체험해 보고 싶으신가요?", "네, 친구들과 같이 체험하고 싶어요."],
      ["가격은요?", "체험 5천 엔 정도면 좋겠어요. 만 엔이 넘으면 조금 비싸요."],
    ]],
    ["ko", "conditional_against", "金継ぎの金が本物かどうか、価格に見合うか疑問。", [
      ["첫인상은 어떠셨나요?", "예쁘지만 진짜 금인지 궁금해요."],
      ["구매하실 건가요?", "가격에 비해 가치가 있는지 잘 모르겠어요. 설명이 더 필요해요."],
      ["무엇이 있으면 좋을까요?", "재료와 과정에 대한 영상이 있으면 믿을 수 있을 것 같아요."],
    ]],
    ["ja", "for", "日本人としても魅力を再発見。海外の友人へのお土産にしたい。", [
      ["金継ぎについてどう感じましたか？", "日本人でも詳しく知らなかったので、改めて素敵だと思いました。"],
      ["どんな時に買いたいですか？", "海外の友人に、日本らしいお土産として渡したいです。"],
      ["価格はどうですか？", "完成品で1万円前後なら妥当だと思います。"],
    ]],
  ],
};

async function findConfigId(billId) {
  const rows = await rest(
    "GET",
    `interview_configs?bill_id=eq.${billId}&select=id,status&order=created_at.desc`
  );
  const pub = rows.find((r) => r.status === "public") ?? rows[0];
  if (!pub) throw new Error(`インタビュー設定が見つかりません bill=${billId}`);
  return pub.id;
}

// 架空の回答者の国・年代（言語ごとに順番に割り当てる）
const FAKE_PROFILES = {
  en: [["US", "30s"], ["GB", "20s"], ["AU", "40s"], ["CA", "50s"], ["US", "20s"], ["SG", "30s"]],
  zh: [["TW", "40s"], ["CN", "20s"], ["HK", "30s"], ["CN", "50s"]],
  ko: [["KR", "20s"], ["KR", "30s"], ["KR", "60plus"]],
  ja: [["JP", "50s"], [null, null]],
};
function fakeProfile(lang, i) {
  const list = FAKE_PROFILES[lang] ?? [[null, null]];
  const [country, age] = list[i % list.length];
  return { respondent_country: country, respondent_age_range: age };
}

async function addProfiles() {
  let n = 0;
  for (const [key, items] of Object.entries(DATA)) {
    const configId = await findConfigId(BILLS[key]);
    const rows = await rest(
      "GET",
      `interview_sessions?langfuse_session_id=eq.${MARK}&interview_config_id=eq.${configId}&select=id&order=started_at.asc`
    );
    const counter = {};
    for (const [i, row] of rows.entries()) {
      const lang = items[i]?.[0] ?? "ja";
      counter[lang] = (counter[lang] ?? 0) + 1;
      await rest(
        "PATCH",
        `interview_sessions?id=eq.${row.id}`,
        fakeProfile(lang, counter[lang] - 1)
      );
      n++;
    }
  }
  console.log(`架空データ ${n}件に国・年代を付けました`);
}

async function del() {
  const rows = await rest(
    "GET",
    `interview_sessions?langfuse_session_id=eq.${MARK}&select=id`
  );
  if (rows.length === 0) {
    console.log("消す架空データはありません");
    return;
  }
  await rest("DELETE", `interview_sessions?langfuse_session_id=eq.${MARK}`);
  console.log(`架空データ ${rows.length}件を消しました`);
}

async function seed() {
  const existing = await rest(
    "GET",
    `interview_sessions?langfuse_session_id=eq.${MARK}&select=id`
  );
  if (existing.length > 0) {
    console.log(`すでに架空データが ${existing.length}件あります。入れ直すなら先に --delete してください`);
    return;
  }
  let n = 0;
  for (const [key, items] of Object.entries(DATA)) {
    const configId = await findConfigId(BILLS[key]);
    const counter = {};
    for (const [i, [lang, stance, summary, qa]] of items.entries()) {
      counter[lang] = (counter[lang] ?? 0) + 1;
      const start = new Date(Date.now() - (items.length - i) * 3600_000);
      const sessionId = randomUUID();
      await rest("POST", "interview_sessions", {
        id: sessionId,
        interview_config_id: configId,
        user_id: randomUUID(),
        langfuse_session_id: MARK,
        started_at: start.toISOString(),
        completed_at: new Date(start.getTime() + 8 * 60_000).toISOString(),
        rating: 4,
        ...fakeProfile(lang, counter[lang] - 1),
      });
      const messages = qa.flatMap(([q, a], j) => [
        {
          interview_session_id: sessionId,
          role: "assistant",
          content: q,
          created_at: new Date(start.getTime() + j * 120_000).toISOString(),
        },
        {
          interview_session_id: sessionId,
          role: "user",
          content: a,
          created_at: new Date(start.getTime() + j * 120_000 + 60_000).toISOString(),
        },
      ]);
      await rest("POST", "interview_messages", messages);
      await rest("POST", "interview_report", {
        interview_session_id: sessionId,
        summary,
        stance,
        role: "general_citizen",
        role_title: "架空データ",
        role_description: "集計ダッシュボード確認用の架空の回答者",
        opinions: qa.map(([q, a]) => ({ title: q, content: a })),
        is_public_by_user: false,
      });
      n++;
    }
  }
  console.log(`架空データを ${n}件入れました`);
}

(flag === "--delete"
  ? del()
  : flag === "--add-profiles"
    ? addProfiles()
    : seed()
).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
