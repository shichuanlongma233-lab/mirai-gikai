/**
 * 回答者向け画面（AIインタビュー・提出完了画面）の文言。日本語が原文。
 * 他の言語はこの形（Dictionary 型）に合わせて訳す。
 */
export const ja = {
  common: {
    processing: "処理中...",
    sending: "送信中...",
    changing: "変更中...",
    cancel: "キャンセル",
    close: "閉じる",
    send: "送信",
    languageLabel: "言語",
  },
  lp: {
    badge: "海外の皆さまへ",
    title: "日本の文化についてのAIインタビュー",
    features: [
      "AIがチャットであなたの感想や考えを伺います",
      "回答は日本の文化や商品を海外に届けるための調査に活用します",
      "あなたの声が、今後の商品やサービスづくりに反映されるかもしれません",
    ],
    overviewTitle: "インタビュー概要",
    overviewBefore: "「",
    overviewAfter:
      "」について、AIがあなたの率直な感想を伺うチャット型インタビューです。",
    overviewUsage:
      "回答は匿名で集計し、日本の文化や商品を海外に届けるための調査に活用します。",
    billDetailLink: "くわしい紹介を読む",
    durationTitle: "予定時間",
    themesTitle: "質問テーマ",
    noticeTitle: "注意事項",
    notice1:
      "このインタビューはAIが対話形式で実施します。リラックスして、ご自身の考えや経験をお聞かせください。",
    notice2:
      "インタビューログは公開される可能性があるため、個人情報や機密情報などセンシティブな内容については記載しないようにしてください。",
    disclosureLink: "AIインタビューに関する情報開示",
    backToBill: "トピックの紹介に戻る",
    start: "AIインタビューをはじめる",
    resume: "AIインタビューを再開する",
    newAnswer: "もう一度新たに回答する",
    restartFromBeginning: "もう一度最初から回答する",
    pastReports: "過去のレポート",
    contentLanguageNote:
      "紹介文とテーマはAIで翻訳しています。インタビューは選んだ言語で行います。",
  },
  status: {
    active: "中断中",
    completed: "回答完了",
  },
  duration: {
    minutes: (n: number) => `約${n}分〜`,
  },
  consent: {
    title: "AIインタビュー同意事項",
    item1: "回答データは市場調査として匿名で集計・分析します。",
    item2: "個人情報や機密情報の記載はお控えください。",
    item3:
      "インタビュー回答後に、回答の公開を許可するかを選べます。許可した場合、要約と回答が匿名で公開されることがあります。",
    termsBefore: "",
    terms: "利用規約",
    and: "と",
    privacy: "プライバシーポリシー",
    termsAfter: "に同意する",
    agree: "同意してはじめる",
    decline: "同意せずに戻る",
  },
  chat: {
    introTitle: "AIインタビューを開始します。",
    introBody: "あなたの率直な感想をお聞かせください。",
    thinking: "考え中...",
    placeholder: "AIの質問に回答する",
    sendAlt: "送信",
    privacyWarning: "個人情報や機密情報は記入しないでください",
    timeUpMessage: "目安時間になりました。レポート作成に進みたいです。",
    retry: "もう一度試す",
    retrying: "再試行中...",
    reportConfirm:
      "こちらの内容で問題ありませんか？違和感がある箇所があれば指摘してください。",
    introTopic: "はじめに",
    saveAndPause: "保存して中断",
  },
  skip: {
    trigger: "スキップする",
    next: "次の質問に進む",
    other: "他に言いたいことがある",
    end: "インタビューを終了する",
  },
  timer: {
    over: "目安時間超過",
    remaining: (n: number) => `残り約 ${n} 分`,
  },
  timeUp: {
    message: "目安時間を超過しましたが、インタビューを続けてもよいですか？",
    continue: "インタビューを続ける",
    end: "終了してレポートを作成",
  },
  restart: {
    title: "最初からやり直しますか？",
    body: "現在の回答内容は破棄されます。",
    confirm: "最初からやり直す",
  },
  rating: {
    title: "AIインタビュー改善のためのアンケート",
    question: "AIはあなたの考えを十分に引き出せていますか",
    star: (n: number) => `${n}つ星`,
    feedbackQuestion: "気になった点を教えてください",
    thanks: "回答ありがとうございました！",
    tags: {
      irrelevant_questions: "質問が的外れ",
      not_aligned: "話が噛み合わない",
      misunderstood: "言いたいことと違う",
      too_many_questions: "質問が多い",
      other: "その他",
    },
  },
  summary: {
    submit: "レポート内容に同意して提出",
    tooShort:
      "お話しいただいた内容が短く、レポートを作成できませんでした。もう少しインタビューを続けると、レポートを作成できます。",
    continue: "インタビューを続ける",
    end: "インタビューを終了する",
    ending: "終了中...",
    placeholder: "レポートの修正要望を入力する",
    opinionSummary: "💡意見の要約",
    stance: "🙋基本スタンス",
    role: "立場",
    roleDetail: "立場の詳細",
    mainOpinions: "💬主な意見",
  },
  sessionError: {
    title: "セッションを読み込めませんでした",
    message:
      "インタビューの開始または再開中に問題が発生しました。一度インタビューのトップ画面に戻ってから、再度お試しください。",
    back: "インタビュートップに戻る",
  },
  publicConsent: {
    almostDone: "あと少しです！",
    heading: "公開設定",
    questionLine1: "インタビュー内容の公開を",
    questionLine2: "許可しますか？",
    body1:
      "公開を許可した場合、あなたの意見の要約とインタビュー原文が匿名で公開されることがあります。",
    body2: "さまざまな感想が公開されることで、ほかの人の参考にもなります。",
    privateNote:
      "非公開で提出した場合でも、回答は調査の分析に活用させていただきます。",
    submitPublic: "公開を許可して提出する",
    submitPrivate: "非公開で提出する",
    openDataBefore: "公開を許可した内容は、「",
    openDataTerms: "AIインタビューデータ利用規約",
    openDataAfter:
      "」に基づき、第三者にオープンデータとして提供されることがあります。公開をやめた場合、以後の提供は停止されますが、既に取得されたデータの利用停止までは保証できません。",
  },
  complete: {
    imageAlt: "完了",
    title: "提出が完了しました！",
    thanks: "ご協力ありがとうございました",
    usage: "いただいた声は、日本の文化や商品を海外に届けるために活用します",
    reportTitle: "インタビューレポート",
  },
  publicStatus: {
    public: "公開",
    private: "非公開",
    toPrivate: "非公開に変更する",
    toPublic: "公開に変更する",
    makePublicLine1: "インタビュー内容を",
    makePublicLine2: "公開に切り替えますか？",
    makePublic: "公開にする",
    keepPrivate: "非公開のまま戻る",
    makePrivateLine1: "インタビュー内容を",
    makePrivateLine2: "非公開に切り替えますか？",
    makePrivateBody1:
      "非公開にした場合、あなたのご意見が世の中に公開されることはありません。",
    makePrivateBody2: "回答は調査の分析に活用させていただきます。",
    makePrivate: "非公開にする",
    keepPublic: "公開のまま戻る",
  },
  report: {
    mainOpinions: "💬主な意見",
    readContext: "インタビューの前後を読む",
    chatLog: "🎤すべての会話ログ",
    respondent: "回答者",
    expectation: "期待",
    concern: "懸念",
    answeredAt: "回答日",
    volume: "インタビュー分量",
    minutes: (n: number) => `${n} 分 / `,
    characters: (n: number) => `${n} 文字`,
    shareArticle: "記事を共有する",
    backToBill: "トピックの紹介に戻る",
    opinionN: (n: number) => `意見${n}`,
    viewOriginal: "元の回答を見る",
    interviewee: "👫インタビューを受けた人",
    crumbBill: "トピック",
    crumbReports: "レポート一覧",
    crumbReport: "レポート",
    reportProblem: "問題を報告する",
    reportProblemAlt: "報告アイコン",
    volumeShort: "インタビューの分量",
    charactersShort: (n: number) => `${n}文字`,
    backToReports: "レポート一覧に戻る",
  },
  stances: {
    for: "期待",
    against: "懸念",
    neutral: "期待＆懸念",
  } as Record<string, string>,
  roles: {
    subject_expert: "専門家・業界関係者",
    work_related: "仕事で関わる",
    daily_life_affected: "日常で使う・体験する",
    general_citizen: "一般的な関心",
  } as Record<string, string>,
  expert: {
    heading: "この分野にくわしい方へ",
    title: "有識者リストにご登録ください",
    body: "ご登録いただいた方には、今後追加のインタビューをお願いする場合があります。",
    register: "有識者リストに登録する",
  },
};

/** 文言の形。各言語の辞書はこれと同じキーを持つ */
export type Dictionary = typeof ja;
