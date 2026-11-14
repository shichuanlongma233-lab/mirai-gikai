import type { Dictionary } from "./ja";

export const en: Dictionary = {
  common: {
    processing: "Processing...",
    sending: "Sending...",
    changing: "Updating...",
    cancel: "Cancel",
    close: "Close",
    send: "Send",
    languageLabel: "Language",
  },
  lp: {
    badge: "For people around the world",
    title: "AI interview about Japanese culture",
    features: [
      "An AI chats with you to hear your impressions and opinions",
      "Your answers help bring Japanese culture and products to people overseas",
      "Your voice may shape future products and services",
    ],
    overviewTitle: "About this interview",
    overviewBefore:
      "This is a chat-style interview in which an AI asks for your honest impressions of “",
    overviewAfter: "”.",
    overviewUsage:
      "Answers are aggregated anonymously and used for research on bringing Japanese culture and products overseas.",
    billDetailLink: "Read the full introduction",
    durationTitle: "Estimated time",
    themesTitle: "Interview themes",
    noticeTitle: "Please note",
    notice1:
      "This interview is conducted by an AI in a conversational format. Relax and share your own thoughts and experiences.",
    notice2:
      "Interview logs may be published, so please do not include personal, confidential or other sensitive information.",
    disclosureLink: "Disclosure about the AI interview (Japanese)",
    backToBill: "Back to the introduction",
    start: "Start the AI interview",
    resume: "Resume the AI interview",
    newAnswer: "Answer again from scratch",
    restartFromBeginning: "Start over from the beginning",
    pastReports: "Your past reports",
    contentLanguageNote:
      "The introduction and themes are translated by AI. The interview will be held in the language you choose.",
  },
  status: {
    active: "Paused",
    completed: "Completed",
  },
  duration: {
    minutes: (n: number) => `About ${n} min`,
  },
  consent: {
    title: "Consent for the AI interview",
    item1:
      "Your answers will be aggregated and analyzed anonymously as market research.",
    item2: "Please do not include personal or confidential information.",
    item3:
      "After the interview, you can choose whether to allow publication. If you allow it, a summary and your answers may be published anonymously.",
    termsBefore: "I agree to the ",
    terms: "Terms of Use",
    and: " and ",
    privacy: "Privacy Policy",
    termsAfter: " (Japanese)",
    agree: "Agree and start",
    decline: "Go back without agreeing",
  },
  chat: {
    introTitle: "Starting the AI interview.",
    introBody: "Please share your honest impressions.",
    thinking: "Thinking...",
    placeholder: "Answer the AI's question",
    sendAlt: "Send",
    privacyWarning: "Please do not enter personal or confidential information",
    timeUpMessage:
      "We've reached the estimated time. I'd like to move on to creating the report.",
    retry: "Try again",
    retrying: "Retrying...",
    reportConfirm:
      "Does this look right? If anything feels off, please let me know.",
    introTopic: "Introduction",
    saveAndPause: "Save and pause",
  },
  skip: {
    trigger: "Skip",
    next: "Go to the next question",
    other: "I have something else to say",
    end: "End the interview",
  },
  timer: {
    over: "Over the estimated time",
    remaining: (n: number) => `About ${n} min left`,
  },
  timeUp: {
    message:
      "We've passed the estimated time. Would you like to continue the interview?",
    continue: "Continue the interview",
    end: "Finish and create the report",
  },
  restart: {
    title: "Start over from the beginning?",
    body: "Your current answers will be discarded.",
    confirm: "Start over",
  },
  rating: {
    title: "Quick survey to improve the AI interview",
    question: "Is the AI drawing out your thoughts well?",
    star: (n: number) => `${n} star${n === 1 ? "" : "s"}`,
    feedbackQuestion: "What could be better?",
    thanks: "Thank you for your feedback!",
    tags: {
      irrelevant_questions: "Questions are off-target",
      not_aligned: "We're not on the same page",
      misunderstood: "Not what I meant",
      too_many_questions: "Too many questions",
      other: "Other",
    },
  },
  summary: {
    submit: "Agree with the report and submit",
    tooShort:
      "Your answers were too short to create a report. If you continue the interview a little longer, a report can be created.",
    continue: "Continue the interview",
    end: "End the interview",
    ending: "Ending...",
    placeholder: "Describe any changes you'd like to the report",
    opinionSummary: "💡Summary of your opinion",
    stance: "🙋Overall stance",
    role: "Your position",
    roleDetail: "Details of your position",
    mainOpinions: "💬Main opinions",
  },
  sessionError: {
    title: "Couldn't load the session",
    message:
      "Something went wrong while starting or resuming the interview. Please go back to the interview top page and try again.",
    back: "Back to the interview top page",
  },
  publicConsent: {
    almostDone: "Almost done!",
    heading: "Publication settings",
    questionLine1: "Do you allow your interview",
    questionLine2: "to be published?",
    body1:
      "If you allow publication, a summary of your opinion and the original interview text may be published anonymously.",
    body2: "Sharing a variety of impressions helps other people too.",
    privateNote:
      "Even if you submit privately, your answers will still be used in our research analysis.",
    submitPublic: "Allow publication and submit",
    submitPrivate: "Submit privately",
    openDataBefore:
      'Content you allow to be published may be provided to third parties as open data under the "',
    openDataTerms: "AI Interview Data Terms of Use",
    openDataAfter:
      '" (Japanese). If you later stop publication, further provision will stop, but we cannot guarantee that data already obtained by others will no longer be used.',
  },
  complete: {
    imageAlt: "Done",
    title: "Your submission is complete!",
    thanks: "Thank you for your cooperation",
    usage:
      "We will use your voice to bring Japanese culture and products overseas",
    reportTitle: "Interview report",
  },
  publicStatus: {
    public: "Public",
    private: "Private",
    toPrivate: "Make private",
    toPublic: "Make public",
    makePublicLine1: "Switch your interview",
    makePublicLine2: "to public?",
    makePublic: "Make public",
    keepPrivate: "Keep private and go back",
    makePrivateLine1: "Switch your interview",
    makePrivateLine2: "to private?",
    makePrivateBody1:
      "If you make it private, your opinion will not be published.",
    makePrivateBody2:
      "Your answers will still be used in our research analysis.",
    makePrivate: "Make private",
    keepPublic: "Keep public and go back",
  },
  report: {
    mainOpinions: "💬Main opinions",
    readContext: "Read the surrounding conversation",
    chatLog: "🎤Full conversation log",
    respondent: "Respondent",
    expectation: "Hopeful",
    concern: "Concerned",
    answeredAt: "Answered on",
    volume: "Interview length",
    minutes: (n: number) => `${n} min / `,
    characters: (n: number) => `${n} characters`,
    shareArticle: "Share the article",
    backToBill: "Back to the introduction",
    opinionN: (n: number) => `Opinion ${n}`,
    viewOriginal: "See the original answer",
    interviewee: "👫About the interviewee",
    crumbBill: "Topic",
    crumbReports: "Reports",
    crumbReport: "Report",
    reportProblem: "Report a problem",
    reportProblemAlt: "Report icon",
    volumeShort: "Interview length",
    charactersShort: (n: number) => `${n} characters`,
    backToReports: "Back to the report list",
  },
  stances: {
    for: "Hopeful",
    against: "Concerned",
    neutral: "Hopeful & concerned",
  } as Record<string, string>,
  roles: {
    subject_expert: "Expert / industry professional",
    work_related: "Involved through work",
    daily_life_affected: "Use or experience it in daily life",
    general_citizen: "General interest",
  } as Record<string, string>,
  expert: {
    heading: "Do you know this field well?",
    title: "Please join our expert list",
    body: "We may ask registered people for additional interviews in the future.",
    register: "Join the expert list",
  },
};
