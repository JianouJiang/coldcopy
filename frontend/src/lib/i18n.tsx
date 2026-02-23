import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';

const translations = {
  // Landing page
  'landing.hero.title': {
    en: 'Cold Emails That Actually Get Replies',
    zh: '真正能收到回复的冷邮件',
  },
  'landing.hero.subtitle': {
    en: 'AI writes personalized cold emails. Auto-Pilot Mode sends them, reads replies, and responds — fully autonomous. Or use Manual Mode to learn the psychology first.',
    zh: 'AI 撰写个性化冷邮件。自动驾驶模式发送邮件、阅读回复、自动回复——完全自主。或使用手动模式先学习邮件心理学。',
  },
  'landing.hero.social': {
    en: 'Used by 50+ bootstrapped founders',
    zh: '已有 50+ 独立创始人使用',
  },
  'landing.hero.cta': {
    en: 'Try Auto-Pilot Mode — Free',
    zh: '免费试用自动驾驶模式',
  },
  'landing.hero.manual': {
    en: 'Or learn cold email first — Manual Mode ($19)',
    zh: '或先学习冷邮件 — 手动模式（$19）',
  },
  'landing.comparison.title': {
    en: 'Not Just Another AI Email Writer',
    zh: '不只是又一个 AI 写邮件工具',
  },
  'landing.comparison.generic': {
    en: 'Generic AI Tool',
    zh: '通用 AI 工具',
  },
  'landing.comparison.generic.subject': {
    en: 'Subject: Exciting opportunity for your business!',
    zh: 'Subject: 令人兴奋的商业机会！',
  },
  'landing.comparison.generic.greeting': {
    en: 'Hi there,',
    zh: '您好，',
  },
  'landing.comparison.generic.body': {
    en: 'I hope this email finds you well. I wanted to reach out because I think our amazing product could be a game-changer for your company...',
    zh: '希望您一切安好。我联系您是因为我认为我们出色的产品可能会成为贵公司的变革者...',
  },
  'landing.comparison.generic.flaw1': {
    en: 'Buzzwords ("game-changer", "exciting")',
    zh: '空洞的流行语（"变革者"、"令人兴奋"）',
  },
  'landing.comparison.generic.flaw2': {
    en: 'No specificity\u2014could be any product',
    zh: '没有针对性，适用于任何产品',
  },
  'landing.comparison.generic.flaw3': {
    en: 'Clich\u00e9 opener ("hope this finds you well")',
    zh: '老套的开场白（"希望您一切安好"）',
  },
  'landing.comparison.coldcopy.subject': {
    en: 'Subject: Are 60% of your carts abandoned in <10 seconds?',
    zh: 'Subject: 你的购物车是否有 60% 在 10 秒内被放弃？',
  },
  'landing.comparison.coldcopy.greeting': {
    en: 'Hi Sarah,',
    zh: 'Hi Sarah,',
  },
  'landing.comparison.coldcopy.body1': {
    en: 'I noticed Acme Store is in the DTC e-commerce space. Quick question: do you track why shoppers abandon carts in the first 10 seconds?',
    zh: '我注意到 Acme Store 在 DTC 电商领域。快速提个问题：你们是否追踪过为什么购物者会在前 10 秒内放弃购物车？',
  },
  'landing.comparison.coldcopy.body2': {
    en: 'Most brands lose 30-40% of revenue to cart abandonment, but the data sits in Google Analytics as a black box...',
    zh: '大多数品牌因购物车放弃流失了 30-40% 的收入，但这些数据在 Google Analytics 里就像个黑盒...',
  },
  'landing.comparison.coldcopy.pro1': {
    en: 'Specific pain point (cart abandonment)',
    zh: '具体的痛点（购物车放弃）',
  },
  'landing.comparison.coldcopy.pro2': {
    en: 'Quantified problem (60%, 10 seconds)',
    zh: '量化的问题（60%、10 秒）',
  },
  'landing.comparison.coldcopy.pro3': {
    en: 'SaaS-aware (mentions analytics, trials)',
    zh: '懂 SaaS（提到数据分析、试用）',
  },
  'landing.benefit1.title': {
    en: '2 Minutes to Sequences',
    zh: '2 分钟生成序列',
  },
  'landing.benefit1.desc': {
    en: 'Fill out 7 fields, get 5 emails with A/B subject lines. No fluff, no friction.',
    zh: '填写 7 个字段，获得 5 封带 A/B 标题的邮件。无废话，无阻碍。',
  },
  'landing.benefit2.title': {
    en: 'SaaS-Specific Language',
    zh: 'SaaS 专属用语',
  },
  'landing.benefit2.desc': {
    en: 'Trial CTAs, demo hooks, integration mentions. Speaks your customers\' language.',
    zh: '试用 CTA、演示钩子、集成说明。说你客户听得懂的话。',
  },
  'landing.benefit3.title': {
    en: 'Copy-Paste Ready',
    zh: '复制粘贴即用',
  },
  'landing.benefit3.desc': {
    en: 'Drop into Lemlist, Instantly, or Apollo. Personalize merge tags and send.',
    zh: '直接导入 Lemlist、Instantly 或 Apollo。个性化合并标签后发送。',
  },
  'landing.footer.cta': {
    en: 'Generate My First Sequence (Free)',
    zh: '免费生成我的第一组序列',
  },
  'landing.footer.note': {
    en: 'No account required. See results in 15 seconds.',
    zh: '无需注册账号。15 秒内看到结果。',
  },

  // Generate page
  'generate.back': {
    en: '\u2190 Back to Home',
    zh: '\u2190 返回首页',
  },
  'generate.title': {
    en: 'Generate Your Cold Email Sequence',
    zh: '生成你的冷邮件序列',
  },
  'generate.subtitle': {
    en: 'Fill out the form below to generate a SaaS-specific cold email sequence (takes 2-3 minutes)',
    zh: '填写以下表单生成 SaaS 专属冷邮件序列（约需 2-3 分钟）',
  },
  'generate.section.basic': {
    en: 'Basic Information',
    zh: '基本信息',
  },
  'generate.field.companyName': {
    en: 'Company Name',
    zh: '公司名称',
  },
  'generate.field.companyName.placeholder': {
    en: 'e.g., Acme Analytics',
    zh: '例如：Acme Analytics',
  },
  'generate.field.companyName.help': {
    en: 'Your product or company name',
    zh: '你的产品或公司名称',
  },
  'generate.field.targetJobTitle': {
    en: 'Target Job Title',
    zh: '目标职位',
  },
  'generate.field.targetJobTitle.placeholder': {
    en: 'e.g., VP of Marketing',
    zh: '例如：市场副总裁',
  },
  'generate.field.targetJobTitle.help': {
    en: 'Who are you targeting?',
    zh: '你的目标客户是谁？',
  },
  'generate.section.problem': {
    en: 'Problem & Solution',
    zh: '问题与解决方案',
  },
  'generate.field.problemTheyFace': {
    en: 'Problem They Face',
    zh: '他们面临的问题',
  },
  'generate.field.problemTheyFace.placeholder': {
    en: 'e.g., They lose 30-40% of revenue to cart abandonment but don\'t know why',
    zh: '例如：他们因购物车放弃流失了 30-40% 的收入，但不知道原因',
  },
  'generate.field.problemTheyFace.help': {
    en: 'What pain point does your product solve? (10-300 chars)',
    zh: '你的产品解决了什么痛点？（10-300 字符）',
  },
  'generate.field.yourProduct': {
    en: 'Your Product',
    zh: '你的产品',
  },
  'generate.field.yourProduct.placeholder': {
    en: 'e.g., Real-time analytics dashboard for e-commerce stores. Shows conversion funnels, cart abandonment, and LTV cohorts.',
    zh: '例如：面向电商的实时分析仪表盘。展示转化漏斗、购物车放弃率和 LTV 群组。',
  },
  'generate.field.yourProduct.help': {
    en: 'What does your product do? (10-200 chars)',
    zh: '你的产品做什么？（10-200 字符）',
  },
  'generate.field.keyBenefit': {
    en: 'Key Benefit',
    zh: '核心价值',
  },
  'generate.field.keyBenefit.placeholder': {
    en: '"Identify why 60% of carts abandon in under 10 seconds"',
    zh: '"找出为什么 60% 的购物车在 10 秒内被放弃"',
  },
  'generate.field.keyBenefit.help': {
    en: 'The ONE main benefit prospects care about (10-150 chars)',
    zh: '客户最在乎的核心价值（10-150 字符）',
  },
  'generate.section.cta': {
    en: 'Call to Action & Tone',
    zh: '行动号召与语气',
  },
  'generate.field.callToAction': {
    en: 'Call to Action',
    zh: '行动号召',
  },
  'generate.field.callToAction.placeholder': {
    en: '"Book a 15-min demo"',
    zh: '"预约 15 分钟演示"',
  },
  'generate.field.callToAction.help': {
    en: 'What do you want prospects to do? (10-100 chars)',
    zh: '你希望潜在客户做什么？（10-100 字符）',
  },
  'generate.field.tone': {
    en: 'Tone',
    zh: '语气',
  },
  'generate.field.tone.help': {
    en: 'Choose the tone for your email sequence',
    zh: '选择邮件序列的语气风格',
  },
  'generate.tone.professional': {
    en: 'Professional',
    zh: '专业',
  },
  'generate.tone.casual': {
    en: 'Casual',
    zh: '随和',
  },
  'generate.tone.direct': {
    en: 'Direct',
    zh: '直接',
  },
  'generate.tone.friendly': {
    en: 'Friendly',
    zh: '友好',
  },
  'generate.loading': {
    en: 'Generating your sequence...',
    zh: '正在生成你的序列...',
  },
  'generate.loading.time': {
    en: 'This usually takes 3-5 seconds...',
    zh: '通常需要 3-5 秒...',
  },
  'generate.submit': {
    en: 'Generate Sequence',
    zh: '生成序列',
  },
  'generate.required.note': {
    en: 'All fields marked with * are required',
    zh: '标有 * 的字段为必填项',
  },
  'generate.validation.required': {
    en: 'This field is required',
    zh: '此字段为必填项',
  },
  'generate.validation.min': {
    en: 'Minimum {min} characters required',
    zh: '至少需要 {min} 个字符',
  },
  'generate.validation.max': {
    en: 'Maximum {max} characters',
    zh: '最多 {max} 个字符',
  },
  'generate.error.limit': {
    en: 'You have reached your generation limit. Upgrade to continue.',
    zh: '你已达到生成上限。升级以继续使用。',
  },
  'generate.error.failed': {
    en: 'Failed to generate sequence. Please try again.',
    zh: '生成序列失败。请重试。',
  },
  'generate.error.generic': {
    en: 'An error occurred. Please try again.',
    zh: '发生错误。请重试。',
  },

  // Output page
  'output.back': {
    en: '\u2190 Generate Another Sequence',
    zh: '\u2190 生成另一组序列',
  },
  'output.title': {
    en: 'Your Cold Email Sequence',
    zh: '你的冷邮件序列',
  },
  'output.subtitle': {
    en: 'Copy-paste ready for Lemlist, Instantly, Apollo, or your email tool',
    zh: '可直接复制粘贴到 Lemlist、Instantly、Apollo 或你的邮件工具',
  },
  'output.email': {
    en: 'Email',
    zh: '邮件',
  },
  'output.subjectA': {
    en: 'Subject Line A (Variant 1)',
    zh: '标题 A（变体 1）',
  },
  'output.subjectB': {
    en: 'Subject Line B (Variant 2)',
    zh: '标题 B（变体 2）',
  },
  'output.body': {
    en: 'Email Body',
    zh: '邮件正文',
  },
  'output.copy': {
    en: 'Copy',
    zh: '复制',
  },
  'output.copied': {
    en: 'Copied!',
    zh: '已复制！',
  },
  'output.copied.toast': {
    en: 'Copied to clipboard!',
    zh: '已复制到剪贴板！',
  },
  'output.upgrade.title': {
    en: 'Want More Sequences?',
    zh: '想要更多序列？',
  },
  'output.upgrade.desc': {
    en: 'Upgrade to generate unlimited sequences with custom variations and advanced features.',
    zh: '升级以生成无限序列，支持自定义变体和高级功能。',
  },
  'output.upgrade.button': {
    en: 'Upgrade Now',
    zh: '立即升级',
  },
  'output.another': {
    en: 'Generate Another Sequence',
    zh: '生成另一组序列',
  },

  // Success page
  'success.title': {
    en: 'Payment Successful!',
    zh: '支付成功！',
  },
  'success.thanks': {
    en: 'Thank you for upgrading to ColdCopy Pro',
    zh: '感谢升级到 ColdCopy Pro',
  },
  'success.next': {
    en: 'What happens next?',
    zh: '接下来会发生什么？',
  },
  'success.step1': {
    en: 'Check your email for payment confirmation from Stripe',
    zh: '查看你的邮箱，获取来自 Stripe 的付款确认',
  },
  'success.step2': {
    en: 'Your quota will be upgraded within <strong>24 hours</strong> (manual process for MVP)',
    zh: '你的配额将在 <strong>24 小时</strong>内升级（MVP 阶段为人工处理）',
  },
  'success.step3': {
    en: "You'll receive a welcome email with instructions to start generating unlimited sequences",
    zh: '你将收到一封欢迎邮件，包含如何开始生成无限序列的说明',
  },
  'success.step4': {
    en: 'Need help? Reply to the welcome email or contact support',
    zh: '需要帮助？回复欢迎邮件或联系客服',
  },
  'success.return': {
    en: 'Return to ColdCopy',
    zh: '返回 ColdCopy',
  },
  'success.txid': {
    en: 'Your transaction ID:',
    zh: '你的交易 ID：',
  },

  // Cancel page
  'cancel.title': {
    en: 'Payment Cancelled',
    zh: '支付已取消',
  },
  'cancel.subtitle': {
    en: 'No worries! You can upgrade anytime.',
    zh: '没关系！你可以随时升级。',
  },
  'cancel.message': {
    en: 'You still have access to your <strong>free generation</strong>. Come back anytime you\'re ready to generate more sequences.',
    zh: '你仍然可以使用<strong>免费生成</strong>功能。随时准备好了可以回来生成更多序列。',
  },
  'cancel.back': {
    en: 'Back to ColdCopy',
    zh: '返回 ColdCopy',
  },
  'cancel.home': {
    en: 'Go to Homepage',
    zh: '返回首页',
  },

  // Paywall
  'paywall.title': {
    en: "You've Reached Your Free Limit",
    zh: '你已用完免费额度',
  },
  'paywall.subtitle': {
    en: 'Upgrade to generate more cold email sequences',
    zh: '升级以生成更多冷邮件序列',
  },
  'paywall.starter': {
    en: 'Starter',
    zh: '入门版',
  },
  'paywall.starter.price.suffix': {
    en: 'one-time',
    zh: '一次性',
  },
  'paywall.starter.feature1': {
    en: '<strong>50 email sequences</strong>',
    zh: '<strong>50 组邮件序列</strong>',
  },
  'paywall.starter.feature2': {
    en: 'A/B subject line variants',
    zh: 'A/B 标题变体',
  },
  'paywall.starter.feature3': {
    en: 'SaaS-optimized copy',
    zh: 'SaaS 优化文案',
  },
  'paywall.starter.feature4': {
    en: 'Copy-paste ready for any tool',
    zh: '适用于任何工具的复制粘贴格式',
  },
  'paywall.starter.cta': {
    en: 'Get Starter',
    zh: '获取入门版',
  },
  'paywall.starter.note': {
    en: 'Perfect for testing ColdCopy',
    zh: '适合体验 ColdCopy',
  },
  'paywall.pro': {
    en: 'Pro',
    zh: '专业版',
  },
  'paywall.pro.badge': {
    en: 'Most Popular',
    zh: '最受欢迎',
  },
  'paywall.pro.price.suffix': {
    en: '/month',
    zh: '/月',
  },
  'paywall.pro.feature1': {
    en: '<strong>Unlimited</strong> sequences',
    zh: '<strong>无限</strong>序列',
  },
  'paywall.pro.feature5': {
    en: '<strong>Priority support</strong>',
    zh: '<strong>优先支持</strong>',
  },
  'paywall.pro.cta': {
    en: 'Go Pro',
    zh: '获取专业版',
  },
  'paywall.pro.note': {
    en: 'Best for serious outbound campaigns',
    zh: '适合认真做外呼的团队',
  },
  'paywall.footer': {
    en: 'Secure payment powered by',
    zh: '安全支付由',
  },
  'paywall.footer.stripe': {
    en: 'Stripe',
    zh: 'Stripe 提供',
  },

  // Upgrade banner
  'banner.title': {
    en: "You've generated 3+ sequences!",
    zh: '你已生成 3+ 组序列！',
  },
  'banner.subtitle': {
    en: 'Upgrade to generate unlimited sequences + advanced features',
    zh: '升级以生成无限序列 + 高级功能',
  },
  'banner.cta': {
    en: 'Upgrade Now',
    zh: '立即升级',
  },

  // Language toggle
  'toggle.label': {
    en: 'EN',
    zh: '中',
  },

  // Agent Mode - Landing
  'landing.hero.agent': {
    en: 'Try Agent Mode (Auto-Pilot)',
    zh: '试试 Agent 模式（自动驾驶）',
  },

  // Mode Picker
  'landing.modepicker.autopilot': {
    en: 'Auto-Pilot Mode',
    zh: '自动驾驶模式',
  },
  'landing.modepicker.autopilot.desc': {
    en: 'AI does everything. Start free.',
    zh: 'AI 全自动处理。免费开始。',
  },
  'landing.modepicker.manual': {
    en: 'Manual Mode',
    zh: '手动模式',
  },
  'landing.modepicker.manual.desc': {
    en: 'Learn cold email. $19 one-time.',
    zh: '学习冷邮件技巧。一次性 $19。',
  },

  // Comparison table
  'landing.compare.title': {
    en: 'Which mode is right for you?',
    zh: '哪种模式适合你？',
  },
  'landing.compare.need': {
    en: 'Need',
    zh: '需求',
  },
  'landing.compare.manual': {
    en: 'Manual Mode',
    zh: '手动模式',
  },
  'landing.compare.autopilot': {
    en: 'Auto-Pilot Mode',
    zh: '自动驾驶模式',
  },
  'landing.compare.row1': {
    en: 'Learn cold email psychology?',
    zh: '学习冷邮件心理学？',
  },
  'landing.compare.row2': {
    en: 'Hands-off automation?',
    zh: '全自动化？',
  },
  'landing.compare.row3.label': {
    en: 'Cost to try',
    zh: '试用成本',
  },
  'landing.compare.row3.manual': {
    en: '$19 one-time',
    zh: '一次性 $19',
  },
  'landing.compare.row3.autopilot': {
    en: 'Free (5 emails/day)',
    zh: '免费（每天 5 封）',
  },
  'landing.compare.row4.label': {
    en: 'Best for',
    zh: '最适合',
  },
  'landing.compare.row4.manual': {
    en: 'Founders learning outreach',
    zh: '学习冷邮件的创始人',
  },
  'landing.compare.row4.autopilot': {
    en: 'Founders scaling outreach',
    zh: '想规模化发送的创始人',
  },

  // Updated footer
  'landing.footer.cta2': {
    en: 'Start Auto-Pilot Mode — Free',
    zh: '免费开始自动驾驶模式',
  },
  'landing.footer.note2': {
    en: 'Free plan: 5 emails/day. Pro: $29/month for 50/day. No credit card required.',
    zh: '免费计划：每天 5 封。Pro：$29/月 50 封/天。无需信用卡。',
  },

  // Agent Mode - Auth
  'agent.login.title': {
    en: 'Sign In to ColdCopy Agent',
    zh: '登录 ColdCopy Agent',
  },
  'agent.login.subtitle': {
    en: 'Autonomous cold email outreach',
    zh: '自主冷邮件外呼',
  },
  'agent.register.title': {
    en: 'Create Agent Account',
    zh: '创建 Agent 账户',
  },
  'agent.register.subtitle': {
    en: 'Set up autonomous cold email campaigns',
    zh: '设置自主冷邮件营销活动',
  },

  // Agent Mode - TopNav
  'agent.topnav.dashboard': {
    en: 'Dashboard',
    zh: '仪表盘',
  },
  'agent.topnav.settings': {
    en: 'Settings',
    zh: '设置',
  },
  'agent.topnav.logout': {
    en: 'Logout',
    zh: '退出',
  },
  'agent.topnav.back': {
    en: 'Back to ColdCopy',
    zh: '返回 ColdCopy',
  },

  // Agent Mode - Campaign
  'agent.campaign.status.active': {
    en: 'Active',
    zh: '进行中',
  },
  'agent.campaign.status.paused': {
    en: 'Paused',
    zh: '已暂停',
  },
  'agent.campaign.status.completed': {
    en: 'Completed',
    zh: '已完成',
  },
  'agent.campaign.leads': {
    en: 'leads',
    zh: '线索',
  },
  'agent.campaign.emails': {
    en: 'emails',
    zh: '邮件',
  },

  // Agent Mode - Lead Status
  'agent.lead.status.new': {
    en: 'New',
    zh: '新建',
  },
  'agent.lead.status.researched': {
    en: 'Researched',
    zh: '已调研',
  },
  'agent.lead.status.email_found': {
    en: 'Email Found',
    zh: '已找到邮箱',
  },
  'agent.lead.status.email_generated': {
    en: 'Email Generated',
    zh: '已生成邮件',
  },
  'agent.lead.status.sent': {
    en: 'Sent',
    zh: '已发送',
  },
  'agent.lead.status.failed': {
    en: 'Failed',
    zh: '失败',
  },

  // Agent Mode - Email Status
  'agent.email.status.draft': {
    en: 'Draft',
    zh: '草稿',
  },
  'agent.email.status.approved': {
    en: 'Approved',
    zh: '已批准',
  },
  'agent.email.status.queued': {
    en: 'Queued',
    zh: '排队中',
  },
  'agent.email.status.sent': {
    en: 'Sent',
    zh: '已发送',
  },
  'agent.email.status.failed': {
    en: 'Failed',
    zh: '失败',
  },

  // Agent Mode - Leads Table
  'agent.leads.col.company': {
    en: 'Company',
    zh: '公司',
  },
  'agent.leads.col.contact': {
    en: 'Contact',
    zh: '联系人',
  },
  'agent.leads.col.email': {
    en: 'Email',
    zh: '邮箱',
  },
  'agent.leads.col.status': {
    en: 'Status',
    zh: '状态',
  },
  'agent.leads.col.date': {
    en: 'Date',
    zh: '日期',
  },
  'agent.leads.empty': {
    en: 'No leads found yet. The agent will research leads automatically.',
    zh: '暂无线索。Agent 会自动研究线索。',
  },
  'agent.leads.status.new': {
    en: 'New',
    zh: '新建',
  },
  'agent.leads.status.researched': {
    en: 'Researched',
    zh: '已调研',
  },
  'agent.leads.status.email_found': {
    en: 'Email Found',
    zh: '已找到邮箱',
  },
  'agent.leads.status.email_generated': {
    en: 'Email Generated',
    zh: '已生成邮件',
  },
  'agent.leads.status.sent': {
    en: 'Sent',
    zh: '已发送',
  },
  'agent.leads.status.failed': {
    en: 'Failed',
    zh: '失败',
  },

  // Agent Mode - Emails Table
  'agent.emails.col.to': {
    en: 'To',
    zh: '收件人',
  },
  'agent.emails.col.subject': {
    en: 'Subject',
    zh: '主题',
  },
  'agent.emails.col.status': {
    en: 'Status',
    zh: '状态',
  },
  'agent.emails.col.date': {
    en: 'Date',
    zh: '日期',
  },
  'agent.emails.col.actions': {
    en: 'Actions',
    zh: '操作',
  },
  'agent.emails.empty': {
    en: 'No emails generated yet. The agent will create drafts after finding leads.',
    zh: '暂无邮件。Agent 会在找到线索后自动生成草稿。',
  },
  'agent.emails.approve': {
    en: 'Approve',
    zh: '批准',
  },
  'agent.emails.edit': {
    en: 'Edit',
    zh: '编辑',
  },
  'agent.emails.preview': {
    en: 'Preview',
    zh: '预览',
  },
  'agent.emails.status.draft': {
    en: 'Draft',
    zh: '草稿',
  },
  'agent.emails.status.approved': {
    en: 'Approved',
    zh: '已批准',
  },
  'agent.emails.status.queued': {
    en: 'Queued',
    zh: '排队中',
  },
  'agent.emails.status.sent': {
    en: 'Sent',
    zh: '已发送',
  },
  'agent.emails.status.failed': {
    en: 'Failed',
    zh: '失败',
  },

  // Agent Mode - Gmail
  'agent.gmail.connect': {
    en: 'Connect Gmail',
    zh: '连接 Gmail',
  },
  'agent.gmail.disconnect': {
    en: 'Disconnect',
    zh: '断开连接',
  },
  'agent.gmail.connected': {
    en: 'Connected as',
    zh: '已连接为',
  },
  'agent.gmail.not_connected': {
    en: 'Gmail not connected. Connect to send emails automatically.',
    zh: 'Gmail 未连接。连接后可自动发送邮件。',
  },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_STORAGE_KEY = 'coldcopy_lang';

function getInitialLang(): Lang {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;

  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const entry = translations[key];
      if (!entry) return key;
      let text: string = entry[lang] || entry.en;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside I18nProvider');
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useT();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="fixed top-4 right-4 z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-md"
      aria-label={lang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
      title={lang === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
      <span>{lang === 'en' ? '中文' : 'EN'}</span>
    </button>
  );
}
