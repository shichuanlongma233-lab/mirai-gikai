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
    badge: "当事者・有識者の方へ",
    title: "法案についてのAIインタビュー",
    features: [
      "あなたの経験や考えをAIがチャットで深掘りします",
      "寄せられた回答はチームみらいの政策検討に活用します",
      "ご意見はチームみらいを通じて国会に届けられる可能性があります",
    ],
    overviewTitle: "インタビュー概要",
    overviewBefore: "国会で検討されている",
    overviewAfter:
      "について、AIがあなたの考えを深掘りするチャット型インタビューです",
    overviewUsage:
      "いただいたご意見は、政策研究や国会での審議に活用し、みらい議会上に公開される可能性があります。",
    billDetailLink: "法案詳細はこちら",
    durationTitle: "予定時間",
    themesTitle: "質問テーマ",
    noticeTitle: "注意事項",
    notice1:
      "このインタビューはAIが対話形式で実施します。リラックスして、ご自身の考えや経験をお聞かせください。",
    notice2:
      "インタビューログは公開される可能性があるため、個人情報や機密情報などセンシティブな内容については記載しないようにしてください。",
    disclosureLink: "AIインタビューに関する情報開示",
    backToBill: "法案詳細に戻る",
    start: "AIインタビューをはじめる",
    resume: "AIインタビューを再開する",
    newAnswer: "もう一度新たに回答する",
    restartFromBeginning: "もう一度最初から回答する",
    pastReports: "過去のレポート",
    contentLanguageNote:
      "法案の記事やテーマは日本語で書かれています。インタビューは選んだ言語で行います。",
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
    item1: "回答データは党内での政策検討に利用します。",
    item2: "個人情報や機密情報の記載はお控えください。",
    item3:
      "インタビュー回答後に公開を許可するかを選択できます。公開を許可した場合、のちにみらい議会に全文が掲載される場合があります。",
    termsBefore: "",
    terms: "利用規約",
    and: "と",
    privacy: "プライバシーポリシー",
    termsAfter: "に同意する",
    agree: "同意してはじめる",
    decline: "同意せずに戻る",
  },
  chat: {
    introTitle: "法案についてのAIインタビューを開始します。",
    introBody: "あなたの意見や経験をお聞かせください。",
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
      "公開を許可した場合、今後みらい議会にあなたのご意見の要約とインタビュー原文が匿名で掲載されることがあります。",
    body2: "さまざまな意見が公開されることで、より深い法案議論が実現できます。",
    privateNote:
      "非公開で提出した場合でも、ご意見は党内での政策検討に活用させていただきます。",
    submitPublic: "公開を許可して提出する",
    submitPrivate: "非公開で提出する",
    openDataBefore: "公開を許可した内容は、「",
    openDataTerms: "みらい議会AIインタビューデータ利用規約",
    openDataAfter:
      "」に基づき、第三者にオープンデータとして提供されることがあります。公開をやめた場合、以後の提供は停止されますが、既に取得されたデータの利用停止までは保証できません。",
  },
  complete: {
    imageAlt: "完了",
    title: "提出が完了しました！",
    thanks: "ご協力ありがとうございました",
    usage: "いただいた声は政策検討に最大限活用します",
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
    makePrivateBody2:
      "チームみらい党内での政策検討に最大限活用させていただきます。",
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
    backToBill: "法案の記事に戻る",
    opinionN: (n: number) => `意見${n}`,
    viewOriginal: "元の回答を見る",
    interviewee: "👫インタビューを受けた人",
    crumbBill: "法案詳細",
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
    subject_expert: "専門的な有識者",
    work_related: "業務に関係",
    daily_life_affected: "暮らしに影響",
    general_citizen: "一般的な関心",
  } as Record<string, string>,
  expert: {
    heading: "法案の有識者の方へ",
    title: "有識者リストにご登録ください",
    body: "現場の知見を法案に活かすため、登録をいただいた方には、今後チームみらいから追加のインタビューをお願いする場合があります。",
    register: "有識者リストに登録する",
  },
};

/** 文言の形。各言語の辞書はこれと同じキーを持つ */
export type Dictionary = typeof ja;
