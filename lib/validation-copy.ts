import type { SupportedLocale } from "@/types/localization";

type ValidationCopy = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  heading: string;
  intro: string;
  studyState: string;
  invitedHeading: string;
  invitedBody: string;
  sessionFacts: readonly string[];
  eligibilityHeading: string;
  eligibility: readonly string[];
  privacyHeading: string;
  privacy: readonly string[];
  startHeading: string;
  startBody: string;
  startCta: string;
  supplementalHeading: string;
  supplementalBody: string;
  supplementalCta: string;
  publicNotice: string;
  generalFeedback: string;
};

export const validationCopy: Record<SupportedLocale, ValidationCopy> = {
  "zh-CN": {
    metadataTitle: "参与 Public Beta 外部验证",
    metadataDescription: "了解 Cooking Lab 有界外部验证的参与方式、研究边界和公开补充反馈入口。",
    eyebrow: "M8 · 有界外部验证",
    heading: "用一次真实晚餐，判断它有没有价值",
    intro: "我们正在邀请真实的家庭做饭用户，用自己的时间、食材与厨具条件完成一次料理决策。研究关注产品是否真的帮助决定，而不是测试你会不会用网站。",
    studyState: "方向门槛只采用受邀、实时观察的主持式 session；公开反馈只作补充证据。",
    invitedHeading: "如果你收到研究邀请",
    invitedBody: "请先阅读邀请中的完整参与者说明和私密联系渠道。主持人会在开始前逐项确认 consent，再请你用自己的设备完成任务。",
    sessionFacts: [
      "约 30–45 分钟，远程或面对面进行",
      "使用一个真实但不必披露敏感细节的晚餐情境",
      "默认只做文字笔记，不录音、不录像",
      "你可以跳过问题、随时停止",
    ],
    eligibilityHeading: "本轮寻找谁",
    eligibility: [
      "年满 18 岁",
      "每周至少两次为自己或家庭决定并准备餐食",
      "最近遇到过时间、食材、厨具、预算或非医疗性偏好带来的做饭取舍",
      "不属于 Cooking Lab 项目团队",
    ],
    privacyHeading: "隐私边界",
    privacy: [
      "不要提供姓名、邮箱、住址、医疗诊断、未成年人信息或其他敏感资料",
      "仓库只保存 P01–P08 去标识化观察，不保存联系信息或身份映射",
      "去标识化内容合并到公开 Git 后，历史、fork 或 cache 中的副本可能无法完全撤回",
      "退出或删除请求请使用邀请中的私密渠道，不要写进公开 Issue",
    ],
    startHeading: "准备开始你的受邀 session",
    startBody: "保持当前页面打开，并在主持人说明任务后，从首页的“决定今晚吃什么”开始。不要预先练习；我们需要看到第一次真实使用。",
    startCta: "进入料理决策",
    supplementalHeading: "没有邀请，也想留下体验记录？",
    supplementalBody: "你可以提交一份结构化的公开 GitHub 反馈。它不会计入外部验证门槛，也不能替代主持式 session，但会作为补充产品证据阅读。",
    supplementalCta: "提交公开补充反馈",
    publicNotice: "GitHub Issue 会公开你的 GitHub 用户名和填写内容，公开副本可能无法完全删除。提交前必须确认自愿参与、亲自使用过 Production，并且不会写入个人或敏感资料。",
    generalFeedback: "只想报告 bug 或一般建议？使用原有 Beta 反馈入口。",
  },
  en: {
    metadataTitle: "Join the Public Beta validation",
    metadataDescription: "Learn how Cooking Lab's bounded external validation works, what it collects, and how to leave supplemental public feedback.",
    eyebrow: "M8 · Bounded external validation",
    heading: "Use one real dinner decision to tell us whether this is valuable",
    intro: "We are inviting real home cooks to make one cooking decision using their own time, ingredients, and tools. The study tests whether the product helps with the decision; it does not test you.",
    studyState: "Direction thresholds use invited, live-observed moderated sessions only. Public feedback is supplemental evidence.",
    invitedHeading: "If you received a research invitation",
    invitedBody: "Read the full participant information and private contact in your invitation. The moderator will confirm each consent item before you use the product on your own device.",
    sessionFacts: [
      "About 30–45 minutes, remotely or in person",
      "Use a real dinner situation without sharing sensitive details",
      "Written notes only by default, with no audio or video recording",
      "You may skip questions or stop at any time",
    ],
    eligibilityHeading: "Who this round is for",
    eligibility: [
      "You are at least 18",
      "You decide and prepare food for yourself or a household at least twice a week",
      "You recently balanced time, ingredients, tools, budget, or a non-medical preference when cooking",
      "You are not part of the Cooking Lab project team",
    ],
    privacyHeading: "Privacy boundary",
    privacy: [
      "Do not share names, email addresses, home addresses, medical diagnoses, information about minors, or other sensitive data",
      "The repository stores only P01–P08 de-identified observations, never contact details or an identity map",
      "After de-identified content enters public Git, copies in history, forks, or caches may not be fully retractable",
      "Use the private invitation channel for withdrawal or deletion requests, not a public issue",
    ],
    startHeading: "Ready for your invited session",
    startBody: "Keep this page open. After the moderator gives you the task, begin with “Find tonight's dinner” on the homepage. Please do not practise first; we need the real first-use experience.",
    startCta: "Start the cooking decision",
    supplementalHeading: "No invitation, but want to share your experience?",
    supplementalBody: "You can file structured feedback in a public GitHub issue. It does not count toward the external-validation thresholds or replace a moderated session, but it will be reviewed as supplemental product evidence.",
    supplementalCta: "Send supplemental public feedback",
    publicNotice: "A GitHub issue publicly shows your GitHub username and response, and public copies may not be fully deletable. Before submitting, you must confirm that participation is voluntary, you personally used Production, and you will not include personal or sensitive data.",
    generalFeedback: "Only reporting a bug or general suggestion? Use the existing Beta feedback form.",
  },
};
