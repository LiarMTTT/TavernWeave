/**
 * 神之手 · 浏览器半侧（1.1.0）
 *
 * 部件全部挂在 DSH 已声明的席位上：
 *   - shell.overlay                         ：Skill 轮盘（缩略态）+ 完整浮窗
 *       轮盘摆在左侧栏和对话栏之间的空白里，只露出一个巨大圆盘的一段弧；卡片沿弧线排布，
 *       滚轮 / 方向键 / 上下拖动旋转，技能之后的下一轮是功能入口。调用中的 Skill 高亮并转到中间。
 *       空白不够宽时整个轮盘不显示，不压对话。几何沿用沙盒 v22.1 定稿。
 *       完整浮窗可拖动、可缩放、不全屏，记住位置、尺寸和上次页签；收起后回到轮盘。
 *   - conversation.session.header.utilities ：会话头的神之手按钮（宿主原生 Button + Tooltip），开合完整浮窗
 *       旁边还有一个轮盘开关：显示/隐藏左侧的 Skill 轮盘，状态存本机；旧存储没有这个字段时按显示处理
 *   - conversation.input.dock               ：输入栏上方的 Soul 小浮窗，右对齐，不占布局
 *
 * 数据都来自真实宿主：
 *   - Skill 目录：ctx.remote.skills.list({ sessionId })，随会话预设变化
 *   - 调用状态与次数：屏幕上会话的事件流。模型调用 = tool/call(name=skill)；手动 /名字 = user/message(source.kind=skill-invocation)
 *     “调用中”指这次调用所在的轮次还没结束（turn/start … turn/end）
 *   - Soul：发送 `/activate-tavernweave-soul <TW 指令短语>`；当前模式从本会话最近一条 Soul 指令推断
 *   - 世界书：ctx.remote.directoryPicker.pick() 选目录；POST /godhand/worldbook/{select,read,save,versions}
 *     读写真实 .json，保存前由宿主备份；页面只显示真实响应，读/写失败直接显示 code / message。
 *   - 世界书：ctx.remote.directoryPicker.pick() 选目录；POST /godhand/worldbook/{select,read,save,versions}
 *     读写真实 .json，保存前由宿主备份；页面只显示真实响应，读/写失败直接显示 code / message。
 *   - 持久工作区：GET/POST /godhand/workspace 记住项目/版本/卡文件/世界书/MVU 选择；
 *     /godhand/project/scan 递归返回版本 relative，自动最新会跳过没有卡的最高版本；
 *     /godhand/card/{list,read} 列出版本目录和卡文件只读元信息。
 *     管理浮层可添加/删除/切换项目、切版本、选卡、自动最新；只在完整浮窗打开时轮询。
 *   - 卡内内容：选中 PNG/JSON 卡后 POST /godhand/card/inspect，只读接上卡内世界书和脚本元信息；
 *     不执行卡内 JS，不写卡文件/workspace。
 *   - 资料库：完整浮窗“前端设计＆动效数据库”页签直接显示 TW Library 离线挑选页 #design；
 *     openLibrary 遮罩保留给程序化入口。
 */
(() => {
  'use strict';

  const PLUGIN_ID = 'liarmttt-tavernweave-dsh';
  const UI_KEY = 'godhand.ui.v2';
  const SOUL_SKILL = 'activate-tavernweave-soul';
  const SKILL_MIME = 'application/x-godhand-skill';
  const EDGE = 8;
  const FULL_MIN = { w: 440, h: 340 };
  // 轮盘几何（沙盒 v22.1 定稿）：上 52 / 下 36 留白，卡间隙约为卡高 28%，最大倾角 9°。
  // 空白偏窄时先收窄卡片、再放平弧线（不低于 4°），还放不下就不显示。
  const WHEEL = {
    topPad: 52, bottomPad: 36, gapRatio: 0.28, minGap: 14, minSlots: 3, maxSlots: 14,
    theta: 9, minTheta: 4, cardMax: 210, cardSoft: 120, cardMin: 104, left: 12, right: 6,
    minW: 132, minH: 300, ease: 0.24,
    // 卡片窄于这个宽度时名字折成两行（在连字符处断开），省掉“拖到输入框插入”那行
    compactBelow: 180,
  };

  const TABS = [
    { id: 'skills', label: 'Skill' },
    { id: 'worldbook', label: '世界书' },
    { id: 'library', label: '前端设计＆动效数据库' },
  ];
  // 轮盘里技能之后的“下一轮”：功能入口，点开对应页签
  const FEATURES = [
    { tab: 'worldbook', name: '世界书', desc: '读写本机世界书 JSON · 真实文件' },
  ];
  // 轮盘分组：先 TW 自带的 23 个 Skill，再功能入口，最后是会话里其他来源的 Skill
  //（当前是 DSH 自带的 office / diagnose-windows-sandbox-acl）。
  // TW 的名单按 TavernWeave 2.2.0 的 skills/ 目录维护；TW 新增 Skill 时这里要一起加。
  const TW_SKILLS = new Set([
    'activate-tavernweave-soul', 'build-work-library', 'code-quality-workflow',
    'consult-tavernweave-library', 'orchestrate-project-blueprint', 'reflect-on-vibe-code-growth',
    'rewrite-natural-prose', 'rolecard-workshop-ops', 'shadcn-tailwind-ui',
    'sillytavern-api-reference', 'sillytavern-card-components', 'sillytavern-card-pipeline',
    'sillytavern-component-update', 'sillytavern-database-rolecards', 'sillytavern-embedded-ui',
    'sillytavern-extension-dev', 'sillytavern-media-live2d-runtime', 'sillytavern-render-regex-pipeline',
    'sillytavern-rolecard-performance', 'sillytavern-rolecard-security', 'sillytavern-runtime-debug',
    'tavern-card-builder', 'worldbook-design-and-writing',
  ]);
  // Skill 的标签、卡片短说明和悬停详情。
  // tag 是功能方向，显示在轮盘卡片左上角；short 是一行卡片说明；detail 是悬停里的完整介绍。
  // 名字保持英文，方便在输入框里直接调用；说明不依赖运行时翻译。
  const SKILL_META = Object.freeze({
    'activate-tavernweave-soul': {
      tag: '人格模式',
      short: '开启、切换或关闭四种 Soul 模式',
      detail: '把 Soul 作为当前任务的语气和教学叠加层开启、切换或关闭：阿瞳偏温和引导，MTTT.sir 偏严格拷打，灵魂杀手偏直接的前端审查，三席联席用于有边界的脑暴。只改表达和审查镜头，不扩大文件、网络、付费或发布权限。',
    },
    'build-work-library': {
      tag: '资料库',
      short: '整理原作、同人与网图资料',
      detail: '从小说、本地材料、网页和图片建立作品资料库：区分原作、同人、改编、剧透阶段和来源，支持人工编辑条目，导出 Markdown、JSONL 和可选 SQLite。适合二创前收集设定、整理同人资料，或给后续写卡留下可查的来源链。',
    },
    'code-quality-workflow': {
      tag: '质量审查',
      short: '全量/架构审查与最小修复',
      detail: '对软件、角色卡或混合项目做全量审查或架构审查：记录覆盖范围、保留所有发现、按门控做最小修复并回归验证。适合发布前体检、重构前评估，或需要把“哪里有问题、证据是什么、修了什么”讲清楚时。',
    },
    'consult-tavernweave-library': {
      tag: '指南库',
      short: '按需查 TW 指南与设计资料',
      detail: '把 TW 工作路由到随包指南、A0 工程检查单、设计与动效目录、概念/来源参考和离线挑选页；也负责大白话引导挡位的查询与修改。适合写文件前查 A0、做前端时找设计参考，或确认某个 TW 能力该由谁负责。',
    },
    'orchestrate-project-blueprint': {
      tag: '项目蓝图',
      short: '愿望 → 总设计案 / 蓝图 / NEXT',
      detail: '把模糊的产品、角色卡、前端或 Vibe Code 愿望收束成有边界的总设计案、First Playable、分级蓝图、可续接的 NEXT 和证据门；也能生成项目进度画板、记录反馈和防止长任务递归膨胀。适合从零开项目、接手半成品，或需要先定范围和验收再动手时。',
    },
    'reflect-on-vibe-code-growth': {
      tag: '成长评估',
      short: '重估 Vibe Code 能力并留履历',
      detail: '从当前宿主对话、工作区、项目状态和交付证据重新评估完整的 Vibe Code 能力网络，输出可独立复制的文字评估表和七章交互报告；只与真正可比的历史维度对照，并可保存脱敏的追加式履历。适合阶段性复盘、和上次履历比较，或只想看文字评估时。',
    },
    'rewrite-natural-prose': {
      tag: '文本精修',
      short: '去 AI 味，保留原意与结构',
      detail: '去掉 AI 味、八股、空话和重复结构，保留原意、事实、技术语法与引用；支持单次修改、任务级持续模式和分别授权的工作区/客户端持久模式。适合角色卡正文、对话、文档、计划和报告写得太像模板时。',
    },
    'rolecard-workshop-ops': {
      tag: '工坊运维',
      short: '角色卡工坊发布链与权限',
      detail: '面向由静态目录、包网关、对象存储、OAuth 归属、审核流和反向代理组成的角色卡工坊，做健康检查、API 合同对齐、发布/更新/下架流程、隐私审查、CORS 与回调诊断、容器/代理规划和明确授权后的部署。默认只读；没有明确授权不碰生产、凭据或访问权。',
    },
    'shadcn-tailwind-ui': {
      tag: '前端 UI',
      short: 'React / shadcn / Tailwind 界面',
      detail: '构建、改造或审阅基于 React、shadcn/ui、Radix 和 Tailwind 的可访问界面：组件组合、响应式布局、语义化 token、深浅主题、表单、对话框、表格、键盘交互和安全配置。适合 React/Vite/Next 项目的产品界面，不适合画布艺术、海报或非 React 框架。',
    },
    'sillytavern-api-reference': {
      tag: 'API 查证',
      short: 'ST / 助手 / MVU 版本 API',
      detail: '在实现或审查角色卡自动化前，查证 SillyTavern、Tavern Helper / JS-Slash-Runner、STScript、宏、提示词注入、世界书、EJS、MVU 和运行时库的确切能力与版本差异。适合不确定函数签名、事件载荷、斜杠命令语法、变量作用域、楼层操作或扩展能力时。',
    },
    'sillytavern-card-components': {
      tag: '拆卡组件',
      short: '拆卡、组件库与往返一致性',
      detail: '把 ST 角色卡从 JSON 或 PNG 安全拆成可审阅组件，设计或维护 registry 驱动的组件库与 recipe，追踪组件依赖和冲突，并做源卡到制品的往返一致性验证。适合接手别人的卡、模块化维护，或把成熟版本回灌共享组件库。',
    },
    'sillytavern-card-pipeline': {
      tag: '制卡流水线',
      short: '组装、JSON/PNG 与发布门',
      detail: '按项目现有工具编排角色卡的数据驱动开发、实时编辑、校验、JSON 打包、PNG 载荷嵌入、世界书版本同步和发布审计；根据改动范围选择验证，并区分检查点与公开发布。适合从开发到交付的整条制卡流水线。',
    },
    'sillytavern-component-update': {
      tag: '组件更新',
      short: '只改局部组件，明确交付边界',
      detail: '当只改角色卡内的正则、Tavern Helper 脚本/脚本文件夹或局部组件时，构建并验证最小更新，导出可导入的组件 JSON，明确“只交组件”还是“交整卡重封”。适合小范围热修，避免静默重打整张卡。',
    },
    'sillytavern-database-rolecards': {
      tag: '卡内数据',
      short: '表结构、楼层存储与迁移',
      detail: '设计并验证角色卡里的结构化数据：表 schema、稳定记录键、MVU 消息楼层存储、字段绑定、确定性迁移，以及状态栏/控制中心等消费者。适合卡开始像小型数据库应用，或需要跨楼层稳定读写时；不引入外部 SQL 服务。',
    },
    'sillytavern-embedded-ui': {
      tag: '卡内界面',
      short: '开局页、状态栏与控制中心',
      detail: '设计、实现或审阅角色卡内的框架无关界面：消息内容页、开局页、MVU 状态栏、控制中心、抽屉和弹窗；处理消息到页面的协议、状态到显示的映射、HTML/CSS/JS、交互状态、响应式、无障碍、安全渲染和可选前端沙盒。真实酒馆里的行为验收交给 runtime-debug。',
    },
    'sillytavern-extension-dev': {
      tag: 'ST 扩展',
      short: '扩展脚手架、manifest 与生命周期',
      detail: '创建或检查浏览器侧 SillyTavern UI 扩展：manifest、入口模块、生命周期钩子、设置命名空间、能力合同、版本预检和安装冒烟计划，不直接装进真实酒馆。适合从零做扩展或审查已有扩展的结构。',
    },
    'sillytavern-media-live2d-runtime': {
      tag: '媒体',
      short: '音频、图片、视频与 Live2D',
      detail: '为角色卡规划音频、图片、视频、多模态和 Live2D 资产：来源、预加载、绑定、能力检测、fallback 和生命周期合同，并给出真实宿主验收计划。适合需要媒体清单、Tavern Helper 音频接线或确定性预加载预算时。',
    },
    'sillytavern-render-regex-pipeline': {
      tag: '正则渲染',
      short: 'fixture 验证正则渲染阶段',
      detail: '用确定性 fixture 验证 SillyTavern 正则行为：规则位置、显示/提示词或卡内原始阶段、深度、启用状态和布尔标志；能对比卡内正则与 Tavern Helper 方言，复现替换，并解释某条规则在哪个渲染阶段被接受或跳过。离线 runner 不等于已安装酒馆引擎的证据。',
    },
    'sillytavern-rolecard-performance': {
      tag: '性能预算',
      short: '大卡体积、提示词与运行时预算',
      detail: '用确定性的大小、提示词、世界书、正则、助手脚本、嵌入媒体和捕获到的运行时预算来测量、比较和门控大角色卡；给出回归基线和最小优化方案，不静默删掉卡的行为。适合发布前性能体检或版本间回归比较。',
    },
    'sillytavern-rolecard-security': {
      tag: '安全审查',
      short: '注入、动态执行与远程加载风险',
      detail: '对角色卡 JSON、嵌入 HTML、正则替换、Tavern Helper 脚本、加载器和相关源码做只读安全审查：注入、动态执行、远程代码、通配消息、凭据形状和权限风险。适合导入前/发布前安全门，或与已批准基线对比；不执行可疑代码、不泄露密钥、不自动改。',
    },
    'sillytavern-runtime-debug': {
      tag: '真机调试',
      short: '真实酒馆复现、取证与验收',
      detail: '用可用的浏览器驱动在真实 SillyTavern 里复现、诊断和收集执行证据：导入、必需正则/助手脚本、宿主扩展、Git/CDN 或区域加载器、MVU/Zod、开局页、状态栏、控制中心、iframe、实时重载、控制台、响应式和交互。适合静态预览证明不了的行为；界面源码改动仍交回 embedded-ui。',
    },
    'tavern-card-builder': {
      tag: '卡创作',
      short: '文本 / MVU / 混合卡创作',
      detail: '规划并创作 SillyTavern 文本卡、MVU Zod 卡和混合卡：识别卡型与依赖，设计角色、玩家档案与能动性、可选角色阶段、世界书、变量、CoT、开场和提示词路由，维护创作权威与材料来源链。适合新卡、接手卡、独立角色提示词规则、开场风格诊断和字段追踪；独立世界书、打包、精确 API、真机调试和嵌入 UI 交给对应专职能力。',
    },
    'worldbook-design-and-writing': {
      tag: '世界书',
      short: '规划、拆合、审阅与精修世界书',
      detail: '独立于整卡创作来规划、拆分、合并、审阅和撰写 SillyTavern 世界书：场景信息需求、原生/模板加载、条目正文、条件、例外、知识边界和配套配置；支持保义改写和原生/模板/局部混合选择。适合只要世界书、改写条目或核对加载边界时；人物设计、精确 API、状态写入、真机验收和打包仍归原负责人。',
    },
    'diagnose-windows-sandbox-acl': {
      tag: '沙箱诊断',
      short: '修复 Windows 沙箱 ACL 拒绝',
      detail: '诊断 Windows 下 DSH 沙箱的 ACL 访问拒绝：工作区写入或列目录失败，或普通可读路径读不了。用随包命令检查路径和每一级父目录，并在同一次运行里修复它证明的 ACL 问题；预期的沙箱拦截不需要修。',
    },
    'office': {
      tag: 'Office',
      short: '创建、检查或转换 Office 文档',
      detail: '创建、检查或转换 Office 文档、表格、演示和 PDF；按任务选择合适的办公工作流，不把不同格式的处理混在一起。适合要生成或核对办公文件，但不确定该用 Word、Excel、PPT 还是 PDF 时。',
    },
    'office-docx': {
      tag: 'Word',
      short: '创建、读取、编辑 Word 文档',
      detail: '创建、读取、编辑并校验 Word 文档（.docx），保留标题、段落、表格等结构；完成后用校验步骤检查文件能打开、内容没丢。',
    },
    'office-export-pdf': {
      tag: 'PDF',
      short: '把 Office 文档转换成 PDF',
      detail: '把 Office 文档转换成你要求的 PDF；用 LibreOffice Kit 渲染/导出，并核对输出文件的分页、字体和图片。',
    },
    'office-pptx': {
      tag: 'PPT',
      short: '创建、读取、编辑 PowerPoint',
      detail: '创建、读取、编辑并校验 PowerPoint 演示（.pptx），包括版式、文字和视觉检查；适合做汇报、提案或需要逐页核对时。',
    },
    'office-recalculate': {
      tag: '表格重算',
      short: '刷新公式缓存并校验计算值',
      detail: '刷新电子表格的公式缓存，并用 LibreOffice Kit 校验计算后的值；适合公式结果过期、跨表引用或需要确认计算结果时。',
    },
    'office-render': {
      tag: '文档渲染',
      short: '把文档渲染成图片检查版式',
      detail: '把文档渲染成图片，检查视觉版式；适合交付前确认真实排版、分页、字体和样式是否和预期一致。',
    },
    'office-xlsx': {
      tag: 'Excel',
      short: '读取、创建、编辑 Excel 工作簿',
      detail: '读取、创建、编辑并校验 Excel 工作簿、数据和公式（.xlsx），包括工作表结构、格式和计算检查；适合数据整理、报表和公式核对。',
    },
  });

  // 发送用的短语取自 TW Soul 指令表（skills/activate-tavernweave-soul/SKILL.md）
  const SOULS = [
    { id: 'atong', name: '阿瞳', on: '阿瞳助我！', swap: '阿瞳接手' },
    { id: 'mttt', name: 'MTTT.sir', on: 'MTTT.sir，拷打我！', swap: 'MTTT.sir 上课' },
    { id: 'killer', name: '灵魂杀手', on: '灵魂杀手！', swap: '灵魂杀手接手' },
    { id: 'ensemble', name: '三席联席', on: 'Soul 三席就位', swap: '三席接手' },
  ];
  const SOUL_OFF = 'Soul 归位';
  // 与 resolve-soul-command.mjs 相同的规范化与短语表，只用来从会话消息推断当前模式
  const SOUL_PHRASES = new Map(Object.entries({
    '阿瞳助我': 'atong', 'mttt.sir,拷打我': 'mttt', '开启soul模式': 'atong', '/soul on': 'atong',
    '/soul on atong': 'atong', '/soul on mttt-sir': 'mttt', '灵魂杀手': 'killer', '开启灵魂杀手模式': 'killer',
    '强尼·银手,接管': 'killer', '强尼,骂醒我': 'killer', '启动relic故障检测': 'killer', '/soul on soul-killer': 'killer',
    '脑暴模式,soul联席': 'ensemble', '三人一起脑暴': 'ensemble', 'soul三席就位': 'ensemble', '/soul on ensemble': 'ensemble',
    '阿瞳接手': 'atong', 'mttt.sir上课': 'mttt', '/soul switch atong': 'atong', '/soul switch mttt-sir': 'mttt',
    '灵魂杀手接手': 'killer', '强尼接手': 'killer', '/soul switch soul-killer': 'killer', '三席接手': 'ensemble',
    '/soul switch ensemble': 'ensemble', 'soul归位': 'off', '阿瞳归位': 'off', 'mttt.sir下课': 'off',
    '结束soul模式': 'off', '强尼,下线': 'off', 'relic断开': 'off', '/soul off': 'off',
  }));

  const G = (window.__GODHAND__ = { version: '1.1.0', loaded: false, applied: false, errors: [], wheel: { reason: 'init' } });
  const fail = (where, error) => {
    const msg = where + ': ' + (error && error.message ? error.message : String(error));
    G.errors.push(msg);
    try { console.warn('[godhand] ' + msg); } catch {}
  };

  /* ---------------- 纯函数 ---------------- */

  function normalizeSoul(input) {
    const n = String(input).normalize('NFKC').trim().replace(/[！!。.]$/u, '').replace(/[，、]/gu, ',')
      .replace(/\s+/gu, ' ').replace(/\s*,\s*/gu, ',').toLowerCase();
    return n.startsWith('/') ? n : n.replace(/\s+/gu, '');
  }
  function soulFromText(text) {
    let t = String(text || '').trim();
    const prefix = '/' + SOUL_SKILL;
    if (t.startsWith(prefix)) t = t.slice(prefix.length).trim();
    if (!t || t.length > 40) return null;
    const n = normalizeSoul(t);
    if (SOUL_PHRASES.has(n)) return SOUL_PHRASES.get(n);
    if (/^(灵魂杀手|开启灵魂杀手模式),/u.test(n)) return 'killer';
    return null;
  }
  function textOf(content) {
    if (!Array.isArray(content)) return '';
    return content.map((c) => (c && c.type === 'text' && typeof c.text === 'string' ? c.text : '')).join('');
  }
  function skillArg(args) {
    if (args && typeof args === 'object') return typeof args.name === 'string' ? args.name : null;
    if (typeof args !== 'string') return null;
    try {
      const v = JSON.parse(args);
      if (v && typeof v.name === 'string') return v.name;
    } catch {}
    const m = /"name"\s*:\s*"([^"]+)"/u.exec(args);
    return m ? m[1] : null;
  }
  function newAcc() {
    return { seen: new Set(), calls: [], counts: Object.create(null), inUse: Object.create(null), openTurn: null, soul: 'off', presetChanged: false };
  }
  function addCall(acc, name, source, ev) {
    const key = ev.seq !== undefined ? ev.seq : ev.time + ':' + name;
    if (acc.seen.has(key)) return false;
    acc.seen.add(key);
    acc.calls.push({ name, source, seq: ev.seq, time: ev.time });
    acc.counts[name] = (acc.counts[name] || 0) + 1;
    if (acc.openTurn !== null) acc.inUse[name] = { since: ev.time };
    return true;
  }
  /** 把一条会话事件折叠进累加器；返回是否改变了可见状态。 */
  function applyEntry(acc, entry) {
    const ev = entry && entry.event ? entry.event : entry;
    if (!ev || typeof ev.type !== 'string') return false;
    const data = ev.data || {};
    switch (ev.type) {
      case 'turn/start':
        acc.openTurn = data.turn !== undefined ? data.turn : true;
        acc.inUse = Object.create(null);
        return true;
      case 'turn/end':
        acc.openTurn = null;
        acc.inUse = Object.create(null);
        return true;
      case 'tool/call': {
        if (data.name !== 'skill') return false;
        const name = skillArg(data.arguments);
        return name ? addCall(acc, name, 'model', ev) : false;
      }
      case 'user/message': {
        const src = data.source || {};
        if (src.kind === 'skill-invocation' && typeof src.name === 'string') return addCall(acc, src.name, 'user', ev);
        if (src.kind === 'user') {
          const mode = soulFromText(textOf(data.content));
          if (mode) { acc.soul = mode; return true; }
        }
        return false;
      }
      case 'agent-preset/selected':
        acc.presetChanged = true;
        return true;
      default:
        return false;
    }
  }
  function ago(time, now) {
    if (!Number.isFinite(time)) return '';
    const s = Math.max(0, Math.round((now - time) / 1000));
    if (s < 45) return '刚刚';
    const m = Math.round(s / 60);
    if (m < 60) return m + ' 分钟前';
    const hr = Math.round(m / 60);
    if (hr < 24) return hr + ' 小时前';
    const d = new Date(time);
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }
  function clock(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  /** 相邻两个槽位的卡片外框最多重叠多少像素（负数表示有间隙）。 */
  function slotOverlap(g) {
    const mid = (g.slots - 1) / 2;
    const half = (a) => (g.cardH * Math.cos(a) + g.cardW * Math.abs(Math.sin(a))) / 2;
    let worst = -Infinity;
    for (let k = 0; k < g.slots - 1; k++) worst = Math.max(worst, half((k - mid) * g.step) + half((k + 1 - mid) * g.step) - g.spacing);
    return worst;
  }
  /**
   * 轮盘几何。W/H 是可用空白，cardH 是量出来的卡片高度。
   * 卡片中心落在圆心 (X0 - R, Cy)、半径 R 的圆上，中间槽位最靠右，两端各倾斜 theta。
   * 返回 null 表示放不下。
   */
  function wheelGeometry(W, H, cardH) {
    if (!(W >= WHEEL.minW) || !(H >= WHEEL.minH) || !(cardH > 0)) return null;
    const deg = Math.PI / 180;
    const av = Math.max(120, H - WHEEL.topPad - WHEEL.bottomPad);
    const gap = Math.max(WHEEL.minGap, Math.round(cardH * WHEEL.gapRatio));
    const margins = WHEEL.left + WHEEL.right;
    const build = (slots) => {
      const spacing = slots > 1 ? (av - cardH) / (slots - 1) : 0;
      const halfSpan = spacing * (slots - 1) / 2;
      const shiftFor = (t) => halfSpan * Math.tan(t / 2);
      let theta = WHEEL.theta * deg;
      let cardW = Math.min(WHEEL.cardMax, W - margins - shiftFor(theta));
      if (cardW < WHEEL.cardSoft) {
        const room = W - margins - WHEEL.cardSoft;
        theta = Math.min(WHEEL.theta * deg, Math.max(WHEEL.minTheta * deg, 2 * Math.atan(Math.max(0, room) / Math.max(1, halfSpan))));
        cardW = Math.min(WHEEL.cardMax, W - margins - shiftFor(theta));
      }
      cardW = Math.floor(cardW);
      const shift = shiftFor(theta);
      const step = slots > 1 ? (2 * theta) / (slots - 1) : 0;
      const R = halfSpan > 0 ? halfSpan / Math.sin(theta) : 4000;
      const X0 = cardW / 2 + WHEEL.left + shift;
      return {
        slots, spacing, halfSpan, theta, step, R, X0, Cy: WHEEL.topPad + av / 2, cardW, cardH, shift, av,
        width: Math.min(W, Math.ceil(cardW + WHEEL.left + shift + WHEEL.right + 2)),
      };
    };
    let g = build(Math.max(WHEEL.minSlots, Math.min(WHEEL.maxSlots, Math.round(av / (cardH + gap)))));
    while (g.slots > WHEEL.minSlots && slotOverlap(g) > 20) g = build(g.slots - 1);
    return g.cardW >= WHEEL.cardMin && slotOverlap(g) <= 20 ? g : null;
  }
  /**
   * 圆心 (cx, cy)、半径 r 的圆在轮盘区高度 h 内的右侧弧线（SVG 路径）。
   * 不用超大的 CSS 圆角边框画圆：放进轮盘后它会被画扁（实测最外侧偏 15px），虚线就不再穿过卡片中心。
   */
  function ringPath(cx, cy, r, h) {
    if (!(r > 0)) return '';
    const y1 = Math.max(cy - r + 0.5, -20);
    const y2 = Math.min(cy + r - 0.5, h + 20);
    if (y2 <= y1) return '';
    const x = (y) => cx + Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    return 'M' + x(y1).toFixed(2) + ' ' + y1.toFixed(2) + 'A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 1 ' + x(y2).toFixed(2) + ' ' + y2.toFixed(2);
  }
  G.lib = { applyEntry, newAcc, soulFromText, skillArg, wheelGeometry, slotOverlap, ringPath };

  /* ---------------- 几何（C13：明确像素坐标，夹在可视区内） ---------------- */

  function frameTop() {
    try {
      const cs = getComputedStyle(document.documentElement);
      for (const name of ['--dsh-frame-overlay-top', '--dsh-frame-top-clearance', '--dsh-frame-chrome-top']) {
        const v = parseFloat(cs.getPropertyValue(name));
        if (Number.isFinite(v) && v > 0) return v;
      }
    } catch {}
    return 0;
  }
  function viewport() {
    const top = frameTop();
    return { x: 0, y: top, w: window.innerWidth, h: Math.max(1, window.innerHeight - top) };
  }
  function clampFull(r) {
    const v = viewport();
    const availW = Math.max(1, v.w - EDGE * 2);
    const availH = Math.max(1, v.h - EDGE * 2);
    const w = Math.min(Math.max(r.w, Math.min(FULL_MIN.w, availW)), availW);
    const hh = Math.min(Math.max(r.h, Math.min(FULL_MIN.h, availH)), availH);
    const x = Math.min(Math.max(r.x, v.x + EDGE), v.x + v.w - w - EDGE);
    const y = Math.min(Math.max(r.y, v.y + EDGE), v.y + v.h - hh - EDGE);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) };
  }
  function defaultFull() {
    const v = viewport();
    const w = Math.min(760, v.w - 96);
    const hh = Math.min(560, v.h - 96);
    // 第一次打开时尽量放在轮盘右边，两者都看得见
    let x = (v.w - w) / 2;
    const wheelRight = G.wheel.zoneRight;
    if (Number.isFinite(wheelRight) && wheelRight + 12 > x && wheelRight + 12 + w <= v.w - EDGE) x = wheelRight + 12;
    return clampFull({ x, y: v.y + (v.h - hh) / 2, w, h: hh });
  }
  function placeElement(el, r) {
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    if (r.w !== undefined) el.style.width = r.w + 'px';
    if (r.h !== undefined) el.style.height = r.h + 'px';
  }
  /** 统一的拖动/缩放：pointer capture，rAF 更新样式，松手才提交保存。 */
  function beginDrag(e, ref, compute, commit) {
    if (e.button !== 0) return;
    const handle = e.currentTarget;
    const isGrip = handle.classList.contains('gh2-grip');
    if (!isGrip && e.target.closest && e.target.closest('button, input, textarea, select, a, [role="tab"]')) return;
    const el = ref.current;
    if (!el) return;
    const sx = e.clientX;
    const sy = e.clientY;
    let next = null;
    let raf = 0;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    el.classList.add('gh2-busy');
    e.preventDefault();
    const move = (ev) => {
      next = compute(ev.clientX - sx, ev.clientY - sy);
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (next) placeElement(el, next); });
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      if (raf) cancelAnimationFrame(raf);
      el.classList.remove('gh2-busy');
      if (next) { placeElement(el, next); commit(next); }
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /* ---------------- 本机记忆（只存界面状态） ---------------- */

  function readUi() {
    try {
      const raw = JSON.parse(localStorage.getItem(UI_KEY) || 'null');
      if (!raw || raw.version !== 2) return null;
      const f = raw.full;
      const migratedTab = raw.tab === 'design' || raw.tab === 'motion' ? 'library' : raw.tab;
      return {
        // 0.2.0 的“关闭”状态已取消：缩略态就是轮盘
        mode: raw.mode === 'full' ? 'full' : 'compact',
        tab: TABS.some((t) => t.id === migratedTab) ? migratedTab : 'skills',
        full: f && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(f[k])) ? f : null,
        wheel: Number.isFinite(raw.wheel) && raw.wheel >= 0 ? Math.floor(raw.wheel) : 0,
        // 轮盘显示/隐藏：只有明确存了 false 才算隐藏，旧存储没有这个字段时照旧显示。
        wheelOn: raw.wheelOn !== false,
      };
    } catch {
      return null;
    }
  }
  function writeUi(ui) {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({ version: 2, mode: ui.mode, tab: ui.tab, full: ui.full, wheel: ui.wheel, wheelOn: ui.wheelOn !== false }));
    } catch {}
  }

  /* ---------------- 共享状态 ---------------- */

  function createStore(initial) {
    let state = initial;
    const listeners = new Set();
    return {
      get: () => state,
      set(patch) {
        const next = typeof patch === 'function' ? patch(state) : patch;
        if (!next) return;
        state = { ...state, ...next };
        for (const fn of [...listeners]) { try { fn(); } catch (error) { fail('listener', error); } }
      },
      subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    };
  }
  const EMPTY_ACTIVITY = Object.freeze({
    ready: false, calls: [], counts: {}, inUse: {}, openTurn: null, soul: 'off', total: 0, hasMore: false, running: false,
  });

  /* ---------------- M5：资料库 / 真实世界书状态切面 ---------------- */

  const M5 = Object.freeze({
    libPage: '/godhand/library/assets/picker/index.html',
    libTitles: Object.freeze({ design: '资料库 · 设计筛选页', motion: '资料库 · 动效筛选页' }),
    api: Object.freeze({
      select: '/godhand/worldbook/select',
      read: '/godhand/worldbook/read',
      save: '/godhand/worldbook/save',
      versions: '/godhand/worldbook/versions',
      mvuSelect: '/godhand/mvu/select',
      mvuInspect: '/godhand/mvu/inspect',
    }),
  });
  // 世界书页的真实状态：目录、文件、读到的 JSON、编辑草稿、错误和版本。
  // raw 是上一次从磁盘读到（或刚保存成功）的完整 JSON；entries 是它的可编辑副本。
  const EMPTY_WB = Object.freeze({
    root: '', rootInput: '',
    files: [], filesState: 'idle', folderError: '', picking: false,
    selectedPath: '', loadingFile: false, kind: '', entries: [], raw: null, openIndex: -1,
    dirty: false, saving: false, error: '', pendingUnknown: false,
    saveNotice: '', backup: '',
    versions: [], versionsError: '', versionsState: 'idle', versionsAt: 0,
  });
  function freshWb() { return { ...EMPTY_WB, files: [], entries: [], versions: [] }; }
  // MVU 组件区：只读选目录、选脚本、静态解析结果。不是运行时 Zod 校验，也没有 PASS/FAIL。
  const EMPTY_MVU = Object.freeze({
    root: '', rootInput: '', files: [], filesState: 'idle', folderError: '', picking: false,
    selectedPath: '', loadingFile: false, file: null, meta: null, schema: null, reason: '',
    warnings: [], error: '', inspectedAt: 0,
  });
  function freshMvu() { return { ...EMPTY_MVU, files: [], warnings: [] }; }

  /* ---------------- M5：持久工作区 / 项目 / 卡目录状态 ---------------- */

  const WORKSPACE_KEY = 'godhand.workspace.v1';
  const WORKSPACE_ROUTES = Object.freeze({
    state: '/godhand/workspace',
    scan: '/godhand/project/scan',
    cardList: '/godhand/card/list',
    cardRead: '/godhand/card/read',
    cardInspect: '/godhand/card/inspect',
  });
  function workspaceString(value) { return typeof value === 'string' ? value : ''; }
  function normalizeProject(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const root = workspaceString(raw.root);
    if (!root) return null;
    return {
      id: workspaceString(raw.id) || 'p-snapshot-' + index,
      root,
      label: workspaceString(raw.label) || basename(root),
      lastVersionDir: workspaceString(raw.lastVersionDir),
      lastCardPath: workspaceString(raw.lastCardPath),
      lastWorldbookRoot: workspaceString(raw.lastWorldbookRoot),
      lastWorldbookPath: workspaceString(raw.lastWorldbookPath),
      lastMvuRoot: workspaceString(raw.lastMvuRoot),
      lastMvuPath: workspaceString(raw.lastMvuPath),
      lastUsed: workspaceString(raw.lastUsed),
    };
  }
  function normalizeWorkspaceState(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const projects = (Array.isArray(source.projects) ? source.projects : []).map(normalizeProject).filter(Boolean);
    let activeProjectId = workspaceString(source.activeProjectId);
    if (!projects.some((project) => project.id === activeProjectId)) activeProjectId = projects.length ? projects[0].id : '';
    const fileState = (value) => ({ root: workspaceString(value && value.root), file: workspaceString(value && value.file) });
    return {
      version: Number(source.version) || 1,
      projects,
      activeProjectId,
      autoLatest: typeof source.autoLatest === 'boolean' ? source.autoLatest : true,
      worldbook: fileState(source.worldbook),
      mvu: fileState(source.mvu),
      ui: fileState(source.ui),
    };
  }
  function readWorkspaceSnapshot() {
    try {
      const raw = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || 'null');
      return raw && typeof raw === 'object' ? normalizeWorkspaceState(raw) : null;
    } catch {
      return null;
    }
  }
  const EMPTY_WS = Object.freeze({
    loaded: false, hostAvailable: false, hostError: '', statePath: '', savedAt: '',
    projects: [], activeProjectId: '', autoLatest: true,
    rootInput: '', picking: false, addError: '',
    versions: [], versionsRoot: '', versionsLatest: '', scanBusy: false, scanError: '',
    cards: [], cardsRoot: '', cardsLatest: '', cardsBusy: false, cardError: '',
    cardMeta: {}, cardReadErrors: {}, activeCard: null,
    cardDetail: null, cardInspectBusy: false, cardInspectError: '',
    legacyFocus: 0, legacyTab: 'structure', varWork: null,
    managerOpen: false, busy: false, restoreNotice: '', cardMissing: '', newAvailable: null,
    persistError: '', restoring: false,
  });
  function freshWs() { return { ...EMPTY_WS, projects: [], versions: [], cards: [], cardMeta: {}, cardReadErrors: {} }; }
  const workspaceSnapshot = readWorkspaceSnapshot();
  // 资料库遮罩：open 才渲染；status 为 loading / ready / error，绝不把失败画成空白 iframe。
  const EMPTY_LIB = Object.freeze({ open: false, tab: 'design', title: '', status: 'idle', url: '', error: '' });
  function freshLib() { return { ...EMPTY_LIB }; }

  const store = createStore({
    ui: readUi() || { mode: 'compact', tab: 'skills', full: null, wheel: 0, wheelOn: true },
    sessionId: undefined,
    catalog: { sessionId: undefined, state: 'none', skills: [], error: '' },
    activity: EMPTY_ACTIVITY,
    wb: freshWb(),
    mvu: freshMvu(),
    ws: workspaceSnapshot ? {
      ...freshWs(),
      projects: workspaceSnapshot.projects,
      activeProjectId: workspaceSnapshot.activeProjectId,
      autoLatest: workspaceSnapshot.autoLatest,
    } : freshWs(),
    lib: freshLib(),
    toast: null,
    focus: null,
    drop: null,
  });
  function setUi(patch) {
    store.set((s) => ({ ui: { ...s.ui, ...patch } }));
    writeUi(store.get().ui);
  }
  function setWb(patch) { store.set((s) => ({ wb: { ...s.wb, ...patch } })); }
  function setMvu(patch) { store.set((s) => ({ mvu: { ...s.mvu, ...patch } })); }
  function setWs(patch) { store.set((s) => ({ ws: { ...s.ws, ...patch } })); }
  function setLib(patch) { store.set((s) => ({ lib: { ...s.lib, ...patch } })); }
  let toastSeq = 0;
  function toast(text) {
    const id = ++toastSeq;
    store.set({ toast: { id, text } });
    setTimeout(() => { const t = store.get().toast; if (t && t.id === id) store.set({ toast: null }); }, 2600);
  }

  /* ---------------- 跟随屏幕上的会话 ---------------- */

  let ctxRef = null;
  let tracked = null;
  const inputRegistry = new Map();

  function untrack() {
    if (!tracked) return;
    clearTimeout(tracked.retry);
    clearInterval(tracked.poll);
    for (const off of tracked.offs) { try { off(); } catch {} }
    tracked = null;
  }
  function track(sid) {
    if (tracked && tracked.sid === sid) return;
    untrack();
    store.set({
      sessionId: sid,
      activity: EMPTY_ACTIVITY,
      catalog: { sessionId: sid, state: sid ? 'loading' : 'none', skills: [], error: '' },
    });
    if (!sid) return;
    tracked = { sid, offs: [], retry: 0, poll: 0 };
    attach(sid, 0);
  }
  function bindingOf(sid) {
    try { return sid ? ctxRef.sessions.binding(sid) : undefined; } catch { return undefined; }
  }
  function isOpen(binding) {
    try { return binding.session.getSnapshot().openState === 'open'; } catch { return false; }
  }
  function attach(sid, attempt) {
    if (!tracked || tracked.sid !== sid) return;
    const binding = bindingOf(sid);
    const ready = binding && binding.eventSource && typeof binding.eventSource.subscribe === 'function' && binding.session;
    if (!ready || !isOpen(binding)) {
      if (attempt < 30) tracked.retry = setTimeout(() => attach(sid, attempt + 1), 400);
      else store.set({ catalog: { sessionId: sid, state: 'error', skills: [], error: '会话没有打开' } });
      return;
    }
    const es = binding.eventSource;
    const running = () => { try { return !!binding.session.getSnapshot().running; } catch { return false; } };
    let acc = newAcc();
    const publish = () => {
      if (!tracked || tracked.sid !== sid) return;
      const snap = es.getSnapshot();
      store.set({
        activity: {
          ready: true,
          calls: acc.calls.slice(-40),
          counts: { ...acc.counts },
          inUse: { ...acc.inUse },
          openTurn: acc.openTurn,
          soul: acc.soul,
          total: acc.calls.length,
          hasMore: !!(snap && snap.hasMore),
          running: running(),
        },
      });
    };
    const rescan = () => {
      acc = newAcc();
      const snap = es.getSnapshot();
      for (const entry of (snap && snap.entries) || []) applyEntry(acc, entry);
      acc.presetChanged = false;
      publish();
    };
    tracked.offs.push(es.subscribe(() => {
      const snap = es.getSnapshot();
      const change = snap && snap.change;
      if (change && change.kind === 'append') {
        let dirty = false;
        for (const entry of change.entries || []) dirty = applyEntry(acc, entry) || dirty;
        if (acc.presetChanged) { acc.presetChanged = false; loadCatalog(sid); }
        if (dirty) publish();
      } else {
        rescan();
      }
    }));
    rescan();
    let lastRunning = running();
    const onSession = () => { const r = running(); if (r !== lastRunning) { lastRunning = r; publish(); } };
    if (typeof binding.session.subscribe === 'function') tracked.offs.push(binding.session.subscribe(onSession));
    else tracked.poll = setInterval(onSession, 1000);
    loadCatalog(sid);
  }
  async function loadCatalog(sid) {
    store.set((s) => ({
      catalog: { sessionId: sid, state: 'loading', skills: s.catalog.sessionId === sid ? s.catalog.skills : [], error: '' },
    }));
    try {
      const result = await ctxRef.remote.skills.list({ sessionId: sid });
      if (store.get().sessionId !== sid) return;
      if (!result || !result.ok) {
        const e = result && result.error;
        throw new Error(e ? e.code + '：' + e.message : '读取失败');
      }
      const skills = ((result.value && result.value.skills) || []).map((k) => {
        const name = String(k.name);
        const meta = SKILL_META[name];
        return {
          name,
          description: String(k.description || ''),
          tag: meta ? meta.tag : '其他',
          zh: meta ? meta.short : '',
          detail: meta ? meta.detail : '',
          tw: TW_SKILLS.has(name),
        };
      });
      store.set({ catalog: { sessionId: sid, state: 'ready', skills, error: '' } });
    } catch (error) {
      if (store.get().sessionId !== sid) return;
      fail('catalog', error);
      store.set({ catalog: { sessionId: sid, state: 'error', skills: [], error: String(error && error.message || error) } });
    }
  }

  /* ---------------- 动作 ---------------- */

  function composerEditable() {
    const els = [...document.querySelectorAll('[contenteditable="true"]')].filter((el) => {
      if (el.closest('.gh2-root')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 8;
    });
    els.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
    return els[0] || null;
  }
  /** 输入框外面那张圆角卡片（拖放的落点）。 */
  function composerCard() {
    const ed = composerEditable();
    for (let el = ed, i = 0; el && el !== document.body && i < 10; el = el.parentElement, i++) {
      if (el.getBoundingClientRect().width >= 240 && parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 12) return el;
    }
    return ed;
  }
  /** 把 `/名字 ` 插到当前会话输入框的光标处；不覆盖已经写好的草稿。 */
  function insertSkill(name) {
    const sid = store.get().sessionId;
    const text = '/' + name + ' ';
    const actions = sid ? inputRegistry.get(sid) : undefined;
    if (actions && typeof actions.captureInsertion === 'function' && typeof actions.insertText === 'function') {
      try {
        if (actions.insertText(text, actions.captureInsertion()) !== false) {
          const el = composerEditable();
          if (el) { try { el.focus({ preventScroll: true }); } catch {} }
          toast('已插入 /' + name);
          return 'input-actions';
        }
      } catch (error) {
        fail('insert', error);
      }
    }
    const el = composerEditable();
    if (el) {
      el.focus();
      if (document.execCommand('insertText', false, text)) { toast('已插入 /' + name); return 'dom'; }
    }
    toast('没有找到输入框');
    return null;
  }
  let focusSeq = 0;
  /** 打开完整浮窗的 Skill 页签，并展开这一项。 */
  function openSkill(name) {
    store.set({ focus: { name, seq: ++focusSeq } });
    setUi({ mode: 'full', tab: 'skills' });
  }
  function openTab(tab) {
    setUi({ mode: 'full', tab });
  }
  /** 运行 Skill：把 `/名字` 发给当前会话，和用户在输入框里按回车是同一条路径。 */
  async function runSkill(name) {
    const s = store.get();
    const binding = bindingOf(s.sessionId);
    if (!binding) { toast('先打开一个会话'); return { ok: false, error: 'no-session' }; }
    if (s.activity.inUse[name]) return { ok: true, skipped: true };
    try {
      const result = await binding.session.prompt([{ type: 'text', text: '/' + name }], 'queue');
      if (result && result.ok === false) {
        const code = result.error && result.error.code;
        toast('发送失败' + (code ? '：' + code : ''));
        return { ok: false, error: code || 'failed' };
      }
      toast('已发送 /' + name);
      return { ok: true, name };
    } catch (error) {
      fail('run', error);
      toast('发送失败');
      return { ok: false, error: String(error && error.message || error) };
    }
  }
  /** Soul 切换：发一条 `/activate-tavernweave-soul <短语>`，由 TW Soul 自己解析。 */
  async function sendSoul(id) {
    const s = store.get();
    const binding = bindingOf(s.sessionId);
    if (!binding) { toast('先打开一个会话'); return { ok: false, error: 'no-session' }; }
    const current = s.activity.soul;
    let phrase;
    if (id === 'off') {
      if (current === 'off') return { ok: true, skipped: true };
      phrase = SOUL_OFF;
    } else {
      const soul = SOULS.find((x) => x.id === id);
      if (!soul || current === id) return { ok: true, skipped: true };
      phrase = current === 'off' ? soul.on : soul.swap;
    }
    try {
      const result = await binding.session.prompt([{ type: 'text', text: '/' + SOUL_SKILL + ' ' + phrase }], 'queue');
      if (result && result.ok === false) {
        const code = result.error && result.error.code;
        toast('发送失败' + (code ? '：' + code : ''));
        return { ok: false, error: code || 'failed' };
      }
      toast('已发送：' + phrase);
      return { ok: true, phrase };
    } catch (error) {
      fail('soul', error);
      toast('发送失败');
      return { ok: false, error: String(error && error.message || error) };
    }
  }

  /* ---------------- M5：TW 资料库遮罩 ---------------- */

  let libSeq = 0;
  function errorText(error) { return error && error.message ? error.message : String(error); }
  function basename(path) {
    const text = String(path == null ? '' : path);
    const parts = text.split(/[\\/]/u);
    return parts[parts.length - 1] || text;
  }
  async function responseBody(res) {
    let text = '';
    try { text = await res.text(); } catch {}
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    return { text, data };
  }
  /** HTTP 失败的统一文案：优先用宿主 JSON 里的 code / message，不把 HTML 当成功。 */
  function failureText(res, text, data) {
    const code = data && typeof data.code === 'string' ? data.code : '';
    const message = data && typeof data.message === 'string' ? data.message : '';
    const clean = String(text || '').replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, 180);
    const detail = [code, message].filter(Boolean).join('：') || clean || res.statusText || '没有响应体';
    return 'HTTP ' + res.status + ' · ' + detail;
  }
  /** 同源 POST JSON；只有响应 ok === true 才当成功，失败保留真实 code / message。 */
  async function postJson(url, body) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error('请求没有发出去：' + errorText(error));
    }
    const { text, data } = await responseBody(res);
    if (!res.ok) throw new Error(failureText(res, text, data));
    if (!data || typeof data !== 'object') {
      throw new Error('HTTP ' + res.status + ' 的响应不是 JSON' + (text ? '：' + String(text).replace(/\s+/gu, ' ').slice(0, 120) : ''));
    }
    if (data.ok !== true) {
      const code = typeof data.code === 'string' ? data.code : 'failed';
      const message = typeof data.message === 'string' ? data.message : '宿主返回的 ok 不是 true';
      throw new Error(code + '：' + message);
    }
    return data;
  }
  /** 只读 GET JSON；和 POST 一样只接受 ok === true。 */
  async function getJson(url) {
    let res;
    try {
      res = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
    } catch (error) {
      throw new Error('请求没有发出去：' + errorText(error));
    }
    const { text, data } = await responseBody(res);
    if (!res.ok) throw new Error(failureText(res, text, data));
    if (!data || typeof data !== 'object') {
      throw new Error('HTTP ' + res.status + ' 的响应不是 JSON' + (text ? '：' + String(text).replace(/\s+/gu, ' ').slice(0, 120) : ''));
    }
    if (data.ok !== true) {
      const code = typeof data.code === 'string' ? data.code : 'failed';
      const message = typeof data.message === 'string' ? data.message : '宿主返回的 ok 不是 true';
      throw new Error(code + '：' + message);
    }
    return data;
  }
  /** 打开 iframe 前先确认路由真的返回了 TW 挑选页；503/404/别的静态页都当失败。 */
  async function probeLibrary() {
    let res;
    try {
      res = await fetch(M5.libPage, { method: 'GET', headers: { accept: 'text/html' } });
    } catch (error) {
      throw new Error('路由请求失败：' + errorText(error));
    }
    if (!res.ok) {
      const { text, data } = await responseBody(res);
      throw new Error(failureText(res, text, data));
    }
    const html = await res.text();
    if (!/TavernWeave Library/u.test(html) && !/picker\.js/u.test(html)) {
      throw new Error('HTTP ' + res.status + ' 返回的不是 TW 挑选页（路由可能没注册，或命中了别的静态页）');
    }
  }
  async function openLibrary(tab) {
    if (tab !== 'design' && tab !== 'motion') return { ok: false, error: 'unknown-library-tab' };
    if (store.get().ws.managerOpen) setWs({ managerOpen: false });
    const seq = ++libSeq;
    const url = M5.libPage + '#' + tab;
    setLib({ open: true, tab, title: M5.libTitles[tab], status: 'loading', url: '', error: '' });
    try {
      await probeLibrary();
      if (seq !== libSeq || !store.get().lib.open) return { ok: false, error: 'closed' };
      setLib({ status: 'ready', url });
      return { ok: true, url };
    } catch (error) {
      if (seq !== libSeq) return { ok: false, error: 'superseded' };
      setLib({ status: 'error', url: '', error: '资料库没找到：' + errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }
  function closeLibrary() {
    libSeq += 1;
    setLib(freshLib());
  }

  /* ---------------- M5：世界书真实文件（select / read / save / versions） ---------------- */

  let wbSeq = 0;
  let saveSeq = 0;
  let verSeq = 0;
  let mvuSeq = 0;
  function parseKeys(text) {
    return String(text == null ? '' : text).split(/[,，]/u).map((s) => s.trim()).filter(Boolean);
  }
  function asStringList(value) {
    if (Array.isArray(value)) return value.filter((x) => typeof x === 'string' || typeof x === 'number').map((x) => String(x));
    if (typeof value === 'string') return parseKeys(value);
    return [];
  }
  function wbKind(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)
      && raw.entries && typeof raw.entries === 'object' && !Array.isArray(raw.entries)) return 'st-object';
    if (Array.isArray(raw)) return 'st-array';
    return 'unknown';
  }
  function normalizeWbEntry(source, slot, fallbackUid) {
    const e = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const keys = asStringList(e.key !== undefined ? e.key : e.keys);
    return {
      slot: String(slot),
      uid: e.uid !== undefined && e.uid !== null ? e.uid : fallbackUid,
      comment: String(e.comment !== undefined ? e.comment : e.title !== undefined ? e.title : ''),
      content: String(e.content !== undefined ? e.content : e.body !== undefined ? e.body : ''),
      keys,
      keysText: keys.join(', '),
      secondary: asStringList(e.keysecondary !== undefined ? e.keysecondary : e.secondary),
    };
  }
  /** 前端归一化：st-object 取 json.entries 对象，st-array 取数组；其他一律 unknown。 */
  function normalizeWb(raw) {
    const kind = wbKind(raw);
    if (kind === 'st-object') {
      const entries = raw.entries;
      return {
        kind,
        entries: Object.keys(entries).map((slot) => normalizeWbEntry(entries[slot], slot, /^\d+$/u.test(slot) ? Number(slot) : undefined)),
      };
    }
    if (kind === 'st-array') return { kind, entries: raw.map((entry, index) => normalizeWbEntry(entry, index, index)) };
    return { kind, entries: [] };
  }
  // 回写时优先沿用条目原本用的字段名（comment/title、content/body、key/keys…），没有才创建 ST 标准字段。
  const WB_WRITE_FIELDS = Object.freeze({
    comment: ['comment', 'title'],
    content: ['content', 'body'],
    key: ['key', 'keys'],
    keysecondary: ['keysecondary', 'secondary'],
  });
  function writeWbField(target, names, value) {
    const name = names.find((n) => Object.prototype.hasOwnProperty.call(target, n)) || names[0];
    target[name] = value;
  }
  function writeWbEntry(target, entry) {
    writeWbField(target, WB_WRITE_FIELDS.comment, String(entry.comment || ''));
    writeWbField(target, WB_WRITE_FIELDS.content, String(entry.content || ''));
    writeWbField(target, WB_WRITE_FIELDS.key, parseKeys(entry.keysText));
    writeWbField(target, WB_WRITE_FIELDS.keysecondary, asStringList(entry.secondary));
  }
  /** 基于原 raw 结构回写编辑；保留未知字段，不重排条目。 */
  function buildWbSaveJson(wb) {
    if (!wb.raw || typeof wb.raw !== 'object') throw new Error('没有可保存的 JSON（文件没读到，或根节点不是对象/数组）');
    if (wb.kind !== 'st-object' && wb.kind !== 'st-array') return wb.raw;
    const clone = JSON.parse(JSON.stringify(wb.raw));
    if (wb.kind === 'st-array') {
      wb.entries.forEach((entry, index) => {
        const target = clone[index];
        if (target && typeof target === 'object' && !Array.isArray(target)) writeWbEntry(target, entry);
      });
    } else {
      wb.entries.forEach((entry) => {
        const target = clone.entries[entry.slot];
        if (target && typeof target === 'object' && !Array.isArray(target)) writeWbEntry(target, entry);
      });
    }
    return clone;
  }
  function formatSize(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n < 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KiB';
    return (n / 1024 / 1024).toFixed(1) + ' MiB';
  }
  function formatMtime(value) {
    if (value === undefined || value === null || value === '') return '时间未知';
    let d;
    if (typeof value === 'number' || /^\d+$/u.test(String(value))) {
      const n = Number(value);
      d = new Date(n < 1e12 ? n * 1000 : n);
    } else {
      d = new Date(value);
    }
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('zh-CN', { hour12: false });
  }
  function jsonPreview(value) {
    try {
      const text = JSON.stringify(value, null, 2);
      if (typeof text !== 'string') return String(value);
      return text.length > 20000 ? text.slice(0, 20000) + '\n…（已截断，原始文件更大）' : text;
    } catch (error) {
      return '无法显示 JSON：' + errorText(error);
    }
  }
  function updateWbEntry(index, patch) {
    const wb = store.get().wb;
    if (!(index >= 0) || index >= wb.entries.length) return;
    const entries = wb.entries.slice();
    entries[index] = { ...entries[index], ...patch };
    setWb({ entries, dirty: true, saveNotice: '', pendingUnknown: false });
  }
  /** 统一调用宿主的原生目录选择器；取消返回 cancelled，服务缺失/异常保留真实原因。 */
  async function requestHostDirectory() {
    let rp;
    try { rp = ctxRef && ctxRef.remote ? ctxRef.remote.directoryPicker : undefined; } catch { rp = undefined; }
    if (!rp || typeof rp.pick !== 'function') return { ok: false, reason: 'unavailable' };
    let result;
    try {
      result = await rp.pick();
    } catch (error) {
      return { ok: false, reason: 'error', detail: errorText(error) };
    }
    if (!result || result.ok !== true) {
      const e = result && result.error;
      return { ok: false, reason: 'error', detail: e ? [e.code, e.message].filter(Boolean).join('：') : '未知错误' };
    }
    const path = result.value;
    if (path === null || path === undefined) return { ok: true, cancelled: true };
    if (typeof path !== 'string' || !path.trim()) return { ok: false, reason: 'empty' };
    return { ok: true, path };
  }
  function directoryPickMessage(pick) {
    if (pick.reason === 'unavailable') return '宿主没有提供目录选择服务（remote.directoryPicker）。请用下面的“或输入目录路径”打开目录。';
    if (pick.reason === 'empty') return '目录选择器返回了空路径。请改用目录路径。';
    return '目录选择器调用失败：' + (pick.detail || '未知错误') + '。请改用目录路径。';
  }
  async function pickWorldbookRoot() {
    if (store.get().wb.picking) return { ok: false, error: 'busy' };
    setWb({ picking: true, folderError: '' });
    try {
      const pick = await requestHostDirectory();
      if (pick.cancelled) {
        toast('已取消选择目录');
        return { ok: true, cancelled: true };
      }
      if (!pick.ok) {
        setWb({ folderError: directoryPickMessage(pick) });
        return { ok: false, error: pick.detail || pick.reason };
      }
      setWb({ rootInput: pick.path });
      return await openWorldbookRoot(pick.path);
    } finally {
      if (store.get().wb.picking) setWb({ picking: false });
    }
  }
  async function openWorldbookRoot(input) {
    const root = String(input == null ? '' : input).trim();
    const current = store.get().wb;
    if (!root) {
      setWb({ folderError: '先填世界书目录的绝对路径。' });
      return { ok: false, error: 'empty-root' };
    }
    if (current.dirty && typeof window.confirm === 'function'
      && !window.confirm('当前世界书还有未保存修改。切换目录会丢掉这些修改，继续吗？')) {
      return { ok: false, cancelled: true };
    }
    const seq = ++wbSeq;
    setWb({ ...freshWb(), rootInput: root, filesState: 'loading', picking: false });
    try {
      const data = await postJson(M5.api.select, { root });
      if (seq !== wbSeq) return { ok: false, error: 'superseded' };
      const files = (Array.isArray(data.files) ? data.files : []).map((file) => ({
        path: String(file && file.path ? file.path : ''),
        name: String(file && file.name ? file.name : basename(file && file.path)),
        size: Number(file && file.size),
        mtime: file && file.mtime !== undefined ? file.mtime : null,
      })).filter((file) => file.path);
      const shownRoot = typeof data.root === 'string' && data.root ? data.root : root;
      setWb({ root: shownRoot, files, filesState: 'ready', folderError: '', error: '' });
      clearRestoreNotice('世界书');
      // 组件目录与世界书共用同一个根；同步宿主 selectedMvuRoot。
      const mvuSync = await openMvuRoot(shownRoot);
      patchActiveProject({ lastWorldbookRoot: shownRoot, lastMvuRoot: store.get().mvu.root || '' });
      scheduleWorkspaceSave();
      return { ok: true, root: shownRoot, files: files.length, mvuSync: mvuSync.ok };
    } catch (error) {
      if (seq !== wbSeq) return { ok: false, error: 'superseded' };
      setWb({ ...freshWb(), rootInput: root, filesState: 'error', folderError: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }
  async function readWorldbookFile(path) {
    const target = String(path == null ? '' : path);
    if (!target) return { ok: false, error: 'empty-path' };
    const current = store.get().wb;
    if (current.dirty && typeof window.confirm === 'function'
      && !window.confirm('当前文件还有未保存修改。重新读取会丢掉这些修改，继续吗？')) {
      return { ok: false, cancelled: true };
    }
    const seq = ++wbSeq;
    setWb({
      selectedPath: target, loadingFile: true, kind: '', entries: [], raw: null, openIndex: -1,
      dirty: false, error: '', saveNotice: '', backup: '', pendingUnknown: false,
      versions: [], versionsError: '', versionsState: 'idle', versionsAt: 0,
    });
    try {
      const data = await postJson(M5.api.read, { path: target });
      if (seq !== wbSeq) return { ok: false, error: 'superseded' };
      const raw = data.json === undefined ? null : data.json;
      const normalized = normalizeWb(raw);
      setWb({
        selectedPath: typeof data.path === 'string' && data.path ? data.path : target,
        loadingFile: false,
        kind: normalized.kind,
        raw,
        entries: normalized.entries,
        openIndex: normalized.entries.length ? 0 : -1,
        dirty: false,
        error: '',
      });
      const shownPath = store.get().wb.selectedPath;
      clearRestoreNotice('世界书');
      patchActiveProject({ lastWorldbookRoot: store.get().wb.root, lastWorldbookPath: shownPath });
      scheduleWorkspaceSave();
      refreshWbVersions(shownPath);
      return { ok: true, kind: normalized.kind, entries: normalized.entries.length };
    } catch (error) {
      if (seq !== wbSeq) return { ok: false, error: 'superseded' };
      setWb({ loadingFile: false, kind: '', raw: null, entries: [], openIndex: -1, error: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }
  async function refreshWbVersions(path) {
    const target = String(path == null ? '' : path);
    if (!target) return { ok: false, error: 'empty-path' };
    if (store.get().wb.selectedPath !== target) return { ok: false, error: 'stale-file' };
    const seq = ++verSeq;
    setWb({ versionsState: 'loading', versionsError: '' });
    try {
      const data = await postJson(M5.api.versions, { path: target });
      if (seq !== verSeq || store.get().wb.selectedPath !== target) return { ok: false, error: 'superseded' };
      const versions = (Array.isArray(data.versions) ? data.versions : []).map((version) => ({
        path: String(version && version.path ? version.path : ''),
        name: String(version && version.name ? version.name : basename(version && version.path)),
        size: Number(version && version.size),
        mtime: version && version.mtime !== undefined ? version.mtime : null,
      })).filter((version) => version.path);
      setWb({ versions, versionsState: 'ready', versionsError: '', versionsAt: Date.now() });
      return { ok: true, versions: versions.length };
    } catch (error) {
      if (seq !== verSeq) return { ok: false, error: 'superseded' };
      setWb({ versions: [], versionsState: 'error', versionsError: errorText(error), versionsAt: Date.now() });
      return { ok: false, error: errorText(error) };
    }
  }
  async function saveWorldbook() {
    const wb = store.get().wb;
    if (wb.saving) return { ok: false, error: 'busy' };
    if (!wb.selectedPath) return { ok: false, error: 'no-file' };
    if (wb.kind === 'unknown' && !wb.pendingUnknown) {
      setWb({ pendingUnknown: true, saveNotice: '', error: '' });
      return { ok: false, confirm: true };
    }
    let json;
    try {
      json = wb.kind === 'st-object' || wb.kind === 'st-array' ? buildWbSaveJson(wb) : wb.raw;
    } catch (error) {
      setWb({ error: '无法生成保存内容：' + errorText(error) });
      return { ok: false, error: errorText(error) };
    }
    if (json === null || json === undefined) {
      setWb({ error: '没有可保存的 JSON（文件没读到，或根节点是 null）。' });
      return { ok: false, error: 'no-json' };
    }
    const seq = ++saveSeq;
    setWb({ saving: true, error: '', pendingUnknown: false });
    try {
      const data = await postJson(M5.api.save, { path: wb.selectedPath, json });
      if (seq !== saveSeq) return { ok: false, error: 'superseded' };
      const savedPath = typeof data.path === 'string' && data.path ? data.path : wb.selectedPath;
      const backup = typeof data.backup === 'string' ? data.backup : '';
      if (store.get().wb.selectedPath !== wb.selectedPath) {
        // 保存过程中用户切到了别的文件：旧文件已真实写入，但不要把新文件的页面状态覆盖回去。
        setWb({ saving: false });
        toast('已保存上一个文件；当前文件没有被覆盖');
        return { ok: true, path: savedPath, backup, switched: true };
      }
      setWb({
        saving: false, dirty: false, raw: json, selectedPath: savedPath, backup,
        saveNotice: '已保存到磁盘：' + savedPath + (backup ? '；旧版备份：' + backup : '；宿主没有返回备份路径'),
      });
      patchActiveProject({ lastWorldbookRoot: store.get().wb.root, lastWorldbookPath: savedPath });
      scheduleWorkspaceSave();
      refreshWbVersions(savedPath);
      toast('已保存世界书');
      return { ok: true, path: savedPath, backup };
    } catch (error) {
      if (seq !== saveSeq) return { ok: false, error: 'superseded' };
      if (store.get().wb.selectedPath !== wb.selectedPath) {
        setWb({ saving: false });
        toast('上一个文件保存失败：' + errorText(error));
        return { ok: false, error: errorText(error), switched: true };
      }
      setWb({ saving: false, error: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }

  /* ---------------- M5：MVU 组件目录 / Zod Schema 静态解析 ---------------- */

  function normalizeMvuFile(file) {
    return {
      path: String(file && file.path ? file.path : ''),
      name: String(file && file.name ? file.name : basename(file && file.path)),
      size: Number(file && file.size),
      mtime: file && file.mtime !== undefined ? file.mtime : null,
    };
  }
  function normalizeMvuSchema(schema) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null;
    return {
      parser: typeof schema.parser === 'string' ? schema.parser : '',
      roots: Array.isArray(schema.roots) ? schema.roots : [],
      nodeCount: Number(schema.nodeCount) || 0,
      warnings: Array.isArray(schema.warnings) ? schema.warnings.map((warning) => String(warning)) : [],
    };
  }
  async function pickMvuRoot() {
    if (store.get().mvu.picking) return { ok: false, error: 'busy' };
    setMvu({ picking: true, folderError: '' });
    try {
      const pick = await requestHostDirectory();
      if (pick.cancelled) {
        toast('已取消选择目录');
        return { ok: true, cancelled: true };
      }
      if (!pick.ok) {
        setMvu({ folderError: directoryPickMessage(pick) });
        return { ok: false, error: pick.detail || pick.reason };
      }
      setMvu({ rootInput: pick.path });
      return await openMvuRoot(pick.path);
    } finally {
      if (store.get().mvu.picking) setMvu({ picking: false });
    }
  }
  async function openMvuRoot(input) {
    const root = String(input == null ? '' : input).trim();
    if (!root) {
      setMvu({ folderError: '先填 MVU 组件目录的绝对路径。' });
      return { ok: false, error: 'empty-root' };
    }
    const seq = ++mvuSeq;
    setMvu({ ...freshMvu(), rootInput: root, filesState: 'loading', picking: false });
    try {
      const data = await postJson(M5.api.mvuSelect, { root });
      if (seq !== mvuSeq) return { ok: false, error: 'superseded' };
      const files = (Array.isArray(data.files) ? data.files : []).map(normalizeMvuFile).filter((file) => file.path);
      const shownRoot = typeof data.root === 'string' && data.root ? data.root : root;
      setMvu({ root: shownRoot, files, filesState: 'ready', folderError: '', error: '' });
      clearRestoreNotice('MVU');
      patchActiveProject({ lastMvuRoot: shownRoot });
      scheduleWorkspaceSave();
      return { ok: true, root: shownRoot, files: files.length };
    } catch (error) {
      if (seq !== mvuSeq) return { ok: false, error: 'superseded' };
      setMvu({ ...freshMvu(), rootInput: root, filesState: 'error', folderError: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }
  async function inspectMvuFile(path) {
    const target = String(path == null ? '' : path);
    if (!target) return { ok: false, error: 'empty-path' };
    const seq = ++mvuSeq;
    setMvu({
      selectedPath: target, loadingFile: true, file: null, meta: null, schema: null,
      reason: '', warnings: [], error: '', inspectedAt: 0,
    });
    try {
      const data = await postJson(M5.api.mvuInspect, { path: target });
      if (seq !== mvuSeq) return { ok: false, error: 'superseded' };
      const file = data.file && typeof data.file === 'object' ? normalizeMvuFile(data.file) : null;
      const meta = data.meta && typeof data.meta === 'object' ? {
        type: data.meta.type,
        enabled: data.meta.enabled,
        name: data.meta.name,
        id: data.meta.id,
        contentLength: data.meta.contentLength,
      } : null;
      const schema = normalizeMvuSchema(data.schema);
      // 没有 schema 时宿主把 warnings 放在顶层（parse-error / no-zod-object）；有 schema 时在 schema.warnings。
      const topWarnings = Array.isArray(data.warnings) ? data.warnings.map((warning) => String(warning)) : [];
      setMvu({
        loadingFile: false,
        selectedPath: file && file.path ? file.path : target,
        file,
        meta,
        schema,
        reason: !schema && typeof data.reason === 'string' ? data.reason : '',
        warnings: schema ? schema.warnings : topWarnings,
        error: '',
        inspectedAt: Date.now(),
      });
      clearRestoreNotice('MVU');
      patchActiveProject({ lastMvuRoot: store.get().mvu.root, lastMvuPath: store.get().mvu.selectedPath });
      scheduleWorkspaceSave();
      return { ok: true, schema: !!schema, reason: !schema && typeof data.reason === 'string' ? data.reason : '' };
    } catch (error) {
      if (seq !== mvuSeq) return { ok: false, error: 'superseded' };
      setMvu({ loadingFile: false, schema: null, reason: '', warnings: [], error: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }

  /* ---------------- M5：工作区持久化 / 项目管理 / 卡目录 ---------------- */

  let wsLoadSeq = 0;
  let wsRefreshInFlight = false;
  let wsRestoring = false;
  let cardSeq = 0;
  let cardInspectSeq = 0;
  const AUTO_VERSION_CARD_LIMIT = 8;
  let wsSaveTimer = 0;
  let wsPersistSeq = 0;
  let wsNoticeKey = '';

  function projectById(id) { return store.get().ws.projects.find((project) => project.id === id) || null; }
  function activeProject() { return projectById(store.get().ws.activeProjectId); }
  function patchActiveProject(patch) {
    const ws = store.get().ws;
    if (!ws.activeProjectId) return;
    setWs({ projects: ws.projects.map((project) => (project.id === ws.activeProjectId ? { ...project, ...patch } : project)) });
  }
  function workspaceStateFromStore() {
    const s = store.get();
    const ws = s.ws;
    const now = new Date().toISOString();
    const projects = ws.projects.map((project) => {
      if (project.id !== ws.activeProjectId) return { ...project };
      return {
        ...project,
        lastVersionDir: ws.versionsRoot || project.lastVersionDir || '',
        lastCardPath: (ws.activeCard && ws.activeCard.file && ws.activeCard.file.path) || project.lastCardPath || '',
        lastWorldbookRoot: s.wb.root || project.lastWorldbookRoot || '',
        lastWorldbookPath: s.wb.selectedPath || project.lastWorldbookPath || '',
        lastMvuRoot: s.mvu.root || project.lastMvuRoot || '',
        lastMvuPath: s.mvu.selectedPath || project.lastMvuPath || '',
        lastUsed: now,
      };
    });
    return {
      version: 1,
      projects,
      activeProjectId: ws.activeProjectId,
      autoLatest: ws.autoLatest,
      worldbook: { root: s.wb.root || '', file: s.wb.selectedPath || '' },
      mvu: { root: s.mvu.root || '', file: s.mvu.selectedPath || '' },
      ui: { root: '', file: '' },
    };
  }
  function writeWorkspaceSnapshot(state) {
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
    } catch {}
  }
  async function saveWorkspaceState(state) {
    const seq = ++wsPersistSeq;
    try {
      const data = await postJson(WORKSPACE_ROUTES.state, { state });
      if (seq !== wsPersistSeq) return { ok: true, stale: true };
      setWs({ savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date().toISOString(), persistError: '' });
      return { ok: true };
    } catch (error) {
      if (seq !== wsPersistSeq) return { ok: false, stale: true };
      setWs({ persistError: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
  }
  function scheduleWorkspaceSave() {
    const state = workspaceStateFromStore();
    writeWorkspaceSnapshot(state);
    if (!store.get().ws.hostAvailable || wsRestoring) return;
    if (wsSaveTimer) clearTimeout(wsSaveTimer);
    wsSaveTimer = setTimeout(() => {
      wsSaveTimer = 0;
      saveWorkspaceState(state);
    }, 300);
  }
  function addRestoreNotice(text) {
    if (!text) return;
    const current = store.get().ws.restoreNotice;
    if (current.includes(text)) return;
    setWs({ restoreNotice: current ? current + '\n' + text : text });
  }
  function clearRestoreNotice(part) {
    const current = store.get().ws.restoreNotice;
    if (!current) return;
    const lines = current.split('\n');
    const kept = lines.filter((line) => !line.includes(part));
    if (kept.length !== lines.length) setWs({ restoreNotice: kept.join('\n') });
  }
  function normalizeVersion(value) {
    return {
      path: workspaceString(value && value.path),
      name: workspaceString(value && value.name) || basename(value && value.path),
      relative: workspaceString(value && value.relative),
      version: workspaceString(value && value.version),
      mtime: value && value.mtime !== undefined ? value.mtime : null,
    };
  }
  function normalizeCardFile(value) {
    return {
      path: workspaceString(value && value.path),
      name: workspaceString(value && value.name) || basename(value && value.path),
      size: Number(value && value.size),
      mtime: value && value.mtime !== undefined ? value.mtime : null,
      version: workspaceString(value && value.version),
    };
  }
  function normalizeCardRead(data) {
    const file = normalizeCardFile(data && data.file);
    const meta = data && data.meta && typeof data.meta === 'object' ? data.meta : {};
    return {
      kind: workspaceString(data && data.kind) || 'unknown',
      file,
      meta: {
        name: workspaceString(meta.name),
        spec: workspaceString(meta.spec),
        specVersion: workspaceString(meta.specVersion),
        characterName: workspaceString(meta.characterName),
        characterVersion: workspaceString(meta.characterVersion),
        creator: workspaceString(meta.creator),
        createDate: workspaceString(meta.createDate),
      },
      hasWorldbook: !!(data && data.hasWorldbook),
      worldbookEntryCount: Number(data && data.worldbookEntryCount) || 0,
      scriptCount: Number(data && data.scriptCount) || 0,
      regexCount: Number(data && data.regexCount) || 0,
    };
  }
  function splitCardKeys(value) {
    const source = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(/[,，]/u) : []);
    return source.map((item) => workspaceString(item).trim()).filter(Boolean);
  }
  function normalizeCardWorldbookEntry(value, index) {
    const raw = value && typeof value === 'object' ? value : {};
    const keys = splitCardKeys(raw.keys).length ? splitCardKeys(raw.keys)
      : (typeof raw.key === 'string' ? splitCardKeys(raw.key) : []);
    const secondary = splitCardKeys(raw.secondary).length ? splitCardKeys(raw.secondary)
      : splitCardKeys(raw.keysecondary);
    return {
      key: workspaceString(raw.key) || keys.join(', '),
      uid: raw.uid !== undefined && raw.uid !== null ? raw.uid : index,
      comment: workspaceString(raw.comment) || workspaceString(raw.title),
      content: workspaceString(raw.content),
      keys,
      secondary,
    };
  }
  function normalizeCardScript(value, index) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      id: workspaceString(raw.id),
      name: workspaceString(raw.name) || workspaceString(raw.id) || ('脚本 ' + (index + 1)),
      type: workspaceString(raw.type) || 'script',
      enabled: raw.enabled === true,
      contentLength: Number(raw.contentLength) || 0,
      hasSchema: raw.hasSchema === true,
    };
  }
  /** card/inspect 的 legacyVars 通常形如 { stat_data: {...} }；只取初始值对象，原样只读。 */
  function normalizeCardLegacys(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const candidate = value.stat_data !== undefined ? value.stat_data
      : (value.statData !== undefined ? value.statData : value);
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    return { statData: candidate };
  }
  /** /card/inspect 只读载荷：卡内世界书、静态 Zod、脚本元信息；不保存正文到 workspace。 */
  function normalizeCardInspect(data) {
    const base = normalizeCardRead(data);
    const wbRaw = data && data.worldbook && typeof data.worldbook === 'object' ? data.worldbook : {};
    const entries = (Array.isArray(wbRaw.entries) ? wbRaw.entries : []).map(normalizeCardWorldbookEntry);
    const worldbook = {
      name: workspaceString(wbRaw.name),
      count: Number.isFinite(Number(wbRaw.count)) && Number(wbRaw.count) >= 0 ? Number(wbRaw.count) : entries.length,
      entries,
    };
    let mvu = null;
    if (data && data.mvu && typeof data.mvu === 'object' && !Array.isArray(data.mvu)) {
      const source = data.mvu;
      const scriptRaw = source.script && typeof source.script === 'object' ? source.script : {};
      const schema = normalizeMvuSchema(source.schema);
      const schemaScriptRaw = source.schemaScript && typeof source.schemaScript === 'object' ? source.schemaScript : null;
      const ruleEntries = (Array.isArray(source.updateRuleEntries) ? source.updateRuleEntries : [])
        .map((entry, index) => {
          const raw = entry && typeof entry === 'object' ? entry : {};
          return {
            id: raw.id !== undefined && raw.id !== null ? String(raw.id) : 'rule-' + (index + 1),
            name: workspaceString(raw.name) || ('更新规则 ' + (index + 1)),
            content: workspaceString(raw.content),
          };
        })
        .filter((entry) => entry.content);
      if (!ruleEntries.length && source.updateRules) {
        ruleEntries.push({ id: 'rule-1', name: '更新规则', content: workspaceString(source.updateRules) });
      }
      const initVarRaw = source.initVar && typeof source.initVar === 'object' ? source.initVar : null;
      mvu = {
        script: normalizeCardScript(scriptRaw, 0),
        schema,
        schemaSource: workspaceString(source.schemaSource),
        schemaScript: schemaScriptRaw ? {
          id: workspaceString(schemaScriptRaw.id),
          name: workspaceString(schemaScriptRaw.name),
        } : null,
        updateRules: workspaceString(source.updateRules) || ruleEntries.map((entry) => entry.content).join('\n\n'),
        updateRuleEntries: ruleEntries,
        initVarSource: workspaceString(source.initVarSource),
        initVarName: workspaceString(source.initVarName),
        initVar: initVarRaw && typeof initVarRaw.kind === 'string' ? {
          kind: initVarRaw.kind,
          id: initVarRaw.id !== undefined && initVarRaw.id !== null ? String(initVarRaw.id) : '',
          name: workspaceString(initVarRaw.name),
        } : null,
        reason: workspaceString(source.reason),
        warnings: Array.isArray(source.warnings) ? source.warnings.map((warning) => String(warning)) : [],
      };
      mvu.script.hasSchema = !!schema;
    }
    const scripts = (Array.isArray(data && data.scripts) ? data.scripts : []).map(normalizeCardScript);
    return {
      ...base,
      hasWorldbook: entries.length > 0 || base.hasWorldbook,
      worldbookEntryCount: worldbook.count,
      scriptCount: scripts.length,
      worldbook,
      mvu,
      scripts,
      legacyVars: normalizeCardLegacys(data && data.legacyVars),
    };
  }
  async function scanProjectRoot(root) {
    const data = await postJson(WORKSPACE_ROUTES.scan, { root });
    const versions = (Array.isArray(data.versions) ? data.versions : []).map(normalizeVersion).filter((version) => version.path);
    const latest = typeof data.latest === 'string' && data.latest
      ? data.latest
      : (versions.length ? versions[0].path : workspaceString(data.root) || root);
    return { root: workspaceString(data.root) || root, versions, latest };
  }
  async function cardListRoot(root) {
    const data = await postJson(WORKSPACE_ROUTES.cardList, { root });
    const files = (Array.isArray(data.files) ? data.files : []).map(normalizeCardFile).filter((file) => file.path);
    return {
      root: workspaceString(data.root) || root,
      files,
      latest: typeof data.latest === 'string' && data.latest ? data.latest : (files.length ? files[0].path : ''),
    };
  }
  function isCardRead(info) {
    return !!info && (info.kind === 'card-png' || info.kind === 'card-json');
  }
  async function inspectCardDetail(root, path, options = {}) {
    const seq = ++cardInspectSeq;
    setWs({ cardDetail: null, cardInspectBusy: true, cardInspectError: '' });
    try {
      const data = await postJson(WORKSPACE_ROUTES.cardInspect, { root, path });
      if (seq !== cardInspectSeq) return { ok: false, error: 'superseded' };
      const detail = normalizeCardInspect(data);
      setWs({ cardDetail: detail, cardInspectBusy: false, cardInspectError: '' });
      return { ok: true, detail };
    } catch (error) {
      if (seq !== cardInspectSeq) return { ok: false, error: 'superseded' };
      const message = errorText(error);
      setWs({ cardDetail: null, cardInspectBusy: false, cardInspectError: message });
      if (!options.silent) toast('卡内内容读取失败：' + message);
      return { ok: false, error: message };
    }
  }
  async function selectCard(root, path, options = {}) {
    const target = workspaceString(path);
    if (!target) return { ok: false, error: 'empty-path' };
    let info = store.get().ws.cardMeta[target];
    if (!info) {
      try {
        info = normalizeCardRead(await postJson(WORKSPACE_ROUTES.cardRead, { root, path: target }));
      } catch (error) {
        setWs({
          cardError: errorText(error), activeCard: null, cardDetail: null,
          cardInspectBusy: false, cardInspectError: '',
        });
        if (!options.silent) toast('卡文件读取失败：' + errorText(error));
        return { ok: false, error: errorText(error) };
      }
    }
    if (!isCardRead(info)) {
      const message = '这个文件是 ' + (info.kind || 'unknown') + '，不是角色卡；请选 PNG/JSON 卡文件。';
      setWs({ cardError: message });
      if (!options.silent) toast(message);
      return { ok: false, error: message };
    }
    setWs({ activeCard: info, cardError: '', cardMissing: '' });
    clearRestoreNotice('卡文件');
    patchActiveProject({ lastCardPath: target });
    scheduleWorkspaceSave();
    const inspected = await inspectCardDetail(root, target, { silent: !!options.silent });
    return {
      ok: true,
      card: info,
      detail: inspected.ok ? inspected.detail : null,
      inspectError: inspected.ok ? '' : inspected.error,
    };
  }
  async function loadCards(root, options = {}) {
    const seq = ++cardSeq;
    cardInspectSeq += 1;
    setWs({
      cardsBusy: true, cards: [], cardsRoot: root, cardsLatest: '', cardError: '',
      cardMeta: {}, cardReadErrors: {}, activeCard: null, cardMissing: '',
      cardDetail: null, cardInspectBusy: false, cardInspectError: '',
    });
    let list;
    try {
      list = await cardListRoot(root);
    } catch (error) {
      if (seq === cardSeq) setWs({ cardsBusy: false, cardError: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
    if (seq !== cardSeq) return { ok: false, error: 'superseded' };
    setWs({ cards: list.files, cardsRoot: list.root, cardsLatest: '', cardsBusy: false, cardError: '' });
    const meta = {};
    const errors = {};
    for (const file of list.files) {
      try {
        meta[file.path] = normalizeCardRead(await postJson(WORKSPACE_ROUTES.cardRead, { root: list.root, path: file.path }));
      } catch (error) {
        errors[file.path] = errorText(error);
      }
      if (seq !== cardSeq) return { ok: false, error: 'superseded' };
      setWs({ cardMeta: { ...meta }, cardReadErrors: { ...errors } });
    }
    const cardFiles = list.files.filter((file) => isCardRead(meta[file.path]));
    const latestCard = cardFiles.length ? cardFiles[0].path : '';
    setWs({ cardsLatest: latestCard });
    const wanted = options.selectLatest
      ? latestCard
      : (options.preferredPath && cardFiles.some((file) => file.path === options.preferredPath) ? options.preferredPath : '');
    let activePath = '';
    if (wanted) {
      const selected = await selectCard(list.root, wanted, { auto: !!options.auto, silent: true });
      if (selected.ok) activePath = wanted;
    } else if (options.selectLatest) {
      setWs({ cardMissing: '没有识别到 PNG/JSON 卡文件；世界书 JSON 不算卡。' });
    } else if (options.preferredPath) {
      setWs({ cardMissing: '上次卡文件不在了，请重新选：' + options.preferredPath });
    }
    scheduleWorkspaceSave();
    return { ok: true, files: list.files, latest: latestCard, anyLatest: list.latest, activePath };
  }
  /**
   * 从 host card/list 的顺序里找第一个真正的角色卡（card-png/card-json）。
   * 世界书 JSON 可能语义版本更高、mtime 更新，但它不是卡，不能当成“最新卡”。
   */
  async function latestCardInFiles(root, files) {
    for (const file of files) {
      let info = store.get().ws.cardMeta[file.path];
      if (!info) {
        try {
          info = normalizeCardRead(await postJson(WORKSPACE_ROUTES.cardRead, { root, path: file.path }));
        } catch {
          continue;
        }
        setWs({ cardMeta: { ...store.get().ws.cardMeta, [file.path]: info } });
      }
      if (isCardRead(info)) return { path: file.path, info };
    }
    return null;
  }
  /**
   * 自动最新跳过没有卡的最高版本；有界检查最多 8 个版本。
   * host 的 versions 已按 semver/mtime 降序，返回第一个有 PNG/JSON 卡的版本。
   */
  async function pickVersionWithCards(versions, latestPath) {
    const source = Array.isArray(versions) && versions.length
      ? versions
      : (latestPath ? [{ path: latestPath, name: basename(latestPath), relative: '' }] : []);
    const candidates = source.slice(0, AUTO_VERSION_CARD_LIMIT);
    let checked = 0;
    for (const version of candidates) {
      if (!version || !version.path) continue;
      checked += 1;
      try {
        const list = await cardListRoot(version.path);
        const card = await latestCardInFiles(version.path, list.files);
        if (card) return { found: true, version, checked };
      } catch {
        // 单个候选卡目录读不到就继续向下找；真正切过去时由 loadCards 显示真实错误。
      }
    }
    return { found: false, version: candidates[0] || null, checked };
  }
  function noCardsMessage(pick, latestPath) {
    const checked = pick && pick.checked ? pick.checked : 0;
    return '没有识别到卡：已检查 ' + checked + ' 个版本'
      + (latestPath ? '，最高版本 ' + basename(latestPath) + '也没有 PNG/JSON 卡' : '')
      + '。';
  }
  async function restoreWorldbookSelection(root, file) {
    if (!root) return { ok: true, skipped: true };
    const opened = await openWorldbookRoot(root);
    if (!opened.ok) {
      setWb({ root, rootInput: root, filesState: 'error', folderError: errorText(opened.error || '世界书目录读取失败') });
      addRestoreNotice('上次世界书目录不在了，请重新选：' + root);
      return { ok: false, error: opened.error };
    }
    const target = workspaceString(file);
    if (target) {
      const wb = store.get().wb;
      if (wb.files.some((entry) => entry.path === target)) {
        const read = await readWorldbookFile(target);
        if (!read.ok) addRestoreNotice('上次世界书文件读取失败：' + errorText(read.error));
      } else {
        setWb({ selectedPath: '', loadingFile: false, kind: '', entries: [], raw: null, openIndex: -1, dirty: false, error: '' });
        addRestoreNotice('上次世界书文件不在了，请重新选：' + target);
      }
    }
    patchActiveProject({ lastWorldbookRoot: store.get().wb.root, lastWorldbookPath: store.get().wb.selectedPath || '' });
    scheduleWorkspaceSave();
    return { ok: true };
  }
  async function restoreMvuSelection(root, file) {
    if (!root) return { ok: true, skipped: true };
    const current = store.get().mvu;
    const alreadyOpen = current.root === root && current.filesState === 'ready';
    const opened = alreadyOpen ? { ok: true } : await openMvuRoot(root);
    if (!opened.ok) {
      setMvu({ root, rootInput: root, filesState: 'error', folderError: errorText(opened.error || 'MVU 目录读取失败') });
      addRestoreNotice('上次 MVU 目录不在了，请重新选：' + root);
      return { ok: false, error: opened.error };
    }
    const target = workspaceString(file);
    if (target) {
      const mvu = store.get().mvu;
      if (mvu.files.some((entry) => entry.path === target)) {
        const read = await inspectMvuFile(target);
        if (!read.ok) addRestoreNotice('上次 MVU 文件读取失败：' + errorText(read.error));
      } else {
        setMvu({ selectedPath: '', loadingFile: false, file: null, meta: null, schema: null, reason: '', warnings: [], error: '' });
        addRestoreNotice('上次 MVU 文件不在了，请重新选：' + target);
      }
    }
    patchActiveProject({ lastMvuRoot: store.get().mvu.root, lastMvuPath: store.get().mvu.selectedPath || '' });
    scheduleWorkspaceSave();
    return { ok: true };
  }
  async function restoreWorkspaceState(state) {
    setWs({
      projects: state.projects, activeProjectId: state.activeProjectId, autoLatest: state.autoLatest,
      versions: [], versionsRoot: '', versionsLatest: '', scanError: '', cards: [], cardsRoot: '', cardsLatest: '',
      cardError: '', cardMissing: '', activeCard: null, restoreNotice: '',
      cardDetail: null, cardInspectBusy: false, cardInspectError: '',
    });
    const project = projectById(state.activeProjectId);
    if (project) {
      try {
        const scan = await scanProjectRoot(project.root);
        setWs({ versions: scan.versions, versionsLatest: scan.latest });
        const autoPick = state.autoLatest ? await pickVersionWithCards(scan.versions, scan.latest) : null;
        const preferred = autoPick && autoPick.version && autoPick.version.path
          ? autoPick.version.path
          : (state.autoLatest
            ? scan.latest
            : ((scan.versions.find((version) => version.path === project.lastVersionDir) || {}).path || scan.latest));
        setWs({ versionsRoot: preferred });
        await loadCards(preferred, {
          selectLatest: state.autoLatest,
          preferredPath: state.autoLatest ? '' : project.lastCardPath,
          auto: true,
        });
        if (autoPick && !autoPick.found) setWs({ cardMissing: noCardsMessage(autoPick, scan.latest) });
      } catch (error) {
        setWs({ scanError: errorText(error) });
      }
    }
    const wbRoot = state.worldbook.root || (project && project.lastWorldbookRoot) || '';
    const wbFile = wbRoot ? (state.worldbook.file || (project && project.lastWorldbookPath) || '') : '';
    const savedMvuRoot = state.mvu.root || (project && project.lastMvuRoot) || '';
    const sharedRoot = wbRoot || savedMvuRoot;
    if (sharedRoot) {
      await restoreWorldbookSelection(sharedRoot, wbFile);
      const alignedRoot = store.get().wb.root || sharedRoot;
      const sameRoot = !savedMvuRoot || savedMvuRoot === alignedRoot;
      const mvuFile = sameRoot ? (state.mvu.file || (project && project.lastMvuPath) || '') : '';
      if (!sameRoot) addRestoreNotice('上次变量目录和世界书目录不同，已按世界书目录对齐：' + alignedRoot);
      await restoreMvuSelection(alignedRoot, mvuFile);
    }
  }
  async function loadWorkspace() {
    const seq = ++wsLoadSeq;
    const snapshot = readWorkspaceSnapshot();
    let state = null;
    let hostError = '';
    let hostAvailable = false;
    let statePath = '';
    let savedAt = '';
    try {
      const data = await getJson(WORKSPACE_ROUTES.state);
      state = normalizeWorkspaceState(data.state || {});
      hostAvailable = true;
      statePath = workspaceString(data.path);
      savedAt = workspaceString(data.savedAt);
    } catch (error) {
      hostError = '工作区读取失败：' + errorText(error);
      state = snapshot || normalizeWorkspaceState({});
    }
    if (seq !== wsLoadSeq) return { ok: false, error: 'superseded' };
    setWs({ hostAvailable, hostError, statePath, savedAt, busy: true, restoring: true, loaded: false });
    wsRestoring = true;
    try {
      await restoreWorkspaceState(state || normalizeWorkspaceState({}));
    } finally {
      wsRestoring = false;
      setWs({ loaded: true, busy: false, restoring: false });
      writeWorkspaceSnapshot(workspaceStateFromStore());
      if (hostAvailable) scheduleWorkspaceSave();
    }
    return { ok: true, hostAvailable };
  }
  function openProjectManager() {
    closeLibrary();
    setWs({ managerOpen: true });
    refreshLatest();
  }
  function closeProjectManager() { setWs({ managerOpen: false }); }
  async function pickProjectRoot() {
    if (store.get().ws.picking || store.get().ws.busy) return { ok: false, error: 'busy' };
    setWs({ picking: true, addError: '' });
    try {
      const pick = await requestHostDirectory();
      if (pick.cancelled) { toast('已取消选择目录'); return { ok: true, cancelled: true }; }
      if (!pick.ok) {
        setWs({ addError: directoryPickMessage(pick) });
        return { ok: false, error: pick.detail || pick.reason };
      }
      setWs({ rootInput: pick.path });
      return await addProject(pick.path);
    } finally {
      if (store.get().ws.picking) setWs({ picking: false });
    }
  }
  async function addProject(root) {
    if (store.get().ws.busy || store.get().ws.scanBusy) return { ok: false, error: 'busy' };
    const target = String(root == null ? '' : root).trim();
    if (!target) {
      setWs({ addError: '先填项目目录的绝对路径。' });
      return { ok: false, error: 'empty-root' };
    }
    setWs({ addError: '', scanBusy: true });
    let scan;
    try {
      scan = await scanProjectRoot(target);
    } catch (error) {
      setWs({ scanBusy: false, addError: errorText(error) });
      return { ok: false, error: errorText(error) };
    }
    const ws = store.get().ws;
    const existing = ws.projects.find((project) => project.root === scan.root);
    if (existing) {
      setWs({ scanBusy: false, rootInput: '' });
      await switchProject(existing.id);
      return { ok: true, existing: true, projectId: existing.id };
    }
    const auto = ws.autoLatest;
    const autoPick = auto ? await pickVersionWithCards(scan.versions, scan.latest) : null;
    const preferred = autoPick && autoPick.version && autoPick.version.path ? autoPick.version.path : scan.latest;
    const project = {
      id: 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      root: scan.root,
      label: basename(scan.root),
      lastVersionDir: preferred,
      lastCardPath: '',
      lastWorldbookRoot: '',
      lastWorldbookPath: '',
      lastMvuRoot: '',
      lastMvuPath: '',
      lastUsed: new Date().toISOString(),
    };
    // 新项目没有自己的共享根，避免把上一个项目的世界书/组件 Schema 带进来。
    setWb(freshWb());
    setMvu(freshMvu());
    setWs({
      projects: [...ws.projects, project],
      activeProjectId: project.id,
      versions: scan.versions,
      versionsLatest: scan.latest,
      versionsRoot: preferred,
      scanBusy: false,
      rootInput: '',
      addError: '',
      scanError: '',
      cardMissing: '',
      newAvailable: null,
      busy: true,
    });
    try {
      await loadCards(preferred, { selectLatest: auto, auto: true });
      if (autoPick && !autoPick.found) setWs({ cardMissing: noCardsMessage(autoPick, scan.latest) });
    } finally {
      setWs({ busy: false });
    }
    scheduleWorkspaceSave();
    toast('已添加项目：' + project.label);
    return { ok: true, projectId: project.id, root: project.root };
  }
  async function switchProject(id) {
    if (store.get().ws.busy) return { ok: false, error: 'busy' };
    const project = projectById(id);
    if (!project) return { ok: false, error: 'not-found' };
    setWs({
      activeProjectId: id, busy: true, versions: [], versionsRoot: '', versionsLatest: '',
      scanError: '', cards: [], cardsRoot: '', cardsLatest: '', cardError: '', cardMissing: '',
      activeCard: null, restoreNotice: '', newAvailable: null,
      cardDetail: null, cardInspectBusy: false, cardInspectError: '',
    });
    patchActiveProject({ lastUsed: new Date().toISOString() });
    try {
      const scan = await scanProjectRoot(project.root);
      const auto = store.get().ws.autoLatest;
      const autoPick = auto ? await pickVersionWithCards(scan.versions, scan.latest) : null;
      const preferred = autoPick && autoPick.version && autoPick.version.path
        ? autoPick.version.path
        : (auto
          ? scan.latest
          : ((scan.versions.find((version) => version.path === project.lastVersionDir) || {}).path || scan.latest));
      setWs({ versions: scan.versions, versionsLatest: scan.latest, versionsRoot: preferred, scanError: '' });
      await loadCards(preferred, { selectLatest: auto, preferredPath: auto ? '' : project.lastCardPath, auto });
      if (autoPick && !autoPick.found) setWs({ cardMissing: noCardsMessage(autoPick, scan.latest) });
    } catch (error) {
      setWs({ scanError: errorText(error) });
    }
    const sharedRoot = project.lastWorldbookRoot || project.lastMvuRoot;
    if (sharedRoot) {
      const wbFile = project.lastWorldbookRoot === sharedRoot ? project.lastWorldbookPath : '';
      await restoreWorldbookSelection(sharedRoot, wbFile);
      const alignedRoot = store.get().wb.root || sharedRoot;
      const mvuFile = project.lastMvuRoot === alignedRoot ? project.lastMvuPath : '';
      await restoreMvuSelection(alignedRoot, mvuFile);
    } else {
      setWb(freshWb());
      setMvu(freshMvu());
    }
    setWs({ busy: false });
    scheduleWorkspaceSave();
    toast('已切换项目：' + project.label);
    return { ok: true, projectId: id };
  }
  async function deleteProject(id) {
    if (store.get().ws.busy) return { ok: false, error: 'busy' };
    const ws = store.get().ws;
    const project = projectById(id);
    if (!project) return { ok: false, error: 'not-found' };
    const remaining = ws.projects.filter((item) => item.id !== id);
    const wasActive = ws.activeProjectId === id;
    setWs({
      projects: remaining,
      activeProjectId: wasActive ? (remaining.length ? remaining[0].id : '') : ws.activeProjectId,
      versions: wasActive ? [] : ws.versions,
      versionsRoot: wasActive ? '' : ws.versionsRoot,
      versionsLatest: wasActive ? '' : ws.versionsLatest,
      cards: wasActive ? [] : ws.cards,
      cardsRoot: wasActive ? '' : ws.cardsRoot,
      cardsLatest: wasActive ? '' : ws.cardsLatest,
      activeCard: wasActive ? null : ws.activeCard,
      cardDetail: wasActive ? null : ws.cardDetail,
      cardInspectBusy: wasActive ? false : ws.cardInspectBusy,
      cardInspectError: wasActive ? '' : ws.cardInspectError,
      scanError: '', cardError: '', cardMissing: '', newAvailable: null,
    });
    scheduleWorkspaceSave();
    toast('已删除项目：' + project.label + '（不会删除磁盘文件）');
    if (wasActive && remaining.length) await switchProject(remaining[0].id);
    if (wasActive && !remaining.length) { setWb(freshWb()); setMvu(freshMvu()); }
    return { ok: true };
  }
  async function switchVersion(path) {
    if (store.get().ws.busy) return { ok: false, error: 'busy' };
    const ws = store.get().ws;
    const project = activeProject();
    const target = workspaceString(path);
    if (!project || !target) return { ok: false, error: 'no-project' };
    if (store.get().wb.dirty || store.get().wb.saving) {
      const message = '世界书还有未保存修改，未切换版本：' + basename(target);
      setWs({ newAvailable: { kind: 'version', path: target, message }, restoreNotice: message });
      toast(message);
      return { ok: false, error: 'worldbook-dirty' };
    }
    setWs({ busy: true, versionsRoot: target, cardMissing: '', newAvailable: null });
    patchActiveProject({ lastVersionDir: target });
    await loadCards(target, {
      selectLatest: ws.autoLatest,
      preferredPath: ws.autoLatest ? '' : (ws.activeCard && ws.activeCard.file ? ws.activeCard.file.path : ''),
      auto: ws.autoLatest,
    });
    setWs({ busy: false, restoreNotice: '', newAvailable: null });
    scheduleWorkspaceSave();
    return { ok: true };
  }
  async function switchLatest() {
    return refreshLatest({ force: true, manual: true });
  }
  async function switchAutoVersion(target, latest, noCards, pick) {
    setWs({ busy: true, versionsRoot: target, newAvailable: null, restoreNotice: '', cardMissing: '' });
    wsNoticeKey = '';
    patchActiveProject({ lastVersionDir: target });
    await loadCards(target, { selectLatest: true, auto: true });
    setWs({ busy: false });
    scheduleWorkspaceSave();
    if (noCards) {
      const message = noCardsMessage(pick, latest);
      setWs({ cardMissing: message });
      toast(message);
      return { ok: true, switched: true, noCards: true };
    }
    toast(target === latest ? '已切到最新版本：' + basename(target) : '已切到有卡的最新版本：' + basename(target));
    return { ok: true, switched: true };
  }
  async function refreshLatest(options = {}) {
    if (wsRefreshInFlight) return { ok: false, error: 'busy' };
    const s = store.get();
    const ws = s.ws;
    const project = activeProject();
    if (!ws.loaded || ws.restoring || ws.busy || ws.scanBusy || !project) return { ok: false, error: 'not-ready' };
    wsRefreshInFlight = true;
    try {
      const scan = await scanProjectRoot(project.root);
      const latest = scan.latest;
      const current = ws.versionsRoot;
      const newerVersion = !!latest && latest !== current;
      const dirty = s.wb.dirty || s.wb.saving;
      const canAuto = ws.autoLatest || options.force;
      setWs({ versions: scan.versions, versionsLatest: latest, scanError: '' });
      if (newerVersion) {
        const message = '有新版本可用：' + basename(latest) + (dirty ? '（世界书有未保存修改，未切换）' : '');
        if (dirty) {
          if (wsNoticeKey !== 'version:' + latest) {
            wsNoticeKey = 'version:' + latest;
            setWs({ newAvailable: { kind: 'version', path: latest, message }, restoreNotice: message });
            toast(message);
          }
          return { ok: true, newer: true, switched: false };
        }
        if (canAuto) {
          const pick = await pickVersionWithCards(scan.versions, latest);
          const target = pick.found && pick.version && pick.version.path ? pick.version.path : latest;
          if (pick.found && target === current) {
            const retained = '更高版本没有识别到卡，保留当前有卡版本：' + basename(current);
            setWs({ cardMissing: retained, newAvailable: null });
            if (wsNoticeKey !== 'no-card:' + latest) {
              wsNoticeKey = 'no-card:' + latest;
              toast(retained);
            }
            return { ok: true, newer: true, switched: false, retained: true };
          }
          return await switchAutoVersion(target, latest, !pick.found, pick);
        }
        if (wsNoticeKey !== 'version:' + latest) {
          wsNoticeKey = 'version:' + latest;
          setWs({ newAvailable: { kind: 'version', path: latest, message } });
        }
        return { ok: true, newer: true, switched: false };
      }
      // 同版本但没有卡：自动最新继续向下找有卡的版本（有界）。
      if (canAuto && !dirty && !ws.activeCard) {
        const pick = await pickVersionWithCards(scan.versions, latest);
        if (pick.found && pick.version && pick.version.path && pick.version.path !== current) {
          return await switchAutoVersion(pick.version.path, latest, false, pick);
        }
        if (!pick.found) {
          const message = noCardsMessage(pick, latest);
          setWs({ cardMissing: message, newAvailable: null });
          if (wsNoticeKey !== 'no-card:' + latest) {
            wsNoticeKey = 'no-card:' + latest;
            toast(message);
          }
          return { ok: true, switched: false, noCards: true };
        }
      }
      if (current) {
        const list = await cardListRoot(current);
        const latestCardInfo = await latestCardInFiles(current, list.files);
        const latestCard = latestCardInfo ? latestCardInfo.path : '';
        const currentCard = ws.activeCard && ws.activeCard.file ? ws.activeCard.file.path : '';
        setWs({ cards: list.files, cardsRoot: list.root, cardsLatest: latestCard, cardError: '' });
        if (latestCard && latestCard !== currentCard) {
          if (s.wb.dirty || s.wb.saving) {
            const message = '有新文件可用：' + basename(latestCard) + '（世界书有未保存修改，未切换）';
            if (wsNoticeKey !== 'card:' + latestCard) {
              wsNoticeKey = 'card:' + latestCard;
              setWs({ newAvailable: { kind: 'card', path: latestCard, message }, restoreNotice: message });
              toast(message);
            }
            return { ok: true, newerCard: true, switched: false };
          }
          if (ws.autoLatest || options.force) {
            const loaded = await loadCards(current, { selectLatest: true, auto: true });
            scheduleWorkspaceSave();
            const switched = !!loaded.activePath && loaded.activePath !== currentCard;
            if (switched) toast('已切到最新卡文件：' + basename(loaded.activePath));
            return { ok: true, newerCard: switched, switched, activePath: loaded.activePath };
          }
          if (wsNoticeKey !== 'card:' + latestCard) {
            wsNoticeKey = 'card:' + latestCard;
            setWs({ newAvailable: { kind: 'card', path: latestCard, message: '有新文件可用：' + basename(latestCard) } });
          }
          return { ok: true, newerCard: true, switched: false };
        }
      }
      if (ws.newAvailable) setWs({ newAvailable: null });
      wsNoticeKey = '';
      return { ok: true };
    } catch (error) {
      setWs({ scanError: errorText(error) });
      if (options.manual) toast('检查最新版本失败：' + errorText(error));
      return { ok: false, error: errorText(error) };
    } finally {
      wsRefreshInFlight = false;
    }
  }
  async function toggleAutoLatest() {
    const next = !store.get().ws.autoLatest;
    setWs({ autoLatest: next });
    scheduleWorkspaceSave();
    if (next) await refreshLatest();
    return { ok: true, autoLatest: next };
  }
  async function useCurrentVersionRoot() {
    const ws = store.get().ws;
    const project = activeProject();
    if (ws.busy) return { ok: false, error: 'busy' };
    const root = ws.versionsRoot || (project && project.root) || '';
    if (!root) { setWs({ addError: '先选择项目或版本目录。' }); return { ok: false, error: 'no-project' }; }
    setWs({ restoreNotice: '' });
    // 世界书根和变量根是同一个当前版本目录；openWorldbookRoot 会同步 /mvu/select。
    const result = await openWorldbookRoot(root);
    if (result.ok) {
      patchActiveProject({ lastWorldbookRoot: store.get().wb.root, lastMvuRoot: store.get().mvu.root || '' });
      scheduleWorkspaceSave();
    }
    return result;
  }
  async function useProjectRootForWorldbook() { return useCurrentVersionRoot(); }
  async function useProjectRootForMvu() { return useCurrentVersionRoot(); }

  /* ---------------- 拖 Skill 到输入框 ---------------- */

  function startSkillDrag(e, name) {
    try {
      e.dataTransfer.setData(SKILL_MIME, name);
      e.dataTransfer.setData('text/plain', '/' + name + ' ');
      e.dataTransfer.effectAllowed = 'copy';
    } catch {}
  }
  function isSkillDrag(e) {
    const types = e.dataTransfer && e.dataTransfer.types;
    return !!types && Array.prototype.indexOf.call(types, SKILL_MIME) >= 0;
  }
  function dropTargetAt(x, y) {
    const card = composerCard();
    if (!card) return null;
    const r = card.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), radius: getComputedStyle(card).borderTopLeftRadius };
  }
  function setDrop(next) {
    const cur = store.get().drop;
    if (!next && !cur) return;
    if (next && cur && next.x === cur.x && next.y === cur.y && next.w === cur.w && next.h === cur.h) return;
    store.set({ drop: next });
  }
  /**
   * 文档级捕获：拖着神之手的 Skill 卡经过输入框时由这里接住，插入 `/名字 `。
   * 输入框自己的拖放处理收不到这次拖动，所以不会重复插入。
   */
  function installDropTarget() {
    const over = (e) => {
      if (!isSkillDrag(e)) return;
      const t = dropTargetAt(e.clientX, e.clientY);
      setDrop(t);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      try { e.dataTransfer.dropEffect = 'copy'; } catch {}
    };
    const leave = (e) => { if (isSkillDrag(e) && !dropTargetAt(e.clientX, e.clientY)) setDrop(null); };
    const drop = (e) => {
      if (!isSkillDrag(e)) return;
      const t = dropTargetAt(e.clientX, e.clientY);
      setDrop(null);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      let name = '';
      try { name = e.dataTransfer.getData(SKILL_MIME); } catch {}
      if (name) insertSkill(name);
    };
    const end = () => setDrop(null);
    document.addEventListener('dragenter', over, true);
    document.addEventListener('dragover', over, true);
    document.addEventListener('dragleave', leave, true);
    document.addEventListener('drop', drop, true);
    document.addEventListener('dragend', end, true);
    return () => {
      document.removeEventListener('dragenter', over, true);
      document.removeEventListener('dragover', over, true);
      document.removeEventListener('dragleave', leave, true);
      document.removeEventListener('drop', drop, true);
      document.removeEventListener('dragend', end, true);
    };
  }

  /* ---------------- 轮盘的位置：左侧栏和对话栏之间的空白 ---------------- */

  /**
   * 左边 = 会话视图左缘（左侧栏右缘），右边 = 输入框卡片左缘（对话正文列在它右侧），
   * 上边 = 会话头底边，下边 = 会话视图底边。只按结构量，不依赖 DSH 的样式类名。
   */
  function measureGutter() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let anchor = [...document.querySelectorAll('.gh2-souldock')].find((el) => el.getBoundingClientRect().width > 0) || null;
    if (!anchor) {
      const card = composerCard();
      if (card && card.getBoundingClientRect().width > 0) anchor = card;
    }
    if (!anchor) return { reason: 'no-composer' };
    const cardLeft = anchor.getBoundingClientRect().left;
    // 输入框往上第一个占半屏以上的容器就是会话视图（对话滚动区）
    let root = null;
    let rr = null;
    for (let el = anchor.parentElement, i = 0; el && el !== document.body && i < 30; el = el.parentElement, i++) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > vh * 0.5) { root = el; rr = r; break; }
    }
    if (!root) return { reason: 'no-view' };
    let top = rr.top;
    const header = root.querySelector('header');
    if (header) {
      const hr = header.getBoundingClientRect();
      if (hr.height > 0 && hr.top - rr.top < 24 && hr.bottom - rr.top < vh * 0.3) top = hr.bottom;
    }
    const left = Math.max(0, rr.left) + EDGE;
    const right = Math.min(cardLeft, vw) - 12;
    const bottom = Math.min(rr.bottom, vh) - EDGE;
    top = Math.max(0, top) + EDGE;
    const g = { x: Math.round(left), y: Math.round(top), w: Math.round(right - left), h: Math.round(bottom - top), root, anchor };
    g.reason = g.w < WHEEL.minW ? 'narrow' : g.h < WHEEL.minH ? 'short' : 'ok';
    if (g.reason !== 'ok') return g;
    // 这块空白里不能有别的东西（例如“轨迹”页签的表格横跨整个宽度、浮动面板盖在这里）：
    // 抽查的每个点，最上面的元素必须是会话视图本身、它的外层，或横跨到对话列、自身没有文字的大容器
    const spans = (el, px) => {
      const r = el.getBoundingClientRect();
      return r.left <= px - 1 && r.right >= cardLeft + 100;
    };
    const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const px = left + (right - left) * fx;
        const py = top + (bottom - top) * fy;
        const el = document.elementsFromPoint(px, py).find((e) => !(e.closest && e.closest('.gh2-root')));
        if (!el || el.contains(root)) continue;
        if (root.contains(el) && spans(el, px) && !ownText(el)) continue;
        g.reason = 'occupied';
        g.blocker = el.tagName.toLowerCase() + ':' + String(el.textContent || '').trim().slice(0, 16);
        return g;
      }
    }
    return g;
  }

  /* ---------------- 样式 ---------------- */

  const LIVE = 'light-dark(#0f766e,#6fd8d2)';
  const GOLD = 'light-dark(#8a6420,#d8b36a)';
  const CSS = `
.gh2-root{box-sizing:border-box;font-family:var(--dsh-font-family-text,var(--dsw-font-family,system-ui,sans-serif));font-size:var(--dsh-content-font-size,14px);line-height:1.5;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-root *,.gh2-root *::before,.gh2-root *::after{box-sizing:border-box}
.gh2-win{position:fixed;z-index:60;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#1e1e22);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.4));overflow:hidden;outline:none}
.gh2-busy,.gh2-busy *{user-select:none!important}
.gh2-bar{flex:none;display:flex;align-items:center;gap:8px;height:42px;padding:0 6px 0 12px;cursor:grab;user-select:none;touch-action:none;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-busy .gh2-bar{cursor:grabbing}
.gh2-brand{display:inline-flex;flex:none;color:${GOLD}}
.gh2-title{font-size:.93em;font-weight:600;color:var(--dsw-alias-label-primary,#e9e9ec);white-space:nowrap}
.gh2-spacer{flex:1}
.gh2-iconbtn{width:28px;padding:0;flex:none;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-iconbtn svg{width:15px;height:15px}
.gh2-hbtn{position:relative}
.gh2-hbtn[aria-pressed="true"]{background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.1));color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-hbtn.is-live{color:${LIVE}}
.gh2-wheelbtn[aria-pressed="false"]{color:var(--dsw-alias-label-caption,rgba(255,255,255,.35))}
.gh2-wheelbtn.is-off .gh2-wheelico{opacity:.7}
.gh2-ping{position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:${LIVE};box-shadow:0 0 0 2px var(--dsw-alias-bg-base,#151517)}
@media (prefers-reduced-motion:no-preference){.gh2-ping{animation:gh2-ping 1.6s ease-in-out infinite}}
@keyframes gh2-ping{50%{opacity:.35}}
.gh2-tabs{flex:none;padding:10px 12px 2px}
.gh2-seg{max-width:720px;width:100%}
.gh2-seg [role="tab"]{white-space:nowrap}
.gh2-body{flex:1;min-height:0;overflow:auto;padding:8px 12px 18px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(255,255,255,.2)) transparent}
.gh2-grip{position:absolute;right:2px;bottom:2px;width:16px;height:16px;display:grid;place-items:center;cursor:nwse-resize;touch-action:none;color:var(--dsw-alias-label-caption,rgba(255,255,255,.35))}
@media (pointer:coarse){.gh2-grip{display:none}}
.gh2-tools{display:flex;align-items:center;gap:8px;margin:6px 0 8px;flex-wrap:wrap}
.gh2-search{flex:1 1 180px;min-width:150px}
.gh2-summary{margin:0 0 6px;font-size:.84em;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.gh2-row{border-radius:var(--dsw-radius-md,10px)}
.gh2-row.is-open{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04))}
.gh2-rowmain{all:unset;-webkit-user-drag:element;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;padding:8px 10px;border-radius:var(--dsw-radius-md,10px);cursor:pointer}
.gh2-rowmain:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-rowmain:focus-visible,.gh2-recent button:focus-visible,.gh2-soulpill:focus-visible,.gh2-wcard:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-rowtext{display:flex;flex-direction:column;min-width:0;gap:1px}
.gh2-nameline{display:flex;align-items:center;gap:6px;min-width:0}
.gh2-rowtag{flex:none;font-size:.72em;line-height:1;padding:3px 6px;border-radius:999px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));color:var(--dsw-alias-label-secondary,#b5b5bb);white-space:nowrap}
.gh2-name{font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.9em;color:var(--dsw-alias-label-primary,#e9e9ec);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.gh2-desc{font-size:.84em;color:var(--dsw-alias-label-tertiary,#8b8b92);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-row.is-open .gh2-desc{white-space:normal}
.gh2-meta{font-size:.8em;color:var(--dsw-alias-label-tertiary,#8b8b92);white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.gh2-row.is-live .gh2-meta{color:${LIVE}}
.gh2-rowmore{display:flex;flex-direction:column;gap:8px;padding:0 10px 10px}
.gh2-rowdetail{margin:0;font-size:.84em;line-height:1.65;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-rowactions{display:flex;gap:8px;flex-wrap:wrap}
.gh2-rowmore button:disabled{opacity:.5;cursor:default}
.gh2-recent{margin-top:16px;padding-top:12px;border-top:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-recent h4{margin:0 0 6px;padding:0 10px;font-size:.84em;font-weight:600;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-recent ul{list-style:none;margin:0;padding:0}
.gh2-recent button{all:unset;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;padding:5px 10px;border-radius:var(--dsw-radius-sm,8px);cursor:pointer}
.gh2-recent button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-empty{padding:28px 6px;max-width:440px}
.gh2-empty h3{margin:0 0 6px;font-size:1em;font-weight:600;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-empty p{margin:0 0 12px;font-size:.9em;line-height:1.7;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-none{margin:12px 10px;font-size:.88em;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-idle{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption,rgba(255,255,255,.35))}
.gh2-wheel{position:fixed;z-index:10;overflow:hidden;outline:none;touch-action:none;user-select:none;-webkit-user-select:none}
.gh2-wheel:focus-visible{outline:1px solid light-dark(rgba(138,100,32,.5),rgba(216,179,106,.45));outline-offset:-4px;border-radius:var(--dsw-radius-sm,8px)}
.gh2-wheel.is-spinning{cursor:grabbing}
.gh2-plate{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.gh2-ring{fill:none;stroke:light-dark(rgba(138,100,32,.38),rgba(216,179,106,.46));stroke-width:1;stroke-dasharray:3 3}
.gh2-ring.is-inner{stroke:light-dark(rgba(0,0,0,.07),rgba(239,232,218,.08));stroke-dasharray:none}
.gh2-ring.is-accent{stroke:light-dark(rgba(15,118,110,.26),rgba(111,216,210,.32));stroke-dasharray:none}
.gh2-whead{position:absolute;top:12px;left:${WHEEL.left}px;right:4px;z-index:40;display:flex;align-items:center;gap:6px;font-size:max(10px,.72em);letter-spacing:.06em;color:var(--dsw-alias-label-tertiary,#8b8b92);white-space:nowrap;overflow:hidden;pointer-events:none}
.gh2-whead b{font-weight:600;letter-spacing:.08em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-whead[data-round="skills"] .gh2-wh-features,.gh2-whead[data-round="skills"] .gh2-wh-other,
.gh2-whead[data-round="features"] .gh2-wh-skills,.gh2-whead[data-round="features"] .gh2-wh-other,
.gh2-whead[data-round="other"] .gh2-wh-skills,.gh2-whead[data-round="other"] .gh2-wh-features{display:none}
.gh2-whint{color:${GOLD}}
.gh2-wnote{position:absolute;left:${WHEEL.left}px;right:6px;top:40px;z-index:40;font-size:.86em;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-wnote p{margin:0 0 8px}
.gh2-wcard{all:unset;-webkit-user-drag:element;box-sizing:border-box;position:absolute;left:0;top:0;display:block;width:var(--gh2-card-w,180px);padding:10px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1,#232324);box-shadow:var(--dsw-elevation-panel,0 8px 24px rgba(0,0,0,.32));color:var(--dsw-alias-label-primary,#e9e9ec);text-align:left;cursor:pointer;visibility:hidden;transform-origin:center;will-change:transform,opacity;transition:border-color .15s,background-color .15s}
.gh2-wcard:hover{border-color:light-dark(rgba(138,100,32,.5),rgba(216,179,106,.42));background:var(--dsw-alias-bg-layer-2,#2a2a2c)}
.gh2-wcard:active{cursor:grabbing}
.gh2-wcard.is-live{border-color:light-dark(rgba(15,118,110,.55),rgba(111,216,210,.5));background:linear-gradient(160deg,light-dark(rgba(15,118,110,.09),rgba(111,216,210,.11)),var(--dsw-alias-bg-layer-1,#232324) 70%);box-shadow:var(--dsw-elevation-panel,0 8px 24px rgba(0,0,0,.32)),0 0 0 1px light-dark(rgba(15,118,110,.14),rgba(111,216,210,.14))}
.gh2-wcard.is-feature{border-style:dashed;background:var(--dsw-alias-bg-base,#1b1b1c);box-shadow:none}
.gh2-wtop{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:max(10px,.71em);line-height:1.3;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary,#8b8b92);white-space:nowrap}
.gh2-wcard.is-live .gh2-wtop{color:${LIVE}}
.gh2-wlabel{display:inline-flex;align-items:center;gap:5px;min-width:0;overflow:hidden;text-overflow:ellipsis}
.gh2-wdot{flex:none;width:5px;height:5px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}
.gh2-wname{display:block;margin-top:5px;font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.93em;font-weight:600;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-wcard.is-feature .gh2-wname{font-family:inherit}
.gh2-wheel.is-compact .gh2-wname{white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;min-height:2.5em}
.gh2-wheel.is-compact .gh2-wmeta{display:none}
.gh2-wdesc{display:block;margin-top:3px;font-size:max(11px,.78em);line-height:1.4;color:var(--dsw-alias-label-tertiary,#8b8b92);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-wmeta{display:block;margin-top:6px;font-size:max(10px,.71em);line-height:1.3;color:var(--dsw-alias-label-caption,rgba(255,255,255,.4));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-whover{position:fixed;z-index:65;width:340px;max-width:calc(100vw - 24px);padding:12px 14px;border:.5px solid light-dark(rgba(138,100,32,.45),rgba(216,179,106,.38));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1,#232324);box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.4));pointer-events:none;font-size:.86em;line-height:1.65}
.gh2-hk{display:flex;justify-content:space-between;gap:8px;font-size:max(10px,.84em);letter-spacing:.04em;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-hk .is-live{color:${LIVE}}
.gh2-whover h4{margin:4px 0 0;font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:1.04em;font-weight:600;line-height:1.35;color:var(--dsw-alias-label-primary,#e9e9ec);word-break:break-all}
.gh2-whover p{margin:6px 0 0;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-hnote{margin-top:6px;font-size:.9em;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-hlast{margin-top:8px;font-size:.92em;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-hhint{margin-top:8px;padding-top:8px;border-top:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));font-size:.92em;color:${GOLD}}
.gh2-drophint{position:fixed;z-index:12;border:1.5px dashed light-dark(rgba(138,100,32,.7),rgba(216,179,106,.75));background:light-dark(rgba(138,100,32,.05),rgba(216,179,106,.05));pointer-events:none}
.gh2-souldock{position:relative;height:0;width:calc(100% - 2 * var(--dsh-composer-side-clearance,0px));max-width:var(--dsh-composer-card-max-width,100%);margin:0 auto;z-index:4}
.gh2-soul{position:absolute;right:0;bottom:8px;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.gh2-soulpill{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px 0 10px;border-radius:13px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1,#1e1e22));backdrop-filter:var(--dsw-menu-backdrop-filter,none);box-shadow:var(--dsw-elevation-panel,0 4px 16px rgba(0,0,0,.25));color:var(--dsw-alias-label-secondary,#b5b5bb);font:inherit;font-size:12px;line-height:1;white-space:nowrap;cursor:pointer}
.gh2-soulpill:hover{color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-soulpill:disabled{cursor:default;opacity:.6}
.gh2-soulpill.is-on{color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-soulpill.is-off{color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-soulpill svg{width:12px;height:12px;opacity:.7}
.gh2-souldot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption,rgba(255,255,255,.35))}
.gh2-soulpill.is-on .gh2-souldot{background:light-dark(#b8862f,#d8b36a)}
.gh2-soulpop{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;width:max-content;max-width:min(440px,calc(100vw - 32px));padding:6px;border-radius:var(--dsw-radius-lg,12px);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1,#1e1e22));backdrop-filter:var(--dsw-menu-backdrop-filter,none);box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.4))}
.gh2-soulnote{margin:2px 4px;max-width:300px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-fbtn{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;padding:0 10px;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}
.gh2-fbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-fbtn.is-outline{border:.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.2))}
.gh2-fpill{height:26px;padding:0 10px;border-radius:13px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:var(--dsw-alias-label-secondary,#b5b5bb);font:inherit;font-size:12px;cursor:pointer}
.gh2-fpill[aria-pressed="true"]{color:var(--dsw-alias-label-primary,#e9e9ec);background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.1))}
.gh2-finput{flex:1 1 180px;min-width:150px;height:30px;padding:0 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:inherit;font:inherit;font-size:.9em}
.gh2-ftabs{display:flex;gap:4px}
.gh2-ftab{white-space:nowrap}
.gh2-ftab{height:28px;padding:0 12px;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-secondary,#b5b5bb);font:inherit;font-size:.88em;cursor:pointer}
.gh2-ftab[aria-selected="true"]{background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.1));color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-m5{display:flex;flex-direction:column;gap:10px;min-width:0}
.gh2-m5-lead{margin:0;font-size:.9em;line-height:1.65;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-m5-note{margin:0;font-size:.82em;line-height:1.6;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-m5-meta{font-size:.8em;color:var(--dsw-alias-label-tertiary,#8b8b92);min-width:0;overflow-wrap:anywhere}
.gh2-m5-warn{margin:0;padding:8px 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid light-dark(rgba(138,100,32,.38),rgba(216,179,106,.42));background:light-dark(rgba(138,100,32,.06),rgba(216,179,106,.08));font-size:.84em;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-m5-error{margin:0;padding:8px 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid light-dark(rgba(180,35,24,.4),rgba(255,138,128,.45));background:light-dark(rgba(180,35,24,.07),rgba(255,138,128,.09));font-size:.84em;line-height:1.6;color:light-dark(#a4261b,#ffaaa0);overflow-wrap:anywhere}
.gh2-m5-ok{margin:0;padding:8px 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid light-dark(rgba(20,108,67,.35),rgba(125,219,163,.38));background:light-dark(rgba(20,108,67,.06),rgba(125,219,163,.08));font-size:.82em;line-height:1.6;color:light-dark(#146c43,#8de3b0);overflow-wrap:anywhere}
.gh2-m5-ok-inline{font-size:.82em;color:light-dark(#146c43,#8de3b0)}
.gh2-m5-dirty{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:11px;border:.5px solid light-dark(rgba(138,100,32,.45),rgba(216,179,106,.5));font-size:.78em;color:${GOLD};white-space:nowrap}
.gh2-m5-chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:11px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));font-size:.78em;color:var(--dsw-alias-label-secondary,#b5b5bb);white-space:nowrap}
.gh2-m5-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.gh2-m5-actions .gh2-finput{flex:1 1 260px;min-width:170px}
.gh2-m5-rowhead{display:flex;align-items:center;gap:8px;font-size:.9em;min-width:0}
.gh2-mono{font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.88em;overflow-wrap:anywhere}
.gh2-m5-field{display:flex;flex-direction:column;gap:4px;min-width:0;font-size:.86em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-m5-field .gh2-finput{flex:0 0 auto;width:100%;min-width:0;height:30px}
.gh2-m5-ftextarea{width:100%;min-height:170px;resize:vertical;padding:8px 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:var(--dsw-alias-label-primary,#e9e9ec);font:inherit;font-size:.92em;line-height:1.6}
.gh2-m5-ftextarea:focus{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-1px}
.gh2-m5-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.gh2-m5-version{display:flex;align-items:center;gap:10px;min-width:0;padding:5px 8px;border-radius:var(--dsw-radius-sm,8px);font-size:.82em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-m5-version:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-m5-version .gh2-mono{flex:1;min-width:0}
.gh2-m5-raw{margin:0;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);padding:6px 8px}
.gh2-m5-raw summary{cursor:pointer;font-size:.84em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-m5-pre{max-height:260px;overflow:auto;margin:6px 0 0;padding:8px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,#151517);font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.76em;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-wb-files{display:flex;flex-wrap:wrap;gap:6px;max-height:150px;overflow:auto;padding:6px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-wb-file{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:4px 8px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid transparent;font-size:.82em;color:var(--dsw-alias-label-secondary,#b5b5bb);cursor:pointer}
.gh2-wb-file:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-wb-file.is-active{border-color:light-dark(rgba(138,100,32,.5),rgba(216,179,106,.5));color:var(--dsw-alias-label-primary,#e9e9ec);background:light-dark(rgba(138,100,32,.06),rgba(216,179,106,.08))}
.gh2-wb-file:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-wb-fname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-wb-filehead{padding-top:2px}
.gh2-wb-grid{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(0,2fr);gap:10px;min-height:260px}
.gh2-wb-listbox,.gh2-wb-editor{display:flex;flex-direction:column;gap:8px;min-width:0}
.gh2-wb-list{list-style:none;margin:0;padding:4px;display:flex;flex-direction:column;gap:2px;max-height:420px;overflow:auto;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-wb-entry{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:1px;width:100%;padding:6px 8px;border-radius:var(--dsw-radius-sm,8px);cursor:pointer;font-size:.84em;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-wb-entry:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-wb-entry.is-open{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04));box-shadow:inset 2px 0 0 ${GOLD}}
.gh2-wb-entry:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-wb-entrytitle{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-json-tree{font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.8em;line-height:1.55;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);padding:8px;max-height:420px;overflow:auto;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-json-tree details{margin-left:14px}
.gh2-json-tree summary{cursor:pointer}
.gh2-json-leaf{margin-left:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gh2-json-key{color:${GOLD}}
.gh2-json-type{color:var(--dsw-alias-label-caption,rgba(255,255,255,.4))}
.gh2-json-val{color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-mvu{display:flex;flex-direction:column;gap:10px;min-width:0;padding:10px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-mvu-note{color:${GOLD}}
.gh2-mvu-meta{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:.84em;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb);min-width:0;overflow-wrap:anywhere}
.gh2-mvu-meta b{font-weight:600;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-mvu-tree{font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.82em;line-height:1.6;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);padding:8px;max-height:420px;overflow:auto;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-mvu-node{margin-left:14px}
.gh2-mvu-node > summary{cursor:pointer;list-style-position:outside}
.gh2-mvu-leaf{display:flex;flex-wrap:wrap;gap:2px 10px;margin-left:14px;min-width:0}
.gh2-mvu-key{color:${GOLD};overflow-wrap:anywhere}
.gh2-mvu-key.is-star{color:${LIVE}}
.gh2-mvu-type{padding:0 5px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.06));font-size:.94em;color:var(--dsw-alias-label-secondary,#b5b5bb);white-space:nowrap}
.gh2-mvu-default{color:var(--dsw-alias-label-caption,rgba(255,255,255,.45));overflow-wrap:anywhere}
.gh2-mvu-warnings{margin:0;padding:6px 10px 6px 24px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid light-dark(rgba(138,100,32,.35),rgba(216,179,106,.4));background:light-dark(rgba(138,100,32,.06),rgba(216,179,106,.08));font-size:.8em;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-mvu-warnings li{margin:0}
.gh2-mvu-sep{height:1px;margin:2px 0;background:var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-wb-json{display:flex;flex-direction:column;gap:8px;min-width:0}
.gh2-card-mvu{border-color:light-dark(rgba(138,100,32,.3),rgba(216,179,106,.36));background:light-dark(rgba(138,100,32,.035),rgba(216,179,106,.045))}
.gh2-card-mvu.is-focus{outline:2px solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:2px}
.gh2-card-wb{display:flex;flex-direction:column;gap:6px;min-width:0;padding:10px;border:.5px solid light-dark(rgba(138,100,32,.3),rgba(216,179,106,.36));border-left:2px solid ${GOLD};border-radius:var(--dsw-radius-md,10px);background:light-dark(rgba(138,100,32,.035),rgba(216,179,106,.045))}
.gh2-card-wb-fold > summary,.gh2-card-wb-summary{cursor:pointer;display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:.9em;list-style-position:outside}
.gh2-card-wb-list{display:flex;flex-direction:column;gap:4px;margin-top:8px;max-height:320px;overflow:auto}
.gh2-card-wb-entry{margin:0;padding:5px 8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-card-wb-entry > summary{cursor:pointer;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;font-size:.84em}
.gh2-card-wb-entrytitle{font-weight:600;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-card-wb-key{color:${GOLD};font-size:.82em;overflow-wrap:anywhere}
.gh2-card-wb-content{margin:6px 0 0;padding:8px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,#151517);font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.8em;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-card-scripts{display:flex;flex-direction:column;gap:6px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-card-script-list{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto}
.gh2-card-script{padding:6px 8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-card-script-head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:.86em;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-var-page{display:flex;flex-direction:column;gap:10px;min-width:0}
.gh2-var-manual{display:flex;flex-direction:column;gap:6px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-modebar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.gh2-var-modes{display:flex;flex-wrap:wrap;gap:4px}
.gh2-var-mode.is-active{border-color:light-dark(rgba(138,100,32,.45),rgba(216,179,106,.55));color:${GOLD};background:light-dark(rgba(138,100,32,.08),rgba(216,179,106,.1));font-weight:700}
.gh2-var-compare,.gh2-var-run{display:flex;flex-direction:column;gap:10px;min-width:0}
.gh2-var-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0}
.gh2-var-textarea{width:100%;min-height:120px;resize:vertical;padding:8px 10px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:var(--dsw-alias-bg-base,#151517);color:var(--dsw-alias-label-primary,#e9e9ec);font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.82em;line-height:1.55}
.gh2-var-textarea:focus{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-1px}
.gh2-var-dialect{display:inline-flex;align-items:center;gap:6px;font-size:.84em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-dialect select{height:30px;padding:0 8px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:var(--dsw-alias-label-primary,#e9e9ec);font:inherit;font-size:.9em}
.gh2-var-result{display:flex;flex-direction:column;gap:10px;min-width:0;padding:10px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-resultblock{display:flex;flex-direction:column;gap:5px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-var-resultlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;max-height:220px;overflow:auto;font-size:.8em;line-height:1.5;color:var(--dsw-alias-label-secondary,#b5b5bb);overflow-wrap:anywhere}
.gh2-var-resultlist li{padding:4px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04))}
.gh2-var-summary{display:flex;flex-wrap:wrap;gap:6px}
.gh2-var-check-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:360px;overflow:auto}
.gh2-var-check{display:grid;grid-template-columns:auto minmax(120px,.28fr) minmax(0,1fr);align-items:start;gap:8px;padding:5px 7px;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04));font-size:.8em;line-height:1.5;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-checkstatus{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));font-size:.9em;white-space:nowrap}
.gh2-var-check[data-status="pass"] .gh2-var-checkstatus{color:light-dark(#146c43,#8de3b0);border-color:light-dark(rgba(20,108,67,.35),rgba(125,219,163,.38))}
.gh2-var-check[data-status="observed"] .gh2-var-checkstatus{color:${GOLD};border-color:light-dark(rgba(138,100,32,.45),rgba(216,179,106,.5))}
.gh2-var-check[data-status="not_triggered"] .gh2-var-checkstatus,.gh2-var-check[data-status="not_run"] .gh2-var-checkstatus{color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-var-raw{margin:0;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);padding:6px 8px}
.gh2-var-raw summary{cursor:pointer;font-size:.84em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-schema-tree-block{display:flex;flex-direction:column;gap:5px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-var-schema-tree{min-height:80px;max-height:300px;overflow:auto;padding:4px;border-radius:6px;background:var(--dsw-alias-bg-base,rgba(0,0,0,.14));scrollbar-width:thin}
.gh2-var-schema-tree-row{display:flex;align-items:center;gap:7px;min-height:30px;padding:4px 7px;border-radius:5px;font-size:.8em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-schema-tree-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.05))}
.gh2-var-ruleentries{display:flex;flex-direction:column;gap:6px;max-height:380px;overflow:auto;padding-right:2px;scrollbar-width:thin}
.gh2-var-ruleentry{display:flex;flex-direction:column;gap:4px;padding:6px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:6px;background:var(--dsw-alias-bg-base,rgba(0,0,0,.1))}
.gh2-var-ruleentry > span{font-size:.78em;color:var(--dsw-alias-label-tertiary,#8b8b92);overflow-wrap:anywhere}
.gh2-var-ruleentry .gh2-var-textarea{min-height:88px}
.gh2-var-writebar{display:flex;flex-direction:column;gap:8px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-writehead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.gh2-var-writeinfo{display:flex;align-items:baseline;flex-wrap:wrap;gap:7px;min-width:0}
.gh2-var-writeinfo > span{min-width:0;overflow-wrap:anywhere}
.gh2-var-writeconfirm{display:flex;flex-direction:column;gap:6px;padding:8px;border:.5px solid light-dark(rgba(138,100,32,.4),rgba(216,179,106,.45));border-radius:6px;background:light-dark(rgba(138,100,32,.05),rgba(216,179,106,.06))}
.gh2-var-writeconfirm p{margin:0;font-size:.82em;line-height:1.5;color:var(--dsw-alias-label-secondary,#b5b5bb);overflow-wrap:anywhere}
.gh2-var-writeresult{display:flex;flex-direction:column;gap:5px;padding:8px;border:.5px solid light-dark(rgba(20,108,67,.35),rgba(125,219,163,.35));border-radius:6px;background:light-dark(rgba(20,108,67,.04),rgba(125,219,163,.05))}
.gh2-var-writeresult p{display:flex;gap:6px;flex-wrap:wrap;margin:0;font-size:.82em;line-height:1.5;color:var(--dsw-alias-label-secondary,#b5b5bb);overflow-wrap:anywhere}
.gh2-var-writeresult code{white-space:pre-wrap;overflow-wrap:anywhere}
@media (max-width:760px){.gh2-var-two{grid-template-columns:1fr}.gh2-var-check{grid-template-columns:auto minmax(90px,.35fr) minmax(0,1fr)}}
.gh2-var-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.gh2-var-toolbar .gh2-finput{flex:1 1 250px;min-width:170px;height:30px}
.gh2-var-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(220px,.8fr);gap:10px;min-height:380px}
.gh2-var-tablewrap{min-width:0;max-height:520px;overflow:auto;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-table{width:100%;border-collapse:collapse;font-size:.82em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-table th{position:sticky;top:0;z-index:1;text-align:left;padding:7px 8px;background:var(--dsw-alias-bg-layer-1,#1e1e22);border-bottom:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));font-weight:600;color:var(--dsw-alias-label-tertiary,#8b8b92);white-space:nowrap}
.gh2-var-table td{padding:6px 8px;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));vertical-align:top;min-width:0;overflow-wrap:anywhere}
.gh2-var-row{cursor:pointer}
.gh2-var-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-var-row.is-selected{background:light-dark(rgba(138,100,32,.08),rgba(216,179,106,.1));box-shadow:inset 2px 0 0 ${GOLD}}
.gh2-var-row.is-focus{outline:2px solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-var-path{min-width:210px}
.gh2-var-path > *{vertical-align:middle}
.gh2-var-chev{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:16px;height:20px;margin-right:2px;color:${GOLD};cursor:pointer;font-size:.9em}
.gh2-var-chev.is-empty{cursor:default;color:var(--dsw-alias-label-caption,rgba(255,255,255,.35))}
.gh2-var-chev:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-var-indent{display:inline-block;min-width:0;overflow-wrap:anywhere}
.gh2-var-detail{display:flex;flex-direction:column;gap:8px;min-width:0;padding:10px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-fields{display:flex;flex-direction:column;gap:7px}
.gh2-var-value{padding:5px 8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);font-size:.82em;color:var(--dsw-alias-label-secondary,#b5b5bb);overflow-wrap:anywhere}
.gh2-var-value.mono{font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace)}
.gh2-var-visual{min-width:0;min-height:460px;display:grid;grid-template-columns:minmax(290px,.44fr) minmax(0,1fr);overflow:hidden;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-var-tree-pane{min-width:0;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);border-right:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-var-detail-pane{min-width:0;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr)}
.gh2-var-panehead{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;min-height:54px;padding:9px 12px;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-var-panehead > div{min-width:0}
.gh2-var-panehead > div > span{display:block;color:${GOLD};font-size:.72em;font-weight:800;letter-spacing:.06em}
.gh2-var-panehead h4{margin:2px 0 0;font-size:.94em;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-var-treetools{display:grid;grid-template-columns:minmax(120px,1fr) auto;gap:6px;padding:8px;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}
.gh2-var-treetools .gh2-finput{height:32px;min-width:0}
.gh2-var-tree{min-width:0;min-height:0;overflow:auto;padding:8px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(255,255,255,.2)) transparent}
.gh2-var-treeitem{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:7px;width:100%;min-height:34px;padding:5px 7px;margin:0 0 2px;border:1px solid transparent;border-radius:7px;font-size:.84em;color:var(--dsw-alias-label-secondary,#b5b5bb);cursor:pointer}
.gh2-var-treeitem:hover{color:var(--dsw-alias-label-primary,#e9e9ec);background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-var-treeitem.is-selected{border-color:light-dark(rgba(138,100,32,.45),rgba(216,179,106,.5));color:var(--dsw-alias-label-primary,#e9e9ec);background:light-dark(rgba(138,100,32,.07),rgba(216,179,106,.09))}
.gh2-var-treeitem.is-focus{outline:2px solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-var-treeitem:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-var-disclosure{flex:0 0 12px;text-align:center;color:${GOLD};line-height:1;cursor:pointer}
.gh2-var-treekey{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${GOLD};font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.94em}
.gh2-var-treemeta{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#8b8b92);font-size:.82em}
.gh2-var-tree-empty,.gh2-var-detail-empty{min-height:100%;display:grid;place-content:center;justify-items:center;gap:5px;padding:24px;color:var(--dsw-alias-label-tertiary,#8b8b92);text-align:center}
.gh2-var-tree-empty strong,.gh2-var-detail-empty strong{color:var(--dsw-alias-label-secondary,#b5b5bb);font-size:.88em}
.gh2-var-tree-empty span,.gh2-var-detail-empty span{max-width:340px;font-size:.8em;line-height:1.55}
.gh2-var-pathcode{max-width:62%;overflow:auto hidden;padding:5px 7px;border-radius:5px;color:${GOLD};background:light-dark(rgba(138,100,32,.07),rgba(216,179,106,.09));font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.78em;white-space:nowrap;scrollbar-width:thin}
.gh2-var-detailbody{min-width:0;min-height:0;display:flex;flex-direction:column;gap:11px;padding:12px;overflow:auto;scrollbar-width:thin}
.gh2-var-fieldgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.gh2-var-initial{margin:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base,#151517);font-family:var(--dsh-font-family-code,ui-monospace,Consolas,monospace);font-size:.8em;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-var-initial.is-json{color:var(--dsw-alias-label-primary,#e9e9ec)}
@media (max-width:760px){.gh2-var-layout{grid-template-columns:1fr}.gh2-var-visual{grid-template-columns:1fr}.gh2-var-tree-pane{border-right:0;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}.gh2-var-fieldgrid{grid-template-columns:1fr 1fr}}
.gh2-m5-links{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;padding:2px 0}
.gh2-m5-link{all:unset;box-sizing:border-box;cursor:pointer;padding:2px 0;border-radius:4px;font-size:.84em;color:${GOLD};text-decoration:underline;text-underline-offset:3px}
.gh2-m5-link:hover{color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-m5-link:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:2px}
.gh2-m5-link:disabled{opacity:.45;cursor:not-allowed;text-decoration:none;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-m5-ui-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr);gap:10px}
.gh2-m5-col{display:flex;flex-direction:column;gap:6px;min-width:0;padding:8px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-sm,8px)}
.gh2-ui-layer{padding:5px 8px;border-radius:var(--dsw-radius-sm,8px);font-size:.84em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-ui-layer.is-open{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04));box-shadow:inset 2px 0 0 ${GOLD};color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-ui-canvas{display:flex;align-items:center;justify-content:center;min-height:150px;border:1px dashed var(--dsw-alias-border-l3,rgba(255,255,255,.2));border-radius:var(--dsw-radius-sm,8px);font-size:.84em;color:var(--dsw-alias-label-tertiary,#8b8b92);text-align:center;padding:12px}
.gh2-ui-ins{padding:5px 8px;border-radius:var(--dsw-radius-sm,8px);border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));font-size:.8em;color:var(--dsw-alias-label-tertiary,#8b8b92);overflow-wrap:anywhere}
.gh2-libmask{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:max(14px,2.5vh) max(14px,2.5vw);background:rgba(0,0,0,.62)}
.gh2-libpanel{display:flex;flex-direction:column;width:min(1280px,96vw);height:min(92vh,1000px);overflow:hidden;background:var(--dsw-alias-bg-layer-1,#1e1e22);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.4))}
.gh2-libbar{flex:none;display:flex;align-items:center;gap:10px;height:44px;padding:0 10px 0 14px;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));font-size:.9em}
.gh2-libframe{flex:1;min-height:80vh;width:100%;border:0;background:#fff}
.gh2-body-lib{padding:0;overflow:hidden;display:flex;flex-direction:column}
.gh2-library-tab{flex:1;min-height:0;display:flex;flex-direction:column;width:100%;background:#fff}
.gh2-library-tab .gh2-libstate{flex:1;min-height:0;background:var(--dsw-alias-bg-layer-1,#1e1e22)}
.gh2-libframe-tab{flex:1;min-height:0;height:100%;width:100%;border:0;background:#fff}
.gh2-libstate{flex:1;min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;font-size:.9em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-projectpanel{display:flex;flex-direction:column;width:min(1200px,96vw);height:min(90vh,980px);overflow:hidden;background:var(--dsw-alias-bg-layer-1,#1e1e22);border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 18px 48px rgba(0,0,0,.4))}
.gh2-projectmask{z-index:92}
.gh2-projectbar{flex:none;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 10px 0 14px;border-bottom:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));font-size:.9em}
.gh2-projectbody{flex:1;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:14px}
.gh2-project-section{display:flex;flex-direction:column;gap:8px;min-width:0;padding:10px;border:.5px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-base,rgba(255,255,255,.02))}
.gh2-project-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-width:0}
.gh2-project-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;min-width:0}
.gh2-project-row{display:flex;align-items:center;gap:6px;min-width:0;border-radius:var(--dsw-radius-sm,8px)}
.gh2-project-row.is-active{background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.04))}
.gh2-project-main{all:unset;box-sizing:border-box;flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding:6px 8px;border-radius:var(--dsw-radius-sm,8px);cursor:pointer;font-size:.84em;color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-project-main:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-project-main:focus-visible,.gh2-project-item:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,#6aa0ff);outline-offset:-2px}
.gh2-project-main .gh2-mono,.gh2-project-item .gh2-mono{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;min-width:0}
.gh2-project-meta{font-size:.94em;color:var(--dsw-alias-label-tertiary,#8b8b92);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-project-delete{flex:none;height:26px;padding:0 8px;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary,#8b8b92);font:inherit;font-size:.8em;cursor:pointer}
.gh2-project-delete:hover{background:light-dark(rgba(180,35,24,.08),rgba(255,138,128,.1));color:light-dark(#a4261b,#ffaaa0)}
.gh2-project-item{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;min-width:0;padding:5px 8px;border-radius:var(--dsw-radius-sm,8px);cursor:pointer;font-size:.82em;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-project-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.gh2-project-item.is-active{box-shadow:inset 2px 0 0 ${GOLD};background:light-dark(rgba(138,100,32,.06),rgba(216,179,106,.08));color:var(--dsw-alias-label-primary,#e9e9ec)}
.gh2-project-itemtext{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.gh2-project-itemtitle{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-project-carddetail{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:.82em;line-height:1.6;color:var(--dsw-alias-label-secondary,#b5b5bb)}
.gh2-project-carddetail b{font-weight:600;color:var(--dsw-alias-label-tertiary,#8b8b92)}
.gh2-projectbtn{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh2-project-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.gh2-project-actions .gh2-finput{flex:1 1 240px;min-width:160px}
@media (max-width:760px){.gh2-project-columns{grid-template-columns:1fr}}
@media (max-width:720px){.gh2-wb-grid{grid-template-columns:1fr}.gh2-m5-ui-grid{grid-template-columns:1fr}}
.gh2-toast{position:fixed;left:50%;bottom:112px;transform:translateX(-50%);z-index:70;padding:7px 14px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-label-primary,#eeeef0);color:var(--dsw-alias-label-primary-inverted,#141416);font-size:13px;line-height:1.4;pointer-events:none;box-shadow:var(--dsw-elevation-panel,0 4px 16px rgba(0,0,0,.25))}
`;
  function injectStyles() {
    let el = document.getElementById('gh2-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'gh2-style';
      el.setAttribute('data-plugin-css', PLUGIN_ID);
      document.head.appendChild(el);
    }
    el.textContent = CSS;
  }

  /* ---------------- 界面 ---------------- */

  function makeFactory() {
    return (require) => {
      const module = { exports: {} };
      const React = require('react');
      const { createElement: h, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } = React;
      let P = null;
      try { P = require('@deepseek-ai/dsh-client-ui-primitives'); } catch (error) { fail('primitives', error); }
      const has = (name) => !!(P && P[name]);

      const useStoreState = () => useSyncExternalStore(store.subscribe, store.get);
      function useNow(fast) {
        const [now, setNow] = useState(() => Date.now());
        useEffect(() => {
          const timer = setInterval(() => setNow(Date.now()), fast ? 1000 : 30000);
          return () => clearInterval(timer);
        }, [fast]);
        return now;
      }
      function sessionOf(props) {
        return (props && (props.sessionId || (props.session && props.session.sessionId))) || undefined;
      }
      /** 会话作用域的部件把宿主给的 inputActions 登记下来，插入 /名字 时用。 */
      function usePublishInput(props) {
        const sid = sessionOf(props);
        const actions = props && props.inputActions;
        useEffect(() => {
          if (!sid || !actions) return undefined;
          inputRegistry.set(sid, actions);
          return () => { if (inputRegistry.get(sid) === actions) inputRegistry.delete(sid); };
        }, [sid, actions]);
      }
      function useDismiss(ref, open, setOpen) {
        useEffect(() => {
          if (!open) return undefined;
          const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
          const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
          document.addEventListener('pointerdown', onDown, true);
          document.addEventListener('keydown', onKey, true);
          return () => {
            document.removeEventListener('pointerdown', onDown, true);
            document.removeEventListener('keydown', onKey, true);
          };
        }, [open]);
      }

      /* 图形 */
      function Logo({ size }) {
        return h('svg', { width: size, height: size, viewBox: '0 0 32 32', fill: 'currentColor', 'aria-hidden': 'true', focusable: 'false' },
          h('path', { d: 'M2 13 5.5 7 11 12 9 17Z' }),
          h('path', { d: 'M8.5 4.5 14.5 2 14.5 10.5 13 11.5Z' }),
          h('path', { d: 'M18 2.5 24 6 19.5 12.5 17 11Z' }),
          h('path', { d: 'M26.5 9 29.5 15.5 22.5 17.5 21.5 14.5Z' }),
          h('path', { d: 'M3 19.5 9.5 22.5 14.5 25 19 22.5 15.5 19 18.5 17 23 21.5 28 20.5 23 26.5 14.5 29.5 6 25Z' }));
      }
      const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false' };
      const IconMinimize = () => h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', ...stroke }, h('path', { d: 'M4 8.5h8' }));
      const IconGrip = () => h('svg', { width: 12, height: 12, viewBox: '0 0 12 12', ...stroke }, h('path', { d: 'M10.5 4.5l-6 6M10.5 8l-2.5 2.5' }));
      const IconChevron = () => h('svg', { width: 12, height: 12, viewBox: '0 0 12 12', ...stroke }, h('path', { d: 'M3.5 7.5L6 5l2.5 2.5' }));
      const IconSearch = () => (has('IconSearchOutlineRegular') ? h(P.IconSearchOutlineRegular, { size: 16 }) : null);
      // 轮盘开关图标：圆盘 + 轮辐（不复用品牌 Logo）；隐藏时多一道斜线。
      const IconWheel = ({ off }) => h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', ...stroke, className: 'gh2-wheelico' },
        h('circle', { cx: 8, cy: 8, r: 5.4 }),
        h('circle', { cx: 8, cy: 8, r: 1.6 }),
        h('path', { d: 'M8 2.6v2.1M8 11.3v2.1M2.6 8h2.1M11.3 8h2.1' }),
        off ? h('path', { d: 'M3.8 12.2 12.2 3.8' }) : null);

      /* 宿主原生部件（缺失时退回同样外观的普通元素） */
      function IconButton({ label, onClick, pressed, className, children, ...rest }) {
        const cls = 'gh2-iconbtn' + (className ? ' ' + className : '');
        if (has('Button') && has('Tooltip')) {
          return h(P.Tooltip, {
            label, side: 'bottom', delayMs: 400,
            children: h(P.Button, { size: 'sm', className: cls, 'aria-label': label, 'aria-pressed': pressed, onClick, ...rest, children }),
          });
        }
        return h('button', { type: 'button', className: 'gh2-fbtn ' + cls, title: label, 'aria-label': label, 'aria-pressed': pressed, onClick, ...rest, children });
      }
      function TextButton({ onClick, children, variant, disabled, title, ...rest }) {
        if (has('Button')) return h(P.Button, { size: 'sm', variant: variant || 'outline', onClick, disabled, title, ...rest }, children);
        return h('button', { type: 'button', className: 'gh2-fbtn is-outline', onClick, disabled, title, ...rest }, children);
      }
      function Chip({ active, onClick, disabled, children }) {
        if (has('Pill')) return h(P.Pill, { active, onClick, disabled, 'aria-pressed': active }, children);
        return h('button', { type: 'button', className: 'gh2-fpill', 'aria-pressed': active, onClick, disabled }, children);
      }
      function SearchBox({ value, onChange }) {
        const props = { placeholder: '搜索 Skill 名称或说明', 'aria-label': '搜索 Skill', value, onChange: (e) => onChange(e.target.value) };
        if (has('Input')) return h(P.Input, { ...props, icon: IconSearch(), className: 'gh2-search' });
        return h('input', { ...props, className: 'gh2-finput' });
      }
      function Dot({ live }) {
        if (live && has('StateDot')) return h(P.StateDot, { state: 'ongoing', size: 12 });
        return h('span', { className: live ? 'gh2-idle is-live' : 'gh2-idle', 'aria-hidden': 'true' });
      }
      function Tabs({ value, onChange }) {
        const items = TABS.map((t) => ({ value: t.id, label: t.label, id: 'gh2-tab-' + t.id, panelId: 'gh2-panel-' + t.id }));
        if (has('SegmentedTabs')) return h(P.SegmentedTabs, { items, value, onChange, label: '神之手页签', className: 'gh2-seg' });
        return h('div', { role: 'tablist', 'aria-label': '神之手页签', className: 'gh2-ftabs' }, items.map((it) => h('button', {
          key: it.value, id: it.id, role: 'tab', type: 'button', 'aria-selected': it.value === value, 'aria-controls': it.panelId,
          className: 'gh2-ftab', onClick: () => onChange(it.value),
        }, it.label)));
      }
      function Empty({ title, text, action }) {
        return h('div', { className: 'gh2-empty' }, h('h3', null, title), text ? h('p', null, text) : null, action || null);
      }

      /* 会话头按钮 */
      function HeaderButton(props) {
        usePublishInput(props);
        const s = useStoreState();
        const sid = sessionOf(props) || s.sessionId;
        const live = sid === s.sessionId && Object.keys(s.activity.inUse).length > 0;
        const full = s.ui.mode === 'full';
        return h(IconButton, {
          label: '神之手',
          pressed: full,
          className: 'gh2-hbtn' + (live ? ' is-live' : ''),
          // 从完整浮窗收起时顺手把轮盘打开，保证真的回到轮盘；打开浮窗不改轮盘开关。
          onClick: () => setUi(full ? { mode: 'compact', wheelOn: true } : { mode: 'full' }),
        }, h(Logo, { size: 16 }), live ? h('span', { className: 'gh2-ping', 'aria-hidden': 'true' }) : null);
      }

      /* 会话头轮盘开关：显示/隐藏轮盘，状态存本机 */
      function WheelToggleButton() {
        const s = useStoreState();
        const on = s.ui.wheelOn !== false;
        return h(IconButton, {
          label: on ? '隐藏轮盘' : '显示轮盘',
          pressed: on,
          className: 'gh2-wheelbtn' + (on ? '' : ' is-off'),
          'data-gh': 'wheel-toggle',
          onClick: () => setUi({ wheelOn: !on }),
        }, h(IconWheel, { off: !on }));
      }

      /* Soul 小浮窗 */
      function SoulDock(props) {
        usePublishInput(props);
        const s = useStoreState();
        const [open, setOpen] = useState(false);
        const rootRef = useRef(null);
        useDismiss(rootRef, open, setOpen);
        const sid = sessionOf(props) || s.sessionId;
        if (!sid || sid !== s.sessionId) return null;
        const cat = s.catalog;
        const known = cat.state === 'ready';
        const available = known && cat.skills.some((k) => k.name === SOUL_SKILL);
        const current = SOULS.find((x) => x.id === s.activity.soul);
        const label = known && !available ? 'Soul 不可用' : current ? 'Soul · ' + current.name : 'Soul';
        const pick = (id) => { setOpen(false); sendSoul(id); };
        const pop = !open ? null : h('div', { className: 'gh2-soulpop', 'data-gh': 'soul-pop' }, available
          ? [
            ...SOULS.map((x) => h(Chip, { key: x.id, active: s.activity.soul === x.id, onClick: () => pick(x.id) }, x.name)),
            h(Chip, { key: 'off', active: false, disabled: s.activity.soul === 'off', onClick: () => pick('off') }, '关闭'),
          ]
          : h('p', { className: 'gh2-soulnote' }, '这个会话的预设没有加载 TW Soul。新建任务时选“TavernWeave X DSH”预设，就能在这里切换。'));
        return h('div', { className: 'gh2-root gh2-souldock' },
          h('div', { className: 'gh2-soul', ref: rootRef },
            pop,
            h('button', {
              type: 'button',
              className: 'gh2-soulpill' + (current ? ' is-on' : '') + (known && !available ? ' is-off' : ''),
              'data-gh': 'soul-pill',
              'aria-haspopup': 'true',
              'aria-expanded': open,
              disabled: !known,
              title: current ? '当前模式按本会话最近一条 Soul 指令推断' : undefined,
              onClick: () => setOpen((v) => !v),
            }, h('span', { className: 'gh2-souldot', 'aria-hidden': 'true' }), label, h(IconChevron))));
      }

      /* 缩略态：Skill 轮盘 */
      function sameFrame(a, b) {
        return a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);
      }
      /** 跟踪左侧栏和对话栏之间的空白；放不下轮盘时返回 null。 */
      function useGutter(active) {
        const [frame, setFrame] = useState(null);
        useEffect(() => {
          if (!active) { G.wheel.reason = 'no-session'; setFrame(null); return undefined; }
          let raf = 0;
          let watched = [];
          const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => schedule()) : null;
          function run() {
            raf = 0;
            let g = null;
            try { g = measureGutter(); } catch (error) { fail('gutter', error); }
            G.wheel.reason = g ? g.reason : 'error';
            G.wheel.blocker = g && g.blocker ? g.blocker : null;
            G.wheel.gutter = g && g.w !== undefined ? { x: g.x, y: g.y, w: g.w, h: g.h } : null;
            const targets = g && g.root ? [g.root, g.anchor] : [];
            if (ro && (targets[0] !== watched[0] || targets[1] !== watched[1])) {
              ro.disconnect();
              for (const t of targets) ro.observe(t);
              watched = targets;
            }
            const next = g && g.reason === 'ok' ? { x: g.x, y: g.y, w: g.w, h: g.h } : null;
            setFrame((prev) => (sameFrame(prev, next) ? prev : next));
          }
          function schedule() { if (!raf) raf = requestAnimationFrame(run); }
          window.addEventListener('resize', schedule);
          const timer = setInterval(schedule, 1000);
          schedule();
          return () => {
            if (raf) cancelAnimationFrame(raf);
            clearInterval(timer);
            window.removeEventListener('resize', schedule);
            if (ro) ro.disconnect();
          };
        }, [active]);
        return active ? frame : null;
      }
      function wheelItems(skills) {
        const item = (k, section) => ({
          kind: 'skill', section, key: 'skill:' + k.name, name: k.name,
          desc: k.description, zh: k.zh, detail: k.detail, tag: k.tag,
        });
        return [
          ...skills.filter((k) => k.tw).map((k) => item(k, 'tw')),
          ...FEATURES.map((f) => ({ kind: 'feature', section: 'feature', key: 'feature:' + f.tab, name: f.name, desc: f.desc, tab: f.tab })),
          ...skills.filter((k) => !k.tw).map((k) => item(k, 'other')),
        ];
      }
      function WheelHover({ item, pos, s, now }) {
        const ref = useRef(null);
        useLayoutEffect(() => {
          const el = ref.current;
          if (!el) return;
          el.style.top = Math.max(EDGE, Math.min(window.innerHeight - el.offsetHeight - EDGE, pos.top)) + 'px';
          el.style.left = Math.max(EDGE, Math.min(window.innerWidth - el.offsetWidth - EDGE, pos.left)) + 'px';
        });
        const a = s.activity;
        const live = a.inUse[item.name];
        const count = a.counts[item.name] || 0;
        let last = null;
        for (let i = a.calls.length - 1; i >= 0; i--) if (a.calls[i].name === item.name) { last = a.calls[i]; break; }
        return h('div', { ref, className: 'gh2-root gh2-whover', role: 'tooltip', 'data-gh': 'wheel-hover', style: { left: pos.left, top: pos.top } },
          h('div', { className: 'gh2-hk' },
            h('span', null, item.tag || 'Skill'),
            h('span', { className: live ? 'is-live' : undefined }, live ? '调用中 ' + clock(now - live.since) : count ? '本会话调用 ' + count + ' 次' : '本会话还没调用')),
          h('h4', null, item.name),
          h('p', null, item.detail || item.zh || item.desc || '没有说明'),
          !item.detail && item.desc ? h('p', { className: 'gh2-hnote' }, '这个 Skill 不在中文介绍名单里，说明保留原文。') : null,
          last ? h('div', { className: 'gh2-hlast' }, '最近一次：' + ago(last.time, now) + ' · ' + (last.source === 'model' ? '模型调用' : '手动调用')) : null,
          h('div', { className: 'gh2-hhint' }, '点击查看详情 · 拖到输入框插入 /' + item.name));
      }
      function Wheel({ s }) {
        const sid = s.sessionId;
        const frame = useGutter(!!sid);
        const zoneRef = useRef(null);
        const plateRef = useRef(null);
        const headRef = useRef(null);
        const cardEls = useRef(new Map());
        const st = useRef(null);
        if (!st.current) {
          const start = store.get().ui.wheel || 0;
          st.current = { geo: null, cards: [], count: 0, featureStart: 0, otherStart: 0, current: start, target: start, raf: 0, acc: 0, spin: null, hovering: false, rotatedFor: '' };
        }
        const [hover, setHover] = useState(null);
        const cat = s.catalog;
        const skills = cat.sessionId === sid ? cat.skills : [];
        const items = useMemo(() => (cat.state === 'ready' || skills.length ? wheelItems(skills) : []), [skills, cat.state]);
        const itemsKey = items.map((it) => it.key).join('\n');
        const a = s.activity;
        const liveNames = Object.keys(a.inUse);
        const now = useNow(liveNames.length > 0);

        const api = useRef(null);
        if (!api.current) {
          const S = st.current;
          const maxScroll = () => Math.max(0, S.count - (S.geo ? S.geo.slots : 0));
          const clampScroll = (i) => Math.max(0, Math.min(maxScroll(), i));
          const layout = () => {
            const g = S.geo;
            if (!g) return;
            const mid = (g.slots - 1) / 2;
            const offset = S.count < g.slots ? (g.slots - S.count) / 2 : 0;
            S.cards.forEach((el, i) => {
              const f = i - S.current + offset;
              if (!(f > -0.6 && f < g.slots - 0.4)) {
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                return;
              }
              const slotPos = f - mid;
              const angle = slotPos * g.step;
              const x = g.X0 - g.R * (1 - Math.cos(angle));
              const y = g.Cy + slotPos * g.spacing;
              let op = 1;
              if (f < 0) op = Math.max(0, 1 + f / 0.6);
              else if (f > g.slots - 1) op = Math.max(0, 1 - (f - (g.slots - 1)) / 0.6);
              el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (angle * 180 / Math.PI).toFixed(2) + 'deg)';
              el.style.visibility = 'visible';
              el.style.opacity = op.toFixed(2);
              el.style.zIndex = String(20 + Math.round(10 - Math.abs(slotPos)));
            });
            const head = headRef.current;
            if (head) {
              const last = Math.round(S.current) + g.slots - 1;
              const round = S.otherStart >= 0 && last >= S.otherStart ? 'other'
                : S.featureStart >= 0 && last >= S.featureStart ? 'features' : 'skills';
              if (head.dataset.round !== round) head.dataset.round = round;
            }
            G.wheel.current = S.current;
            G.wheel.target = S.target;
          };
          const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
          const tick = () => {
            S.raf = 0;
            const diff = S.target - S.current;
            if (Math.abs(diff) < 0.01 || reduce()) {
              S.current = S.target;
              layout();
              if (store.get().ui.wheel !== S.target) setUi({ wheel: S.target });
              return;
            }
            S.current += diff * WHEEL.ease;
            layout();
            S.raf = requestAnimationFrame(tick);
          };
          const go = (i) => {
            S.target = clampScroll(Math.round(i));
            if (!S.raf) S.raf = requestAnimationFrame(tick);
          };
          api.current = { layout, go, clampScroll, maxScroll };
        }
        const W = api.current;

        // 量卡高 → 算几何 → 排布。空白、目录或字号变了都重来。
        useLayoutEffect(() => {
          const S = st.current;
          const zone = zoneRef.current;
          if (!zone || !frame) { S.geo = null; G.wheel.geo = null; G.wheel.zoneRight = undefined; return undefined; }
          const cards = items.map((it) => cardEls.current.get(it.key)).filter(Boolean);
          const setup = () => {
            try {
              // 卡片文字不随宽度换行（窄卡的名字固定占两行），高度只取决于字号和窄/宽两种排法
              const measure = () => {
                let cardH = 0;
                for (const el of cards) cardH = Math.max(cardH, el.offsetHeight || 0);
                return cardH || 92;
              };
              let g = wheelGeometry(frame.w, frame.h, measure());
              const compact = zone.classList.contains('is-compact');
              // 留 6px 回差，避免卡宽正好在分界线附近时两种排法来回切换
              if (g && (g.cardW < WHEEL.compactBelow + (compact ? 6 : 0)) !== compact) {
                zone.classList.toggle('is-compact', !compact);
                g = wheelGeometry(frame.w, frame.h, measure());
              }
              G.wheel.fit = !!g;
              G.wheel.zoneRight = g ? frame.x + g.width : undefined;
              if (!g) { zone.style.visibility = 'hidden'; S.geo = null; return; }
              zone.style.visibility = '';
              zone.style.width = g.width + 'px';
              zone.style.setProperty('--gh2-card-w', g.cardW + 'px');
              // 圆盘：主圈穿过每张卡片的中心，内侧两圈同心；只画轮盘区里看得见的那一段弧
              const plate = plateRef.current;
              if (plate) {
                const cx = g.X0 - g.R;
                const vh = window.innerHeight / 100;
                const [ring, inner, accent] = plate.querySelectorAll('path');
                ring.setAttribute('d', ringPath(cx, g.Cy, g.R, frame.h));
                inner.setAttribute('d', ringPath(cx, g.Cy, g.R - 7 * vh, frame.h));
                accent.setAttribute('d', ringPath(cx, g.Cy, g.R - 14 * vh, frame.h));
                plate.dataset.cx = cx.toFixed(2);
                plate.dataset.cy = g.Cy.toFixed(2);
                plate.dataset.r = g.R.toFixed(2);
              }
              S.geo = g;
              S.cards = cards;
              S.count = cards.length;
              S.featureStart = items.findIndex((it) => it.kind === 'feature');
              S.otherStart = items.findIndex((it) => it.section === 'other');
              // 目录还没读到时不夹位置，免得把记住的位置夹成 0
              if (S.count) {
                S.target = W.clampScroll(S.target);
                S.current = W.clampScroll(S.current);
              }
              G.wheel.geo = { slots: g.slots, cardW: g.cardW, cardH: g.cardH, theta: +(g.theta * 180 / Math.PI).toFixed(2), R: Math.round(g.R), X0: +g.X0.toFixed(1), Cy: +g.Cy.toFixed(1), spacing: +g.spacing.toFixed(1), width: g.width };
              G.wheel.count = S.count;
              W.layout();
            } catch (error) {
              fail('wheel', error);
            }
          };
          setup();
          const ro = typeof ResizeObserver === 'function' && cards[0] ? new ResizeObserver(() => setup()) : null;
          if (ro) ro.observe(cards[0]);
          return () => { if (ro) ro.disconnect(); };
        }, [frame && frame.w, frame && frame.h, !!frame, itemsKey]);

        // 滚轮、上下拖动、悬停：原生监听（滚轮要能阻止页面滚动）
        useEffect(() => {
          const zone = zoneRef.current;
          if (!zone) return undefined;
          const S = st.current;
          const onWheel = (e) => {
            e.preventDefault();
            setHover(null);
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
            const dy = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
            if (Math.abs(dy) >= 50) { S.acc = 0; W.go(S.target + Math.sign(dy)); return; }
            S.acc += dy;
            if (Math.abs(S.acc) >= 60) {
              const n = Math.trunc(S.acc / 60);
              S.acc -= n * 60;
              W.go(S.target + n);
            }
          };
          const onDown = (e) => {
            if (e.button !== 0 || (e.target.closest && e.target.closest('.gh2-wcard'))) return;
            S.spin = { y: e.clientY, base: S.target };
            try { zone.setPointerCapture(e.pointerId); } catch {}
            zone.classList.add('is-spinning');
            setHover(null);
          };
          const onMove = (e) => {
            if (!S.spin) return;
            const stepPx = Math.max(40, S.geo ? S.geo.spacing : 100);
            W.go(S.spin.base + Math.trunc((S.spin.y - e.clientY) / stepPx));
          };
          const onUp = () => { S.spin = null; zone.classList.remove('is-spinning'); };
          const onOver = (e) => {
            S.hovering = true;
            if (S.spin) return;
            const card = e.target.closest && e.target.closest('.gh2-wcard');
            if (!card) return;
            if (card.dataset.kind !== 'skill') { setHover(null); return; }
            const r = card.getBoundingClientRect();
            const z = zone.getBoundingClientRect();
            setHover((prev) => (prev && prev.key === card.dataset.key ? prev : { key: card.dataset.key, pos: { left: Math.round(z.right + 8), top: Math.round(r.top) } }));
          };
          const onOut = (e) => {
            const to = e.relatedTarget;
            if (!to || !to.closest || !to.closest('.gh2-wcard')) setHover(null);
          };
          const onLeave = () => { S.hovering = false; setHover(null); };
          zone.addEventListener('wheel', onWheel, { passive: false });
          zone.addEventListener('pointerdown', onDown);
          zone.addEventListener('pointermove', onMove);
          zone.addEventListener('pointerup', onUp);
          zone.addEventListener('pointercancel', onUp);
          zone.addEventListener('pointerover', onOver);
          zone.addEventListener('pointerout', onOut);
          zone.addEventListener('pointerleave', onLeave);
          return () => {
            zone.removeEventListener('wheel', onWheel);
            zone.removeEventListener('pointerdown', onDown);
            zone.removeEventListener('pointermove', onMove);
            zone.removeEventListener('pointerup', onUp);
            zone.removeEventListener('pointercancel', onUp);
            zone.removeEventListener('pointerover', onOver);
            zone.removeEventListener('pointerout', onOut);
            zone.removeEventListener('pointerleave', onLeave);
          };
        }, [!!frame]);

        // 有 Skill 开始调用时转到中间（鼠标停在轮盘上时不抢）
        const newest = liveNames.length ? liveNames[liveNames.length - 1] : '';
        useEffect(() => {
          const S = st.current;
          if (!newest) { S.rotatedFor = ''; return; }
          if (S.rotatedFor === newest || S.hovering || S.spin || !S.geo) return;
          const idx = items.findIndex((it) => it.kind === 'skill' && it.name === newest);
          if (idx < 0) return;
          S.rotatedFor = newest;
          W.go(idx - Math.floor(S.geo.slots / 2));
        }, [newest, itemsKey, !!frame]);

        useEffect(() => () => { if (st.current.raf) cancelAnimationFrame(st.current.raf); }, []);

        if (!frame) return null;
        const onKeyDown = (e) => {
          const S = st.current;
          if (!S.geo || e.target !== e.currentTarget) return;
          const page = Math.max(1, S.geo.slots - 1);
          const next = { ArrowDown: S.target + 1, ArrowRight: S.target + 1, ArrowUp: S.target - 1, ArrowLeft: S.target - 1,
            PageDown: S.target + page, PageUp: S.target - page, Home: 0, End: W.maxScroll() }[e.key];
          if (next === undefined) return;
          e.preventDefault();
          e.stopPropagation();
          setHover(null);
          W.go(next);
        };
        const showFocus = (it, el) => {
          if (it.kind !== 'skill' || !el || !zoneRef.current) return;
          const r = el.getBoundingClientRect();
          const z = zoneRef.current.getBoundingClientRect();
          setHover({ key: it.key, pos: { left: Math.round(z.right + 8), top: Math.round(r.top) } });
        };
        const twCount = skills.filter((k) => k.tw).length;
        const otherCount = skills.length - twCount;
        let head;
        if (cat.state === 'error' && !skills.length) head = 'Skill 目录读取失败';
        else if (!items.length) head = '正在读取 Skill 目录…';
        else if (!skills.length) head = '这个会话没有 Skill';
        else head = [h('b', { key: 'b' }, 'TW SKILLS'), ' · ' + twCount + ' · 其他 ' + otherCount + ' · ', h('span', { key: 'h', className: 'gh2-whint' }, '滚轮旋转')];
        const hoverItem = hover ? items.find((it) => it.key === hover.key) : null;
        return h(Fragment, null,
          h('section', {
            ref: zoneRef, className: 'gh2-root gh2-wheel', role: 'group', tabIndex: 0, 'data-gh': 'wheel',
            'aria-label': 'Skill 轮盘：滚轮、方向键或上下拖动旋转；点卡片查看详情，拖到输入框插入',
            style: { left: frame.x, top: frame.y, height: frame.h },
            onKeyDown,
          },
            h('svg', { ref: plateRef, className: 'gh2-plate', 'aria-hidden': 'true', focusable: 'false', 'data-gh': 'wheel-plate' },
              h('path', { className: 'gh2-ring' }),
              h('path', { className: 'gh2-ring is-inner' }),
              h('path', { className: 'gh2-ring is-accent' })),
            h('div', { ref: headRef, className: 'gh2-whead', 'data-gh': 'wheel-head', 'data-round': 'skills' },
              h('span', { className: 'gh2-brand' }, h(Logo, { size: 13 })),
              h('span', { className: 'gh2-wh-skills' }, head),
              h('span', { className: 'gh2-wh-features' }, h('b', null, '功能入口'), ' · 下一轮'),
              h('span', { className: 'gh2-wh-other' }, h('b', null, '其他 Skill'), ' · ' + otherCount + ' 个')),
            cat.state === 'error' && !skills.length ? h('div', { className: 'gh2-wnote' },
              h('p', null, cat.error), h(TextButton, { onClick: () => loadCatalog(sid) }, '重试')) : null,
            items.map((it) => {
              const live = it.kind === 'skill' ? a.inUse[it.name] : null;
              const count = it.kind === 'skill' ? a.counts[it.name] || 0 : 0;
              const label = live ? [h('i', { key: 'd', className: 'gh2-wdot' }), it.tag || 'Skill']
                : it.kind === 'feature' ? '功能入口' : it.tag || '其他';
              return h('button', {
                key: it.key,
                ref: (el) => { if (el) cardEls.current.set(it.key, el); else cardEls.current.delete(it.key); },
                type: 'button',
                className: 'gh2-wcard' + (it.kind === 'feature' ? ' is-feature' : '') + (live ? ' is-live' : ''),
                'data-gh': 'wheel-card', 'data-key': it.key, 'data-kind': it.kind,
                'data-skill': it.kind === 'skill' ? it.name : undefined,
                'data-tab': it.kind === 'feature' ? it.tab : undefined,
                draggable: it.kind === 'skill',
                onClick: () => (it.kind === 'skill' ? openSkill(it.name) : openTab(it.tab)),
                onDragStart: (e) => { setHover(null); startSkillDrag(e, it.name); },
                onFocus: (e) => showFocus(it, e.currentTarget),
                onBlur: () => setHover(null),
              },
                h('span', { className: 'gh2-wtop' },
                  h('span', { className: 'gh2-wlabel' }, label),
                  h('span', null, live ? '调用中 ' + clock(now - live.since) : count ? '本会话 ' + count + ' 次' : '')),
                h('span', { className: 'gh2-wname' }, it.name),
                h('span', { className: 'gh2-wdesc' }, it.zh || it.desc || '没有说明'),
                h('span', { className: 'gh2-wmeta' }, it.kind === 'feature' ? '点击打开' : live ? '点击打开 · 调用中' : '拖到输入框插入'));
            })),
          hoverItem ? h(WheelHover, { item: hoverItem, pos: hover.pos, s, now }) : null);
      }

      /* 完整态 */
      function SkillsPane({ s }) {
        const [query, setQuery] = useState('');
        const [usedOnly, setUsedOnly] = useState(false);
        const [scope, setScope] = useState('all');
        const [openName, setOpenName] = useState(null);
        const [sending, setSending] = useState(null);
        const sendingRef = useRef(false);
        const listRef = useRef(null);
        const a = s.activity;
        const cat = s.catalog;
        const now = useNow(Object.keys(a.inUse).length > 0);
        const focus = s.focus;
        // 从轮盘点进来：清掉筛选、展开那一项并滚到可见
        useEffect(() => {
          if (!focus) return undefined;
          setQuery('');
          setUsedOnly(false);
          setScope('all');
          setOpenName(focus.name);
          const raf = requestAnimationFrame(() => {
            const row = listRef.current && [...listRef.current.querySelectorAll('li')].find((li) => li.dataset.skill === focus.name);
            if (row) { try { row.scrollIntoView({ block: 'nearest' }); } catch {} }
          });
          return () => cancelAnimationFrame(raf);
        }, [focus && focus.seq]);
        if (!s.sessionId) return h(Empty, { title: '没有打开的会话', text: '打开一个会话后，这里会列出它能用的 Skill。' });
        if (cat.sessionId !== s.sessionId) {
          return h(Empty, { title: '正在读取这个会话的 Skill…', text: '等目录读完再操作，避免把上一个会话的 Skill 发到新会话。' });
        }
        if (cat.state === 'error') {
          return h(Empty, {
            title: '读取 Skill 目录失败', text: cat.error,
            action: h(TextButton, { onClick: () => loadCatalog(s.sessionId) }, '重试'),
          });
        }
        if (!cat.skills.length) {
          return cat.state === 'ready'
            ? h(Empty, { title: '这个会话没有可用的 Skill', text: '加载哪些 Skill 由会话的预设决定。' })
            : h(Empty, { title: '正在读取 Skill 目录…' });
        }
        const q = query.trim().toLowerCase();
        const twCount = cat.skills.filter((k) => k.tw).length;
        const otherCount = cat.skills.length - twCount;
        const rows = cat.skills.filter((k) => (scope === 'all' || (scope === 'tw' ? k.tw : !k.tw))
          && (!usedOnly || a.counts[k.name])
          && (!q || k.name.toLowerCase().includes(q) || k.description.toLowerCase().includes(q)
            || (k.zh || '').toLowerCase().includes(q) || (k.tag || '').toLowerCase().includes(q)
            || (k.detail || '').toLowerCase().includes(q)));
        const liveNames = Object.keys(a.inUse);
        const summary = '本会话调用 ' + a.total + ' 次' + (a.hasMore ? '（更早的记录未加载）' : '')
          + ' · TW ' + twCount + ' / 其他 ' + otherCount
          + (liveNames.length ? ' · 调用中：' + liveNames.join('、') : '');
        return h(Fragment, null,
          h('div', { className: 'gh2-tools' },
            h(SearchBox, { value: query, onChange: setQuery }),
            h(Chip, { active: scope === 'all', onClick: () => setScope('all') }, '全部 ' + cat.skills.length),
            h(Chip, { active: scope === 'tw', onClick: () => setScope('tw') }, 'TW ' + twCount),
            h(Chip, { active: scope === 'other', onClick: () => setScope('other') }, '其他 ' + otherCount),
            h(Chip, { active: usedOnly, onClick: () => setUsedOnly(!usedOnly) }, '本会话用过')),
          h('p', { className: 'gh2-summary', 'data-gh': 'summary' }, summary),
          rows.length
            ? h('ul', { className: 'gh2-list', 'data-gh': 'skill-list', ref: listRef }, rows.map((k) => {
              const live = !!a.inUse[k.name];
              const count = a.counts[k.name] || 0;
              const isOpen = openName === k.name;
              return h('li', { key: k.name, className: 'gh2-row' + (live ? ' is-live' : '') + (isOpen ? ' is-open' : ''), 'data-skill': k.name },
                h('button', {
                  type: 'button', className: 'gh2-rowmain', 'aria-expanded': isOpen, draggable: true,
                  onClick: () => setOpenName(isOpen ? null : k.name),
                  onDoubleClick: () => insertSkill(k.name),
                  onDragStart: (e) => startSkillDrag(e, k.name),
                },
                  h('span', { className: 'gh2-rowtext' },
                    h('span', { className: 'gh2-nameline' },
                      h('span', { className: 'gh2-rowtag' }, k.tag || '其他'),
                      h('span', { className: 'gh2-name' }, k.name)),
                    h('span', { className: 'gh2-desc' }, k.zh || k.description || '没有说明')),
                  h('span', { className: 'gh2-meta' }, live ? [h(Dot, { key: 'd', live: true }), '调用中'] : count ? count + ' 次' : '')),
                isOpen ? h('div', { className: 'gh2-rowmore' },
                  h('p', { className: 'gh2-rowdetail', 'data-gh': 'row-detail' }, k.detail || k.zh || k.description || '没有说明'),
                  h('div', { className: 'gh2-rowactions' },
                    h(TextButton, { onClick: () => insertSkill(k.name) }, '插入到输入框'),
                    h(TextButton, {
                      disabled: live || !!sending,
                      title: live ? '这个 Skill 正在调用' : sending ? '正在发送上一条指令' : '把 /' + k.name + ' 发给当前会话',
                      onClick: async () => {
                        if (sendingRef.current) return;
                        sendingRef.current = true;
                        setSending(k.name);
                        try { await runSkill(k.name); }
                        finally {
                          // 指令被宿主接受后，按钮再锁 1.5 秒；双击或连点不会发出第二条。
                          setTimeout(() => { sendingRef.current = false; setSending(null); }, 1500);
                        }
                      },
                    }, live ? '调用中' : sending === k.name ? '发送中…' : '运行 Skill'))) : null);
            }))
            : h('p', { className: 'gh2-none' }, usedOnly
              ? '本会话还没有调用过' + (scope === 'tw' ? ' TW Skill' : scope === 'other' ? '其他 Skill' : ' Skill')
              : scope === 'tw' ? '没有匹配的 TW Skill' : scope === 'other' ? '这个会话没有其他来源的 Skill' : '没有匹配的 Skill'),
          a.calls.length ? h('section', { className: 'gh2-recent', 'data-gh': 'recent' },
            h('h4', null, '最近调用'),
            h('ul', null, a.calls.slice(-6).reverse().map((c, i) => h('li', { key: String(c.seq !== undefined ? c.seq : i) + c.name },
              h('button', { type: 'button', onClick: () => { setUsedOnly(false); setQuery(''); setOpenName(c.name); } },
                h('span', { className: 'gh2-name' }, c.name),
                h('span', { className: 'gh2-meta' }, (c.source === 'model' ? '模型调用' : '手动') + ' · ' + ago(c.time, now))))))) : null);
      }
      /* ---------- M5：资料库筛选页 / 真实世界书 / MVU / 界面 ---------- */

      function errorLine(text, dataName) {
        if (!text) return null;
        return h('p', { className: 'gh2-m5-error', role: 'alert', 'data-gh': dataName || undefined }, text);
      }

      function leafPreview(value) {
        if (typeof value === 'string') {
          const text = value.length > 100 ? value.slice(0, 100) + '…' : value;
          return JSON.stringify(text);
        }
        return String(value);
      }
      function uidText(uid) {
        return uid === undefined || uid === null ? '（无）' : String(uid);
      }

      /** 只读 JSON 节点树：对象/数组可折叠，字符串截断显示；直接来自文件 raw。 */
      function JsonValue({ name, value, depth, budget }) {
        if (budget) {
          budget.left -= 1;
          if (budget.left < 0) return null;
        }
        const isObject = value !== null && typeof value === 'object';
        if (!isObject) {
          return h('div', { className: 'gh2-json-leaf' },
            name !== undefined && name !== '' ? h('span', { className: 'gh2-json-key' }, name) : null,
            name !== undefined && name !== '' ? ' ' : null,
            h('span', { className: 'gh2-json-type' }, value === null ? 'null' : typeof value),
            ' ',
            h('span', { className: 'gh2-json-val' }, leafPreview(value)));
        }
        const isArray = Array.isArray(value);
        const rows = isArray ? value.map((item, index) => [String(index), item]) : Object.entries(value);
        const shown = rows.slice(0, 200);
        return h('details', { className: 'gh2-json-node', open: depth === 0 ? true : undefined },
          h('summary', null,
            name !== undefined && name !== '' ? h('span', { className: 'gh2-json-key' }, name) : null,
            name !== undefined && name !== '' ? ' ' : null,
            h('span', { className: 'gh2-json-type' }, (isArray ? '数组 ' : '对象 ') + rows.length + ' 项')),
          shown.map(([key, item]) => h(JsonValue, { key, name: key, value: item, depth: (depth || 0) + 1, budget })),
          rows.length > shown.length ? h('p', { className: 'gh2-m5-meta' }, '…还有 ' + (rows.length - shown.length) + ' 项未展开') : null,
          budget && budget.left <= 0 ? h('p', { className: 'gh2-m5-meta' }, '…节点太多，已截断；完整结构见原始 JSON。') : null);
      }

      function CardWorldbookSection({ s }) {
        const detail = s.ws.cardDetail;
        const wb = detail && detail.worldbook;
        const entries = wb && Array.isArray(wb.entries) ? wb.entries : [];
        if (!detail || !entries.length) return null;
        const cardName = detail.meta.name || detail.meta.characterName || basename(detail.file.path) || '当前卡';
        return h('section', { className: 'gh2-card-wb', 'data-gh': 'card-worldbook-section' },
          h('details', { className: 'gh2-card-wb-fold', open: true },
            h('summary', { className: 'gh2-card-wb-summary' },
              h('b', { 'data-gh': 'card-wb-title' }, '卡内世界书（只读）'),
              h('span', { className: 'gh2-m5-meta' }, ' · ' + cardName + ' · ' + (wb.count || entries.length) + ' 条'),
              h('span', { className: 'gh2-m5-chip' }, '只读')),
            h('p', { className: 'gh2-m5-note' }, '来自当前卡；只读展示，不保存卡文件，不发写请求。'),
            h('div', { className: 'gh2-card-wb-list', 'data-gh': 'card-wb-entries' },
              entries.map((entry, index) => h('details', {
                key: String(entry.uid) + ':' + index,
                className: 'gh2-card-wb-entry',
                'data-gh': 'card-wb-entry',
                'data-index': String(index),
              },
                h('summary', null,
                  h('span', { className: 'gh2-card-wb-entrytitle' }, entry.comment || '（没有标题）'),
                  h('span', { className: 'gh2-card-wb-key' }, entry.keys.length ? entry.keys.join(' / ') : (entry.key || '无 key')),
                  h('span', { className: 'gh2-m5-meta' }, 'UID ' + metaText(entry.uid))),
                h('pre', { className: 'gh2-card-wb-content', 'data-gh': 'card-wb-content' }, entry.content || '（空正文）'))))));
      }

      function WorldbookPane() {
        const s = useStoreState();
        const wb = s.wb;
        const rawText = useMemo(() => jsonPreview(wb.raw), [wb.raw, wb.selectedPath]);
        const entry = wb.openIndex >= 0 ? wb.entries[wb.openIndex] : null;
        const cardWb = s.ws.cardDetail && s.ws.cardDetail.worldbook;
        const hasCardWb = !!(cardWb && Array.isArray(cardWb.entries) && cardWb.entries.length);
        const kindLabel = wb.kind === 'st-object' ? 'st-object（json.entries 对象）'
          : wb.kind === 'st-array' ? 'st-array（数组）'
            : wb.kind === 'unknown' ? '结构未识别' : '';
        const openDir = () => openWorldbookRoot(wb.rootInput);
        return h('div', { className: 'gh2-m5', 'data-gh': 'worldbook-pane' },
          h('p', { className: 'gh2-m5-lead' }, '读写本机世界书 JSON。目录和文件都由宿主校验；保存前宿主会备份旧版，页面只显示真实响应。'),
          s.ws.restoreNotice ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'ws-restore-notice' }, s.ws.restoreNotice) : null,
          errorLine(s.ws.cardInspectError, 'card-inspect-error-wb'),
          s.ws.cardInspectBusy ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'card-inspect-busy-wb' }, '正在读取卡内世界书 / MVU / 脚本元信息…') : null,
          h(CardWorldbookSection, { s }),
          hasCardWb ? h('div', { className: 'gh2-mvu-sep' }) : null,
          h('div', { className: 'gh2-m5-rowhead', 'data-gh': 'worldbook-file-heading' },
            h('b', null, '本机世界书文件（可编辑）'),
            h('span', { className: 'gh2-m5-meta' }, '真实 .json · 独立于卡内只读内容')),
          h('div', { className: 'gh2-m5-actions' },
            h(TextButton, {
              onClick: pickWorldbookRoot,
              disabled: wb.picking,
              'data-gh': 'wb-pick-root',
            }, wb.picking ? '正在打开目录选择器…' : '选择世界书目录'),
            h('input', {
              type: 'text',
              className: 'gh2-finput',
              'data-gh': 'wb-root-input',
              'aria-label': '世界书目录路径',
              placeholder: '或输入目录路径（绝对路径）',
              value: wb.rootInput,
              onChange: (e) => setWb({ rootInput: e.target.value }),
              onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); openDir(); } },
            }),
            h(TextButton, { onClick: openDir, disabled: wb.filesState === 'loading', 'data-gh': 'wb-open-root' },
              wb.filesState === 'loading' ? '正在打开…' : '打开目录')),
          h('p', { className: 'gh2-m5-note' }, '没有原生目录选择器时用路径框；这里不会把目录内容假装成已经读到。'),
          errorLine(wb.folderError, 'wb-error'),
          wb.root ? h('p', { className: 'gh2-m5-meta' },
            '当前目录：', h('span', { className: 'gh2-mono', 'data-gh': 'wb-root' }, wb.root),
            ' · ', wb.filesState === 'loading' ? '正在读取…' : wb.files.length + ' 个 .json') : null,
          wb.filesState === 'ready' && !wb.files.length
            ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'wb-empty-files' }, '这个目录下（最多三层）没有 .json 文件。换一个目录，或确认文件扩展名。')
            : null,
          wb.files.length ? h('div', { className: 'gh2-wb-files', 'data-gh': 'wb-files' }, wb.files.map((file) => h('button', {
            key: file.path,
            type: 'button',
            title: file.path,
            className: 'gh2-wb-file' + (file.path === wb.selectedPath ? ' is-active' : ''),
            'data-gh': 'wb-file',
            'data-path': file.path,
            onClick: () => readWorldbookFile(file.path),
          },
            h('span', { className: 'gh2-wb-fname' }, file.name || basename(file.path)),
            h('span', { className: 'gh2-m5-meta' }, formatSize(file.size))))) : null,
          wb.selectedPath ? h(Fragment, null,
            h('div', { className: 'gh2-m5-actions gh2-wb-filehead' },
              h('span', { className: 'gh2-mono', 'data-gh': 'wb-path' }, wb.selectedPath),
              kindLabel ? h('span', { className: 'gh2-m5-chip', 'data-gh': 'wb-kind' }, kindLabel) : null,
              wb.dirty ? h('span', { className: 'gh2-m5-dirty', 'data-gh': 'wb-dirty' }, '未保存') : h('span', { className: 'gh2-m5-meta' }, '没有未保存修改'),
              wb.saving ? h('span', { className: 'gh2-m5-meta' }, '保存中…') : null,
              h('span', { className: 'gh2-spacer' }),
              h(TextButton, {
                onClick: saveWorldbook,
                disabled: wb.saving || (!wb.dirty && wb.kind !== 'unknown'),
                'data-gh': 'wb-save',
              }, wb.saving ? '保存中…' : wb.pendingUnknown ? '再点一次确认保存' : '保存')),
            wb.loadingFile ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'wb-loading' }, '正在读取文件…') : null,
            errorLine(wb.error, 'wb-file-error'),
            wb.saveNotice ? h('p', { className: 'gh2-m5-ok', 'data-gh': 'wb-backup' }, wb.saveNotice) : null,
            wb.kind === 'unknown' ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'wb-unknown' }, '结构未识别：这个文件不是 st-object（json.entries 对象）或 st-array（数组）。可以查看原始 JSON；保存会把原 JSON 原样写回并先备份，需要点两次保存确认。') : null,
            wb.pendingUnknown ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'wb-confirm' }, '再点一次“保存”确认写回结构未识别的文件。') : null,
            wb.entries.length ? h('div', { className: 'gh2-wb-grid' },
              h('section', { className: 'gh2-wb-listbox' },
                h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '条目'), h('span', { className: 'gh2-m5-meta' }, wb.entries.length + ' 条')),
                h('ul', { className: 'gh2-wb-list', 'data-gh': 'wb-entries' }, wb.entries.map((item, index) => h('li', { key: item.slot + ':' + index },
                  h('button', {
                    type: 'button',
                    className: 'gh2-wb-entry' + (index === wb.openIndex ? ' is-open' : ''),
                    'data-gh': 'wb-entry',
                    'data-index': String(index),
                    onClick: () => setWb({ openIndex: index, pendingUnknown: false }),
                  },
                    h('span', { className: 'gh2-wb-entrytitle' }, item.comment || '（没有标题）'),
                    h('span', { className: 'gh2-m5-meta' }, 'UID ' + uidText(item.uid) + ' · ' + parseKeys(item.keysText).length + ' key')))))),
              entry ? h('section', { className: 'gh2-wb-editor', 'data-gh': 'wb-editor' },
                h('label', { className: 'gh2-m5-field' }, h('span', null, '标题 / comment'),
                  h('input', {
                    type: 'text',
                    className: 'gh2-finput',
                    'data-gh': 'wb-title',
                    value: entry.comment,
                    onChange: (e) => updateWbEntry(wb.openIndex, { comment: e.target.value }),
                  })),
                h('label', { className: 'gh2-m5-field' }, h('span', null, '主关键词 / key（逗号或中文逗号分隔）'),
                  h('input', {
                    type: 'text',
                    className: 'gh2-finput',
                    'data-gh': 'wb-keys',
                    value: entry.keysText,
                    onChange: (e) => updateWbEntry(wb.openIndex, { keysText: e.target.value }),
                  })),
                h('label', { className: 'gh2-m5-field' }, h('span', null, '正文 / content'),
                  h('textarea', {
                    className: 'gh2-m5-ftextarea',
                    'data-gh': 'wb-body',
                    rows: 10,
                    spellCheck: false,
                    value: entry.content,
                    onChange: (e) => updateWbEntry(wb.openIndex, { content: e.target.value }),
                  })),
                h('p', { className: 'gh2-m5-meta' }, 'UID ' + uidText(entry.uid) + ' · 槽位 ' + entry.slot + ' · 保存回写 comment / content / key / keysecondary；未知字段保留。'))
              : h('section', { className: 'gh2-wb-editor' }, h('p', { className: 'gh2-m5-note' }, wb.kind === 'unknown' ? '结构未识别，没有可编辑条目；可以查看下面的原始 JSON。' : '这个文件没有条目。'))) : null,
            h('details', { className: 'gh2-m5-raw', 'data-gh': 'wb-raw' },
              h('summary', null, '原始 JSON（只读）'),
              h('pre', { className: 'gh2-m5-pre' }, rawText)),
            h('section', { className: 'gh2-wb-versions', 'data-gh': 'wb-versions' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '版本备份'), h('span', { className: 'gh2-m5-meta' }, '保存在 .godhand/versions'),
                h('span', { className: 'gh2-spacer' }),
                h(TextButton, {
                  onClick: () => refreshWbVersions(wb.selectedPath),
                  disabled: wb.versionsState === 'loading',
                  'data-gh': 'wb-versions-refresh',
                }, wb.versionsState === 'loading' ? '刷新中…' : '刷新版本')),
              errorLine(wb.versionsError, 'wb-versions-error'),
              wb.versions.length ? h('ul', { className: 'gh2-m5-list' }, wb.versions.map((version) => h('li', {
                key: version.path, className: 'gh2-m5-version', title: version.path, 'data-gh': 'wb-version',
              },
                h('span', null, formatMtime(version.mtime)),
                h('span', { className: 'gh2-mono' }, version.name || basename(version.path)),
                h('span', { className: 'gh2-m5-meta' }, formatSize(version.size)))))
                : h('p', { className: 'gh2-m5-meta' }, wb.versionsAt ? '还没有备份。' : '还没读取版本列表。'))
          ) : h('p', { className: 'gh2-m5-note' }, '先选目录，再点一个 .json 文件读取。'));
      }

      function metaText(value) {
        if (value === undefined || value === null || value === '') return '（空）';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'object') {
          try { return JSON.stringify(value); } catch { return String(value); }
        }
        return String(value);
      }

      function mvuDefaultText(value) {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return JSON.stringify(value);
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try {
          const text = JSON.stringify(value);
          return text.length > 80 ? text.slice(0, 80) + '…' : text;
        } catch {
          return String(value);
        }
      }

      /** 一个 MVU MVU：key、type、default；record 的子字段 key 统一显示成 *。 */
      function MvuNode({ node, depth, star }) {
        const rawKey = node && node.key !== undefined && node.key !== null ? String(node.key) : '（未命名）';
        const key = star ? '*' : rawKey;
        const type = node && typeof node.type === 'string' && node.type ? node.type : 'unknown';
        const children = node && Array.isArray(node.children) ? node.children : [];
        const isRecord = /(^|\.)record$/u.test(type);
        const def = mvuDefaultText(node && node.default);
        const head = [
          h('span', { key: 'k', className: 'gh2-mvu-key' + (key === '*' ? ' is-star' : '') }, key),
          h('span', { key: 't', className: 'gh2-mvu-type' }, type),
          def ? h('span', { key: 'd', className: 'gh2-mvu-default' }, '默认：' + def) : null,
        ];
        if (!children.length) return h('div', { className: 'gh2-mvu-leaf' }, head);
        return h('details', { className: 'gh2-mvu-node', open: depth === 0 ? true : undefined },
          h('summary', null, head),
          children.map((child, index) => h(MvuNode, {
            key: index + ':' + (child && child.key !== undefined ? String(child.key) : ''),
            node: child,
            depth: (depth || 0) + 1,
            star: isRecord,
          })));
      }

      function MvuSection({ s }) {
        const m = s.mvu;
        const wbRoot = s.wb.root;
        const files = (Array.isArray(s.wb.files) ? s.wb.files : []).filter((file) => /\.json$/iu.test(file.name || file.path));
        const schema = m.schema;
        const roots = schema ? schema.roots : [];
        return h('section', { className: 'gh2-mvu', 'data-gh': 'mvu-section' },
          h('div', { className: 'gh2-m5-rowhead' },
            h('b', null, 'MVU 组件'),
            h('span', { className: 'gh2-m5-chip' }, '组件目录与世界书相同')),
          h('p', { className: 'gh2-m5-warn gh2-mvu-note', 'data-gh': 'mvu-note' }, '静态解析 Zod；未执行运行时校验；不显示 PASS/FAIL。'),
          h('p', { className: 'gh2-m5-note' }, '只读：宿主只做字符串扫描，不执行被检查的脚本，也不运行 Zod。'),
          h('p', { className: 'gh2-m5-meta', 'data-gh': 'mvu-shared-root' },
            wbRoot ? h(Fragment, null, '组件目录与世界书相同：', h('span', { className: 'gh2-mono', 'data-gh': 'mvu-root' }, wbRoot))
              : '先在世界书页打开目录。'),
          errorLine(m.folderError, 'mvu-folder-error'),
          !wbRoot ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'mvu-shared-empty' }, '先在世界书页打开目录；这里不再单独选组件目录。')
            : s.wb.filesState === 'loading' ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'mvu-loading-files' }, '正在读取世界书目录…')
              : files.length ? h('div', { className: 'gh2-wb-files', 'data-gh': 'mvu-files' }, files.map((file) => h('button', {
                key: file.path,
                type: 'button',
                title: file.path,
                className: 'gh2-wb-file' + (file.path === m.selectedPath ? ' is-active' : ''),
                'data-gh': 'mvu-file',
                'data-path': file.path,
                onClick: () => inspectMvuFile(file.path),
              },
                h('span', { className: 'gh2-wb-fname' }, file.name || basename(file.path)),
                h('span', { className: 'gh2-m5-meta' }, formatSize(file.size)))))
                : h('p', { className: 'gh2-m5-warn', 'data-gh': 'mvu-empty-files' }, '世界书目录下没有 .json 组件。'),
          m.selectedPath ? h(Fragment, null,
            m.loadingFile ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'mvu-loading' }, '正在静态解析…') : null,
            errorLine(m.error, 'mvu-error'),
            m.file ? h('div', { className: 'gh2-mvu-meta', 'data-gh': 'mvu-file-meta' },
              h('span', null, h('b', null, '文件：'), m.file.name || basename(m.file.path), ' · ',
                h('span', { className: 'gh2-mono', 'data-gh': 'mvu-file-path' }, m.file.path), ' · ', formatSize(m.file.size))) : null,
            m.meta ? h('div', { className: 'gh2-mvu-meta', 'data-gh': 'mvu-meta' },
              h('span', null, h('b', null, 'type：'), metaText(m.meta.type)),
              h('span', null, h('b', null, 'enabled：'), metaText(m.meta.enabled)),
              h('span', { 'data-gh': 'mvu-meta-name' }, h('b', null, 'name：'), metaText(m.meta.name)),
              h('span', { 'data-gh': 'mvu-meta-id' }, h('b', null, 'id：'), metaText(m.meta.id)),
              h('span', { 'data-gh': 'mvu-meta-content' }, h('b', null, 'content 长度：'), metaText(m.meta.contentLength))) : null,
            m.warnings.length ? h('ul', { className: 'gh2-mvu-warnings', 'data-gh': 'mvu-warnings' },
              m.warnings.map((warning, index) => h('li', { key: index }, warning))) : null,
            schema ? h(Fragment, null,
              h('div', { className: 'gh2-mvu-meta', 'data-gh': 'mvu-schema-meta' },
                h('span', null, h('b', null, 'parser：'), schema.parser || '（宿主没返回）'),
                h('span', null, h('b', null, '节点：'), String(schema.nodeCount)),
                h('span', null, h('b', null, '根字段：'), String(roots.length))),
              roots.length ? h('div', { className: 'gh2-mvu-tree', 'data-gh': 'mvu-tree' },
                roots.map((node, index) => h(MvuNode, {
                  key: index + ':' + (node && node.key !== undefined ? String(node.key) : ''),
                  node,
                  depth: 0,
                })))
                : h('p', { className: 'gh2-m5-warn', 'data-gh': 'mvu-empty-roots' }, '宿主返回了 schema，但没有根字段。'))
              : (m.loadingFile ? null : (m.error ? null : h('p', { className: 'gh2-m5-warn', 'data-gh': 'mvu-reason' },
                m.reason === 'no-zod-object' ? '没有找到 const Schema / z.object（reason：no-zod-object）。'
                  : m.reason ? '宿主没有返回 schema（reason：' + m.reason + '）。'
                    : '宿主没有返回 schema，也没有给出 reason。'))))
            : h('p', { className: 'gh2-m5-note' }, wbRoot ? '点世界书目录里的 .json 脚本进行静态解析。' : '先在世界书页打开目录，再点一个 .json 脚本。'));
      }

      function CardMvuSection({ s }) {
        const detail = s.ws.cardDetail;
        const mvu = detail && detail.mvu;
        const schema = mvu && mvu.schema;
        if (!schema) return null;
        const script = mvu.script || {};
        const roots = Array.isArray(schema.roots) ? schema.roots : [];
        const scriptName = script.name || script.id || '未命名脚本';
        return h('section', {
          className: 'gh2-mvu gh2-card-mvu', 'data-gh': 'card-mvu-section',
          tabIndex: -1, 'aria-label': '卡内 MVU',
        },
          h('div', { className: 'gh2-m5-rowhead' },
            h('b', { 'data-gh': 'card-mvu-title' }, '卡内 MVU · ' + scriptName),
            h('span', { className: 'gh2-m5-chip' }, '来自当前卡'),
            h('span', { className: 'gh2-m5-chip' }, 'Zod 静态解析')),
          h('p', { className: 'gh2-m5-warn gh2-mvu-note', 'data-gh': 'card-mvu-note' },
            '来自当前卡；静态解析 Zod；未执行运行时校验；不显示 PASS/FAIL'),
          h('p', { className: 'gh2-m5-note' }, '只读：宿主只扫描脚本字符串，不执行卡内 JS，也不运行 Zod。'),
          h('div', { className: 'gh2-mvu-meta', 'data-gh': 'card-mvu-meta' },
            h('span', null, h('b', null, '脚本：'), scriptName),
            h('span', null, h('b', null, 'type：'), script.type || 'script'),
            h('span', null, h('b', null, 'enabled：'), script.enabled ? 'true' : 'false'),
            h('span', null, h('b', null, 'content 长度：'), String(script.contentLength || 0)),
            h('span', null, h('b', null, 'parser：'), schema.parser || 'static-zod-object'),
            h('span', null, h('b', null, '节点：'), String(schema.nodeCount || 0)),
            h('span', null, h('b', null, '根字段：'), String(roots.length))),
          mvu.warnings.length ? h('ul', { className: 'gh2-mvu-warnings', 'data-gh': 'card-mvu-warnings' },
            mvu.warnings.map((warning, index) => h('li', { key: index }, warning))) : null,
          roots.length ? h('div', { className: 'gh2-mvu-tree', 'data-gh': 'card-mvu-tree' },
            roots.map((node, index) => h(MvuNode, {
              key: index + ':' + (node && node.key !== undefined ? String(node.key) : ''),
              node,
              depth: 0,
            })))
            : h('p', { className: 'gh2-m5-warn', 'data-gh': 'card-mvu-empty-roots' }, '宿主返回了卡内 schema，但没有根字段。'));
      }

      function WorldbookJsonSection({ wb }) {
        if (!wb.selectedPath || wb.raw === null || wb.raw === undefined) {
          return h('section', { className: 'gh2-wb-json', 'data-gh': 'wb-json-section' },
            h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '当前世界书 JSON'), h('span', { className: 'gh2-m5-meta' }, '只读')),
            h('p', { className: 'gh2-m5-warn', 'data-gh': 'var-empty' }, '还没有打开世界书文件。先去世界书页选择一个 .json。'),
            h(TextButton, { onClick: () => setUi({ mode: 'full', tab: 'worldbook' }) }, '去世界书选择文件'));
        }
        const kind = wb.kind === 'st-object' ? 'st-object' : wb.kind === 'st-array' ? 'st-array' : '结构未识别';
        return h('section', { className: 'gh2-wb-json', 'data-gh': 'wb-json-section' },
          h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '当前世界书 JSON'), h('span', { className: 'gh2-m5-meta' }, '只读')),
          h('p', { className: 'gh2-m5-warn', 'data-gh': 'var-note' }, '真实文件结构；MVU 结构校验还没接入。这里只显示 JSON 节点，不做 PASS / FAIL 判断。'),
          h('p', { className: 'gh2-m5-meta' },
            '文件：', h('span', { className: 'gh2-mono', 'data-gh': 'var-path' }, wb.selectedPath),
            ' · ', kind, ' · ', String(wb.entries.length), ' 个条目'),
          wb.dirty ? h('p', { className: 'gh2-m5-note', 'data-gh': 'var-dirty-note' }, '世界书还有未保存修改：这里显示的是文件上一次读到（或保存成功）的真实 JSON，不是编辑器里的草稿。') : null,
          h('div', { className: 'gh2-json-tree', 'data-gh': 'var-tree' },
            h(JsonValue, { name: basename(wb.selectedPath), value: wb.raw, depth: 0, budget: { left: 2000 } })),
          h('p', { className: 'gh2-m5-note' }, '只读：节点直接来自文件；没有运行 MVU / Zod 校验，所以不显示通过或失败。'));
      }

      function legacyInitialDisplay(value, wildcard) {
        if (wildcard || value === undefined) return { text: '—', json: false };
        if (value === null) return { text: 'null', json: false };
        if (typeof value === 'string') return { text: value === '' ? '（空字符串）' : value, json: false };
        if (typeof value === 'number' || typeof value === 'boolean') return { text: String(value), json: false };
        return { text: JSON.stringify(value, null, 2), json: true };
      }
      function lookupLegacyInitial(statData, path) {
        if (!statData || typeof statData !== 'object') return undefined;
        let current = statData;
        for (const part of String(path).split('.')) {
          if (Array.isArray(current)) {
            const index = Number(part);
            if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined;
            current = current[index];
            continue;
          }
          if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) return undefined;
          current = current[part];
        }
        return current;
      }
      /** 把 Schema roots 扁平成节点列表；初始值保留 JSON，record 的 * 才不硬猜。 */
      function flattenLegacyNodes(roots, statData) {
        const out = [];
        const visit = (node, parentPath, depth, parentType, ancestorWildcard) => {
          const raw = node && typeof node === 'object' ? node : {};
          const key = raw.key !== undefined && raw.key !== null ? String(raw.key) : '（未命名）';
          const declaredType = typeof raw.type === 'string' && raw.type ? raw.type : 'unknown';
          const children = Array.isArray(raw.children) ? raw.children : [];
          const type = /^ref:/u.test(declaredType) && children.length ? 'object' : declaredType;
          const path = parentPath ? parentPath + '.' + key : key;
          const isWildcard = ancestorWildcard || key === '*' || /(^|\.)record$/u.test(parentType);
          const initial = legacyInitialDisplay(lookupLegacyInitial(statData, path), isWildcard);
          const defaultText = raw.default === undefined || raw.default === null ? '—' : mvuDefaultText(raw.default);
          out.push({
            path, key, type, defaultText,
            initialText: initial.text, initialJson: initial.json,
            depth, childCount: children.length, hasChildren: children.length > 0, parentPath,
          });
          for (const child of children) visit(child, path, depth + 1, type, isWildcard);
        };
        for (const root of Array.isArray(roots) ? roots : []) visit(root, '', 0, '', false);
        return out;
      }
      function workbenchActualType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
      }
      function workbenchSchemaType(type) {
        const raw = String(type || '');
        if (!raw || raw === 'any' || raw === 'unknown' || raw.startsWith('ref:')) return '';
        if (raw === 'integer') return 'number';
        if (raw === 'record') return 'object';
        return raw;
      }
      function collectInitialPaths(value, prefix, out) {
        if (prefix) out.push(prefix);
        if (Array.isArray(value)) {
          value.forEach((item, index) => collectInitialPaths(item, prefix ? prefix + '.' + index : String(index), out));
        } else if (value && typeof value === 'object') {
          Object.keys(value).sort().forEach((key) => collectInitialPaths(value[key], prefix ? prefix + '.' + key : key, out));
        }
      }
      function compareSchemaInitial(schemaNodes, initial) {
        const missing = [];
        const extra = [];
        const typeMismatch = [];
        const schemaByPath = new Map(schemaNodes.map((node) => [node.path, node]));
        const allowedPrefixes = schemaNodes
          .filter((node) => node.type === 'record' || node.type === 'array' || node.path.includes('*'))
          .map((node) => node.path);
        const missingPrefixes = [];
        for (const node of schemaNodes) {
          if (!node.path || node.path.includes('*')) continue;
          const schemaType = workbenchSchemaType(node.type);
          if (!schemaType) continue;
          if (missingPrefixes.some((prefix) => node.path === prefix || node.path.startsWith(prefix + '.'))) continue;
          const actual = lookupLegacyInitial(initial, node.path);
          if (actual === undefined) {
            missing.push({ path: node.path, schemaType });
            if (node.hasChildren || schemaType === 'array' || schemaType === 'object') missingPrefixes.push(node.path);
            continue;
          }
          const initialType = workbenchActualType(actual);
          if (initialType !== schemaType) typeMismatch.push({ path: node.path, schemaType, initialType });
        }
        const initialPaths = [];
        collectInitialPaths(initial, '', initialPaths);
        for (const path of initialPaths) {
          if (schemaByPath.has(path)) continue;
          if (allowedPrefixes.some((prefix) => path.startsWith(prefix + '.'))) continue;
          extra.push({ path });
        }
        return { missing, extra, typeMismatch, initialPaths };
      }
      function workbenchPath(path) {
        return String(path || '').replace(/^\//u, '').replace(/\//gu, '.');
      }
      function compareContractSchema(contract, schemaNodes, initialPaths) {
        const schemaByPath = new Map(schemaNodes.map((node) => [node.path, node]));
        const allowedPrefixes = schemaNodes
          .filter((node) => node.type === 'record' || node.type === 'array' || node.path.includes('*'))
          .map((node) => node.path);
        const initialSet = new Set(initialPaths);
        const ruleUnknown = [];
        const ruleTypeMismatch = [];
        const fields = contract && Array.isArray(contract.fields) ? contract.fields : [];
        for (const field of fields) {
          const path = workbenchPath(field && field.path);
          if (!path || path.includes('*') || initialSet.has(path)) continue;
          const node = schemaByPath.get(path);
          if (!node) {
            if (!allowedPrefixes.some((prefix) => path.startsWith(prefix + '.'))) {
              ruleUnknown.push({ path, type: workspaceString(field.type), label: workspaceString(field.label) });
            }
            continue;
          }
          const schemaType = workbenchSchemaType(node.type);
          const fieldType = workbenchSchemaType(field.type);
          if (schemaType && fieldType && fieldType !== 'any' && schemaType !== fieldType) {
            ruleTypeMismatch.push({ path, schemaType, ruleType: fieldType });
          }
        }
        return {
          ruleUnknown,
          ruleTypeMismatch,
          ruleChecks: contract && Array.isArray(contract.ruleChecks) ? contract.ruleChecks.map((check) => ({
            path: workbenchPath(check.path),
            label: workspaceString(check.label),
            detail: workspaceString(check.detail),
          })) : [],
        };
      }

      function LegacyNodesPane() {
        const s = useStoreState();
        const detail = s.ws.cardDetail;
        const cardMvu = detail && detail.mvu;
        const manualSchema = s.mvu && s.mvu.schema;
        const cardSchema = cardMvu && cardMvu.schema;
        const schema = cardSchema || manualSchema || null;
        const scriptName = cardMvu && cardMvu.script ? (cardMvu.script.name || cardMvu.script.id) : '';
        const sourceLabel = cardSchema ? '卡内 MVU · ' + (scriptName || '未命名脚本')
          : manualSchema ? '组件目录 · ' + (s.mvu.file && (s.mvu.file.name || basename(s.mvu.file.path)) || basename(s.mvu.selectedPath) || 'MVU 组件')
            : '';
        const sourceKey = cardSchema
          ? 'card:' + ((s.ws.activeCard && s.ws.activeCard.file && s.ws.activeCard.file.path) || '') + ':' + sourceLabel
          : manualSchema ? 'manual:' + (s.mvu.selectedPath || sourceLabel) : 'none';
        const statData = detail && detail.legacyVars ? detail.legacyVars.statData : null;
        const initVarSourceText = cardMvu && cardMvu.initVarSource ? cardMvu.initVarSource : '';
        const initialSourceLabel = initVarSourceText
          ? '真实变量书 · ' + (cardMvu.initVarName || '初始变量')
          : statData ? 'tavern_helper.legacyVars.stat_data' : '空对象';
        const [hostInitial, setHostInitial] = useState(null);
        const initialData = initVarSourceText ? hostInitial : statData;
        const nodes = useMemo(() => schema ? flattenLegacyNodes(schema.roots, initialData) : [], [schema, initialData]);
        const [search, setSearch] = useState('');
        const [selectedPath, setSelectedPath] = useState('');
        const [collapsed, setCollapsed] = useState(() => new Set());
        const focus = s.ws.legacyFocus;
        useEffect(() => {
          setSearch('');
          setCollapsed(new Set());
          setSelectedPath(nodes.length ? nodes[0].path : '');
        }, [sourceKey, nodes.length]);
        useEffect(() => {
          if (!focus) return;
          setSearch('');
          setCollapsed(new Set());
          const first = nodes[0];
          if (first) setSelectedPath(first.path);
          const timer = setTimeout(() => {
            const row = [...document.querySelectorAll('[data-gh="var-node-row"]')].find((el) => el.dataset.path === (first && first.path));
            if (!row) return;
            row.scrollIntoView({ block: 'center', behavior: 'smooth' });
            row.focus({ preventScroll: true });
            row.classList.add('is-focus');
            setTimeout(() => row.classList.remove('is-focus'), 1500);
          }, 80);
          return () => clearTimeout(timer);
        }, [focus, sourceKey]);
        useEffect(() => {
          setHostInitial(null);
          if (!initVarSourceText || !cardMvu || !cardMvu.schemaSource) return undefined;
          let cancelled = false;
          (async () => {
            try {
              const payload = await postJson(M5.api.mvuSimulate, {
                initialLegacys: initVarSourceText,
                operations: [],
                updateRules: '',
                schema: cardMvu.schemaSource,
                dialect: 'rfc6902',
              });
              const result = payload.result || payload;
              if (!cancelled && result && result.before && typeof result.before === 'object' && !Array.isArray(result.before)) {
                setHostInitial(result.before);
              }
            } catch {}
          })();
          return () => { cancelled = true; };
        }, [sourceKey, initVarSourceText]);
        const [compareBusy, setCompareBusy] = useState(false);
        const [compareError, setCompareError] = useState('');
        const [compareResult, setCompareResult] = useState(null);
        const [compareCollapsed, setCompareCollapsed] = useState(() => new Set());
        const [runBusy, setRunBusy] = useState(false);
        const [runError, setRunError] = useState('');
        const [runResult, setRunResult] = useState(null);
        const [writeConfirm, setWriteConfirm] = useState(false);
        const [writing, setWriting] = useState(false);
        const [writeError, setWriteError] = useState('');
        const [writeResult, setWriteResult] = useState(null);
        const writeResultSourceRef = useRef('');
        const initialJson = statData ? JSON.stringify(statData, null, 2) : '{}';
        const initialDefault = initVarSourceText || initialJson;
        const defaultRuleEntries = cardMvu && Array.isArray(cardMvu.updateRuleEntries) && cardMvu.updateRuleEntries.length
          ? cardMvu.updateRuleEntries.map((entry) => ({ ...entry }))
          : (cardMvu && cardMvu.updateRules ? [{ id: 'rule-1', name: '更新规则', content: cardMvu.updateRules }] : []);
        const makeWork = (notice = '') => ({
          sourceKey,
          schemaSource: cardMvu && cardMvu.schemaSource ? cardMvu.schemaSource : '',
          initialText: initialDefault,
          initialSource: initialSourceLabel,
          ruleEntries: defaultRuleEntries.map((entry) => ({ ...entry })),
          beforeText: initialDefault,
          operationsText: '[]',
          dialect: 'rfc6902',
          resetNotice: notice,
        });
        const work = s.ws.varWork && s.ws.varWork.sourceKey === sourceKey ? s.ws.varWork : makeWork('');
        const workRuleEntries = Array.isArray(work.ruleEntries) ? work.ruleEntries : defaultRuleEntries;
        const mergedRules = workRuleEntries.map((entry) => entry.content || '').join('\n\n');
        useEffect(() => {
          const current = store.get().ws.varWork;
          if (!current || current.sourceKey !== sourceKey) {
            setWs({ varWork: makeWork(current ? '当前卡/来源已切换，工作副本已重置。' : (sourceLabel ? '工作副本已从当前卡载入。' : '')) });
          }
          setCompareResult(null);
          setCompareError('');
          setCompareBusy(false);
          setCompareCollapsed(new Set());
          setRunResult(null);
          setRunError('');
          setRunBusy(false);
          setWriteConfirm(false);
          setWriteError('');
          if (writeResultSourceRef.current !== sourceKey) setWriteResult(null);
          setWriting(false);
        }, [sourceKey]);
        const updateWork = (patch) => {
          const current = store.get().ws.varWork;
          const base = current && current.sourceKey === sourceKey ? current : makeWork('');
          setWs({ varWork: { ...base, ...patch, sourceKey } });
        };
        const updateRuleEntry = (index, content) => {
          const next = workRuleEntries.map((entry, item) => item === index ? { ...entry, content } : entry);
          updateWork({ ruleEntries: next });
        };
        const reloadWork = () => {
          setWs({ varWork: makeWork('已从当前卡重新载入工作副本。') });
          setCompareResult(null);
          setCompareError('');
          setCompareCollapsed(new Set());
          setRunResult(null);
          setRunError('');
          setWriteConfirm(false);
          setWriteError('');
          writeResultSourceRef.current = '';
          setWriteResult(null);
        };
        const workTab = ['structure', 'compare', 'run'].includes(s.ws.legacyTab) ? s.ws.legacyTab : 'structure';
        const setWorkTab = (next) => setWs({ legacyTab: next });
        async function runCompare() {
          setCompareBusy(true);
          setCompareError('');
          setCompareResult(null);
          setCompareCollapsed(new Set());
          try {
            let schema = null;
            let schemaError = '';
            try {
              const parsed = await postJson(M5.api.mvuParse, { content: work.schemaSource });
              schema = normalizeMvuSchema(parsed.schema);
              if (!schema) schemaError = workspaceString(parsed.reason) || 'no-schema';
            } catch (error) {
              schemaError = errorText(error);
            }
            let initial = null;
            let initialError = '';
            try {
              const seedPayload = await postJson(M5.api.mvuSimulate, {
                initialLegacys: work.initialText,
                operations: [],
                updateRules: '',
                schema: work.schemaSource,
                dialect: 'rfc6902',
              });
              const seed = seedPayload.result || seedPayload;
              if (seed && seed.before && typeof seed.before === 'object' && !Array.isArray(seed.before)) {
                initial = seed.before;
              } else {
                initialError = '宿主没有返回可对照的初始变量对象。';
              }
            } catch (error) {
              initialError = errorText(error);
            }
            let simulation = null;
            let simulateError = '';
            try {
              const payload = await postJson(M5.api.mvuSimulate, {
                initialLegacys: work.initialText,
                operations: [],
                updateRules: mergedRules,
                schema: work.schemaSource,
                dialect: 'rfc6902',
              });
              simulation = payload.result || payload;
            } catch (error) {
              simulateError = errorText(error);
            }
            const schemaNodes = schema ? flattenLegacyNodes(schema.roots, null) : [];
            const initialCompare = initial ? compareSchemaInitial(schemaNodes, initial) : { missing: [], extra: [], typeMismatch: [], initialPaths: [] };
            const ruleCompare = compareContractSchema(simulation && simulation.contract, schemaNodes, initialCompare.initialPaths);
            setCompareResult({
              schemaError,
              initialError,
              simulateError,
              schemaParsed: !!schema,
              schemaReason: schema ? '' : schemaError,
              schemaNodes,
              schemaNodeCount: schemaNodes.length,
              schemaFieldCount: schemaNodes.filter((node) => node.type !== 'object' && !node.path.includes('*') && !/^ref:/u.test(node.type)).length,
              fieldCount: simulation && simulation.contract && Array.isArray(simulation.contract.fields) ? simulation.contract.fields.length : 0,
              ruleEntryCount: workRuleEntries.length,
              initialSource: work.initialSource || initialSourceLabel,
              missing: initialCompare.missing,
              extra: initialCompare.extra,
              typeMismatch: initialCompare.typeMismatch,
              ruleUnknown: ruleCompare.ruleUnknown,
              ruleTypeMismatch: ruleCompare.ruleTypeMismatch,
              ruleChecks: ruleCompare.ruleChecks,
            });
          } catch (error) {
            setCompareError(errorText(error));
          } finally {
            setCompareBusy(false);
          }
        }
        async function runSimulation() {
          setRunBusy(true);
          setRunError('');
          setRunResult(null);
          try {
            const payload = await postJson(M5.api.mvuSimulate, {
              initialLegacys: work.beforeText,
              operations: work.operationsText,
              updateRules: mergedRules,
              schema: work.schemaSource,
              dialect: work.dialect || 'rfc6902',
            });
            const result = payload.result || payload;
            const operations = result && result.operation;
            const operationCount = Array.isArray(operations) ? operations.length
              : operations && Array.isArray(operations.operations) ? operations.operations.length : 0;
            setRunResult({
              result,
              checks: result && Array.isArray(result.checks) ? result.checks : [],
              diff: result && Array.isArray(result.diff) ? result.diff : [],
              after: result ? result.after : null,
              trace: result && result.trace ? result.trace : result,
              operationCount,
              fieldCount: result && result.contract && Array.isArray(result.contract.fields) ? result.contract.fields.length : 0,
              zodExecuted: !!(result && ((result.trace && result.trace.schema && result.trace.schema.zodExecuted)
                || (result.schema && result.schema.zodExecuted))),
            });
          } catch (error) {
            setRunError(errorText(error));
          } finally {
            setRunBusy(false);
          }
        }
        async function writeCardBack() {
          setWriting(true);
          setWriteError('');
          setWriteResult(null);
          try {
            const wsNow = store.get().ws;
            const card = wsNow.activeCard && wsNow.activeCard.file;
            if (!card || !card.path) throw new Error('没有选中的卡，无法写回');
            const project = activeProject();
            const root = (project && project.root) || wsNow.root || '';
            const body = { path: card.path };
            if (work.schemaSource) body.schemaContent = work.schemaSource;
            if (workRuleEntries.length) {
              body.updateRules = workRuleEntries.map((entry) => ({
                id: entry.id, name: entry.name, content: entry.content,
              }));
            }
            const initKind = cardMvu && cardMvu.initVar ? cardMvu.initVar.kind : '';
            if (initKind === 'worldbook' || (!initKind && cardMvu && cardMvu.initVarSource)) {
              body.initVarContent = work.initialText;
            } else if (initKind === 'tavern-helper' || (!initKind && statData)) {
              try {
                body.legacyVars = JSON.parse(work.initialText);
              } catch (error) {
                throw new Error('初始变量是 tavern_helper.legacyVars，需要 JSON 对象：' + error.message);
              }
            }
            const data = await postJson(M5.api.cardWrite, body);
            if (data && data.ok === false) throw new Error(data.error || data.message || '写回失败');
            setWriteResult(data);
            writeResultSourceRef.current = sourceKey;
            setWriteConfirm(false);
            setWs({ cardDetail: null });
            const inspected = await inspectCardDetail(root, card.path, { silent: true });
            setWriteResult(data);
            if (!inspected.ok) setWriteError('写回成功，但重新 inspect 失败：' + inspected.error);
          } catch (error) {
            setWriteError(errorText(error));
          } finally {
            setWriting(false);
          }
        }
        const query = search.trim().toLowerCase();
        const nodeByPath = useMemo(() => new Map(nodes.map((node) => [node.path, node])), [nodes]);
        const matchingPaths = new Set();
        if (query) {
          for (const node of nodes) {
            if (![node.path, node.key, node.type].some((value) => String(value).toLowerCase().includes(query))) continue;
            let parent = node.path;
            while (parent) {
              matchingPaths.add(parent);
              const parentNode = nodeByPath.get(parent);
              parent = parentNode ? parentNode.parentPath : '';
            }
          }
        }
        const isVisible = (node) => {
          let parent = node.parentPath;
          while (parent) {
            if (collapsed.has(parent)) return false;
            const parentNode = nodeByPath.get(parent);
            parent = parentNode ? parentNode.parentPath : '';
          }
          return true;
        };
        const visible = query ? nodes.filter((node) => matchingPaths.has(node.path)) : nodes.filter(isVisible);
        const selected = nodes.find((node) => node.path === selectedPath) || null;
        const toggle = (path) => {
          setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path); else next.add(path);
            return next;
          });
        };
        const parents = nodes.filter((node) => node.hasChildren);
        const allCollapsed = parents.length > 0 && parents.every((node) => collapsed.has(node.path));
        const toggleAll = () => {
          if (allCollapsed) setCollapsed(new Set());
          else setCollapsed(new Set(parents.map((node) => node.path)));
        };
        const treeRows = visible.map((node) => h('button', {
          key: node.path,
          type: 'button',
          role: 'treeitem',
          className: 'gh2-var-treeitem' + (node.path === selectedPath ? ' is-selected' : ''),
          'aria-level': node.depth + 1,
          'aria-selected': node.path === selectedPath,
          'aria-expanded': node.hasChildren ? !collapsed.has(node.path) : undefined,
          'data-gh': 'var-node-row',
          'data-path': node.path,
          title: node.path,
          style: { paddingLeft: (7 + node.depth * 14) + 'px' },
          onClick: () => setSelectedPath(node.path),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPath(node.path); }
            if (node.hasChildren && e.key === 'ArrowLeft' && !collapsed.has(node.path)) toggle(node.path);
            if (node.hasChildren && e.key === 'ArrowRight' && collapsed.has(node.path)) toggle(node.path);
          },
        },
          h('span', {
            className: 'gh2-var-disclosure',
            'data-gh': 'var-toggle',
            'aria-hidden': node.hasChildren ? undefined : 'true',
            onClick: node.hasChildren ? (e) => { e.stopPropagation(); toggle(node.path); } : undefined,
          }, node.hasChildren ? (collapsed.has(node.path) ? '▸' : '▾') : '•'),
          h('code', { className: 'gh2-var-treekey' }, node.key),
          h('small', { className: 'gh2-var-treemeta' }, node.childCount ? node.type + ' · ' + node.childCount : node.type)));
        const treePane = h('div', { className: 'gh2-var-tree-pane' },
          h('div', { className: 'gh2-var-panehead' },
            h('div', null, h('span', null, '变量结构'), h('h4', null, '路径树')),
            h('span', { className: 'gh2-m5-meta' }, nodes.length + ' 个节点')),
          h('div', { className: 'gh2-var-treetools' },
            h('input', {
              type: 'search',
              className: 'gh2-finput',
              'data-gh': 'var-search',
              'aria-label': '搜索MVU',
              placeholder: '搜索路径 / key / type',
              value: search,
              onChange: (e) => setSearch(e.target.value),
            }),
            h(TextButton, { onClick: toggleAll, 'data-gh': 'var-collapse-all' }, allCollapsed ? '全部展开' : '全部折叠')),
          h('div', { className: 'gh2-var-tree', role: 'tree', 'aria-label': '变量路径树', 'data-gh': 'var-tree' },
            treeRows.length ? treeRows : h('div', { className: 'gh2-var-tree-empty', 'data-gh': 'var-tree-empty' },
              h('strong', null, query ? '没有匹配的变量路径' : '空变量树'),
              h('span', null, query ? '换一个关键词，或清空搜索。' : 'Schema 没有根字段。'))));
        const field = (label, value, gh, mono) => h('div', { className: 'gh2-m5-field' },
          h('span', null, label),
          h('div', { className: 'gh2-var-value' + (mono ? ' mono' : ''), 'data-gh': gh }, value));
        const detailPane = h('div', { className: 'gh2-var-detail-pane', 'data-gh': 'var-detail' },
          h('div', { className: 'gh2-var-panehead' },
            h('div', null, h('span', null, '节点详情'), h('h4', null, '只读节点')),
            h('code', { className: 'gh2-var-pathcode', 'data-gh': 'var-detail-path', title: selected ? selected.path : '当前变量完整路径' }, selected ? selected.path : '尚未选择节点')),
          selected ? h('div', { className: 'gh2-var-detailbody' },
            h('div', { className: 'gh2-var-fieldgrid' },
              field('key', selected.key, 'var-detail-key', true),
              field('type', selected.type, 'var-detail-type'),
              field('default', selected.defaultText, 'var-detail-default', true)),
            h('div', { className: 'gh2-m5-field' },
              h('span', null, '初始值'),
              h('pre', { className: 'gh2-var-initial' + (selected.initialJson ? ' is-json' : ''), 'data-gh': 'var-detail-initial' }, selected.initialText)),
            h('p', { className: 'gh2-m5-meta', 'data-gh': 'var-detail-source' }, '来源：', sourceLabel, ' · 初始：', initialSourceLabel),
            h('p', { className: 'gh2-m5-note' }, '初始值优先真实变量书 [initvar]，没有才用 stat_data；对象/数组显示 JSON；record 的 * 和缺失显示 —。'))
            : h('div', { className: 'gh2-var-detail-empty', 'data-gh': 'var-detail-empty' },
              h('strong', null, '选择一个MVU'),
              h('span', null, '左树选择节点后显示完整路径、类型、默认值和初始值。')));
        const sourceBar = h('div', { className: 'gh2-var-toolbar' },
          h('span', { className: 'gh2-m5-meta', 'data-gh': 'var-source' },
            '来源：', sourceLabel ? h('b', null, sourceLabel)
              : h('b', null, s.ws.activeCard ? '当前卡没有 MVU Schema' : '（未选卡/组件）'),
            ' · 初始：', h('span', { 'data-gh': 'var-initial-source-label' }, initialSourceLabel),
            ' · ', String(nodes.length), ' 个节点'));
        const structureContent = schema ? h('div', { className: 'gh2-var-visual', 'data-gh': 'var-visual' }, treePane, detailPane)
          : h('p', { className: 'gh2-m5-warn', 'data-gh': 'var-nodes-empty' },
            s.mvu && s.mvu.folderError ? '组件目录读取失败：' + s.mvu.folderError
              : '当前没有卡内或组件目录的 MVU Schema。先选中带 Schema 的卡，或在世界书目录里打开组件 JSON。');
        const resultBlock = (title, items, render, gh) => h('section', { className: 'gh2-var-resultblock', 'data-gh': gh },
          h('div', { className: 'gh2-m5-rowhead' }, h('b', null, title), h('span', { className: 'gh2-m5-meta' }, items.length + ' 项')),
          items.length
            ? h('ul', { className: 'gh2-var-resultlist' }, items.map((item, index) => h('li', { key: index }, render(item, index))))
            : h('p', { className: 'gh2-m5-note' }, '没有发现'));
        const compareSchemaNodes = compareResult && Array.isArray(compareResult.schemaNodes) ? compareResult.schemaNodes : [];
        const compareNodeByPath = new Map(compareSchemaNodes.map((node) => [node.path, node]));
        const compareVisibleNodes = compareSchemaNodes.filter((node) => {
          let parent = node.parentPath;
          while (parent) {
            if (compareCollapsed.has(parent)) return false;
            const parentNode = compareNodeByPath.get(parent);
            parent = parentNode ? parentNode.parentPath : '';
          }
          return true;
        });
        const toggleCompareNode = (path) => {
          setCompareCollapsed((current) => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path); else next.add(path);
            return next;
          });
        };
        const compareTree = compareResult ? h('section', { className: 'gh2-var-schema-tree-block', 'data-gh': 'var-schema-tree-block' },
          h('div', { className: 'gh2-m5-rowhead' }, h('b', null, 'Schema 树'), h('span', { className: 'gh2-m5-meta' }, compareSchemaNodes.length + ' 节点')),
          h('div', { className: 'gh2-var-schema-tree', role: 'tree', 'aria-label': '解析后的 Schema 树', 'data-gh': 'var-schema-tree' },
            compareVisibleNodes.length ? compareVisibleNodes.map((node) => h('div', {
              key: node.path, role: 'treeitem', className: 'gh2-var-schema-tree-row',
              'aria-level': node.depth + 1, 'aria-expanded': node.hasChildren ? !compareCollapsed.has(node.path) : undefined,
              'data-gh': 'var-schema-tree-row', 'data-path': node.path,
              style: { paddingLeft: (7 + node.depth * 14) + 'px' }, title: node.path,
            },
              h('span', {
                className: 'gh2-var-disclosure', 'data-gh': 'var-schema-tree-toggle',
                onClick: node.hasChildren ? () => toggleCompareNode(node.path) : undefined,
              }, node.hasChildren ? (compareCollapsed.has(node.path) ? '▸' : '▾') : '•'),
              h('code', { className: 'gh2-var-treekey' }, node.key),
              h('small', { className: 'gh2-var-treemeta' }, node.childCount ? node.type + ' · ' + node.childCount : node.type)))
              : h('p', { className: 'gh2-m5-note' }, '解析后显示 Schema 树。')))
          : null;
        const compareView = h('div', { className: 'gh2-var-compare', 'data-gh': 'var-compare' },
          h('p', { className: 'gh2-m5-note' }, 'Schema / 真实变量书 / 更新规则 三方对照；工作副本；写回卡需确认并备份；不执行 Zod。修改只影响本页，切卡/重载会重置。'),
          h('label', { className: 'gh2-m5-field' },
            h('span', null, 'Schema 源稿'),
            h('textarea', {
              className: 'gh2-var-textarea', 'data-gh': 'var-schema-source', rows: 10, spellCheck: false,
              value: work.schemaSource, onChange: (e) => updateWork({ schemaSource: e.target.value }),
            })),
          h('div', { className: 'gh2-var-two' },
            h('label', { className: 'gh2-m5-field' },
              h('span', { 'data-gh': 'var-init-source' }, '初始变量（来源：' + (work.initialSource || initialSourceLabel) + '）'),
              h('textarea', {
                className: 'gh2-var-textarea', 'data-gh': 'var-initial-source', rows: 8, spellCheck: false,
                value: work.initialText, onChange: (e) => updateWork({ initialText: e.target.value }),
              })),
            h('div', { className: 'gh2-m5-field' },
              h('span', null, '更新规则（逐条，' + workRuleEntries.length + ' 条）'),
              workRuleEntries.length ? h('div', { className: 'gh2-var-ruleentries', 'data-gh': 'var-rule-entries' },
                workRuleEntries.map((entry, index) => h('label', {
                  key: entry.id || index, className: 'gh2-var-ruleentry', 'data-gh': 'var-rule-entry', 'data-id': entry.id,
                },
                  h('span', null, (entry.name || '更新规则') + ' · ' + (entry.id || 'rule-' + (index + 1))),
                  h('textarea', {
                    className: 'gh2-var-textarea', 'data-gh': 'var-rule-entry-content', rows: 5, spellCheck: false,
                    value: entry.content, onChange: (e) => updateRuleEntry(index, e.target.value),
                  }))))
                : h('p', { className: 'gh2-m5-note' }, '当前卡没有更新规则条目。'))),
          h('div', { className: 'gh2-m5-actions' },
            h(TextButton, { onClick: runCompare, disabled: compareBusy, 'data-gh': 'var-compare-run' }, compareBusy ? '解析并对照中…' : '解析并对照'),
            h(TextButton, { onClick: reloadWork, disabled: compareBusy, 'data-gh': 'var-compare-reload' }, '从当前卡重新载入')),
          errorLine(compareError, 'var-compare-error'),
          compareResult ? h('div', { className: 'gh2-var-result', 'data-gh': 'var-compare-result' },
            h('div', { className: 'gh2-var-summary', 'data-gh': 'var-compare-summary' },
              h('span', { className: 'gh2-m5-chip' }, 'Schema 节点 ' + compareResult.schemaNodeCount),
              h('span', { className: 'gh2-m5-chip' }, 'Schema 字段 ' + compareResult.schemaFieldCount),
              h('span', { className: 'gh2-m5-chip' }, '契约字段 ' + compareResult.fieldCount),
              h('span', { className: 'gh2-m5-chip' }, '规则条目 ' + compareResult.ruleEntryCount)),
            errorLine(compareResult.schemaError, 'var-compare-schema-error'),
            errorLine(compareResult.initialError, 'var-compare-initial-error'),
            errorLine(compareResult.simulateError, 'var-compare-simulate-error'),
            compareTree,
            resultBlock('缺初始值', compareResult.missing, (item) => item.path + '（' + item.schemaType + '）', 'var-missing'),
            resultBlock('额外初始值', compareResult.extra, (item) => item.path, 'var-extra'),
            resultBlock('类型不一致', compareResult.typeMismatch, (item) => item.path + '：Schema ' + item.schemaType + ' / 初始 ' + item.initialType, 'var-type-mismatch'),
            resultBlock('规则字段不在 Schema', compareResult.ruleUnknown, (item) => item.path + (item.type ? '（' + item.type + '）' : ''), 'var-rule-unknown'),
            resultBlock('规则字段类型不一致', compareResult.ruleTypeMismatch, (item) => item.path + '：Schema ' + item.schemaType + ' / 规则 ' + item.ruleType, 'var-rule-type'),
            resultBlock('规则 check 条件', compareResult.ruleChecks, (item) => (item.path || '（无路径）') + ' · ' + (item.label || '（无标签）') + (item.detail ? ' · ' + item.detail : ''), 'var-rule-checks'))
            : h('p', { className: 'gh2-m5-note', 'data-gh': 'var-compare-empty' }, '点“解析并对照”后显示差异。'));
        const checkStatusText = { pass: '通过', observed: '命中', not_triggered: '未触发', not_run: '未运行' };
        const runView = h('div', { className: 'gh2-var-run', 'data-gh': 'var-run' },
          h('p', { className: 'gh2-m5-note' }, 'RPN 确定性安全子集：JSONPatch + safe contract；不执行 MVU 原生 JS/Zod。'),
          h('div', { className: 'gh2-var-two' },
            h('label', { className: 'gh2-m5-field' },
              h('span', null, '运行前状态（默认 ' + (work.initialSource || initialSourceLabel) + '）'),
              h('textarea', {
                className: 'gh2-var-textarea', 'data-gh': 'var-before', rows: 10, spellCheck: false,
                value: work.beforeText, onChange: (e) => updateWork({ beforeText: e.target.value }),
              })),
            h('label', { className: 'gh2-m5-field' },
              h('span', null, '候选 JSONPatch 操作'),
              h('textarea', {
                className: 'gh2-var-textarea', 'data-gh': 'var-operations', rows: 10, spellCheck: false,
                value: work.operationsText, onChange: (e) => updateWork({ operationsText: e.target.value }),
              }))),
          h('div', { className: 'gh2-m5-actions' },
            h('label', { className: 'gh2-var-dialect' }, h('span', null, '方言'),
              h('select', {
                className: 'gh2-finput', 'data-gh': 'var-dialect', value: work.dialect,
                onChange: (e) => updateWork({ dialect: e.target.value }),
              }, h('option', { value: 'rfc6902' }, 'rfc6902'))),
            h(TextButton, { onClick: runSimulation, disabled: runBusy, 'data-gh': 'var-run-button' }, runBusy ? '运行中…' : '运行一次'),
            h(TextButton, { onClick: reloadWork, disabled: runBusy, 'data-gh': 'var-run-reload' }, '从当前卡重新载入')),
          errorLine(runError, 'var-run-error'),
          runResult ? h('div', { className: 'gh2-var-result', 'data-gh': 'var-run-result' },
            h('div', { className: 'gh2-var-summary', 'data-gh': 'var-run-summary' },
              h('span', { className: 'gh2-m5-chip' }, '操作 ' + runResult.operationCount),
              h('span', { className: 'gh2-m5-chip' }, '字段 ' + runResult.fieldCount),
              h('span', { className: 'gh2-m5-chip' }, 'Checks ' + runResult.checks.length),
              h('span', { className: 'gh2-m5-chip' }, 'Diff ' + runResult.diff.length),
              h('span', { className: 'gh2-m5-chip' }, 'Zod 执行：' + (runResult.zodExecuted ? '是' : '否'))),
            h('section', { className: 'gh2-var-resultblock', 'data-gh': 'var-run-checks' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, 'Checks'), h('span', { className: 'gh2-m5-meta' }, runResult.checks.length + ' 项')),
              runResult.checks.length ? h('ul', { className: 'gh2-var-check-list' }, runResult.checks.map((check, index) => h('li', {
                key: (check && check.id) || index, className: 'gh2-var-check', 'data-status': check && check.status,
              },
                h('span', { className: 'gh2-var-checkstatus' }, checkStatusText[check && check.status] || (check && check.status) || '—'),
                h('b', null, (check && check.label) || (check && check.id) || 'check'),
                h('span', { className: 'gh2-m5-meta' }, (check && check.detail) || '')))) : h('p', { className: 'gh2-m5-note' }, '没有 checks。')),
            resultBlock('Diff', runResult.diff, (item) => (item.kind || 'replace') + ' ' + (item.path || '/') + ' · ' + JSON.stringify(item.before) + ' → ' + JSON.stringify(item.after), 'var-diff'),
            h('section', { className: 'gh2-var-resultblock', 'data-gh': 'var-after-block' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '运行后状态'), h('span', { className: 'gh2-m5-meta' }, 'after')),
              h('pre', { className: 'gh2-var-initial', 'data-gh': 'var-after' }, JSON.stringify(runResult.after, null, 2))),
            h('details', { className: 'gh2-var-raw', 'data-gh': 'var-trace' },
              h('summary', null, '完整 Trace JSON'),
              h('pre', { className: 'gh2-var-initial' }, JSON.stringify(runResult.trace, null, 2))))
            : h('p', { className: 'gh2-m5-note', 'data-gh': 'var-run-empty' }, '点“运行一次”后显示 checks / diff / after / trace。'));
        const modeButtons = h('div', { className: 'gh2-var-modes', 'data-gh': 'var-modes' },
          h(TextButton, { onClick: () => setWorkTab('structure'), className: 'gh2-var-mode' + (workTab === 'structure' ? ' is-active' : ''), 'data-gh': 'var-mode-structure' }, '结构'),
          h(TextButton, { onClick: () => setWorkTab('compare'), className: 'gh2-var-mode' + (workTab === 'compare' ? ' is-active' : ''), 'data-gh': 'var-mode-compare' }, '对照'),
          h(TextButton, { onClick: () => setWorkTab('run'), className: 'gh2-var-mode' + (workTab === 'run' ? ' is-active' : ''), 'data-gh': 'var-mode-run' }, '运行测试'));
        const manualFiles = (Array.isArray(s.wb.files) ? s.wb.files : []).filter((file) => /\.json$/iu.test(file.name || file.path));
        const manualSource = !cardSchema ? h('div', { className: 'gh2-var-manual', 'data-gh': 'var-manual-source' },
          h('p', { className: 'gh2-m5-meta' },
            s.wb.root ? h(Fragment, null, '组件目录与世界书相同：', h('span', { className: 'gh2-mono' }, s.wb.root))
              : '先在世界书页打开目录，才能读取组件 JSON。'),
          manualFiles.length ? h('div', { className: 'gh2-wb-files', 'data-gh': 'var-manual-files' },
            manualFiles.map((file) => h('button', {
              key: file.path,
              type: 'button',
              title: file.path,
              className: 'gh2-wb-file' + (file.path === s.mvu.selectedPath ? ' is-active' : ''),
              'data-gh': 'var-manual-file',
              'data-path': file.path,
              onClick: () => inspectMvuFile(file.path),
            },
              h('span', { className: 'gh2-wb-fname' }, file.name || basename(file.path)),
              h('span', { className: 'gh2-m5-meta' }, formatSize(file.size)))))
            : h('p', { className: 'gh2-m5-note' }, '世界书目录下没有 .json 组件。'),
          h('p', { className: 'gh2-m5-note' }, '没有卡内 Schema 时，点组件 .json 让宿主静态解析；这里不执行脚本。'))
          : null;
        const writeTarget = s.ws.activeCard && s.ws.activeCard.file ? s.ws.activeCard.file.path : '';
        const canWrite = !!(writeTarget && cardMvu && (cardMvu.schemaSource || cardMvu.updateRuleEntries.length || cardMvu.initVarSource || cardMvu.initVar));
        const writePayload = writeResult && writeResult.result ? writeResult.result : writeResult;
        const backupText = writePayload
          ? (typeof writePayload.backup === 'string' ? writePayload.backup
            : writePayload.backup && typeof writePayload.backup === 'object'
              ? (writePayload.backup.path || writePayload.backup.file || writePayload.backup.dir || '')
              : (writePayload.backupPath || writePayload.backupFile || writePayload.backupDir || ''))
          : '';
        const verifyRaw = writePayload
          ? (writePayload.verification !== undefined ? writePayload.verification
            : writePayload.verified !== undefined ? writePayload.verified
              : writePayload.readback !== undefined ? writePayload.readback : writePayload.validation)
          : undefined;
        const verifyText = verifyRaw === true ? '通过'
          : verifyRaw === false ? '失败'
            : typeof verifyRaw === 'string' ? verifyRaw
              : verifyRaw && typeof verifyRaw === 'object' ? JSON.stringify(verifyRaw, null, 2) : '';
        const writeBar = h('div', { className: 'gh2-var-writebar', 'data-gh': 'var-writebar' },
          h('div', { className: 'gh2-var-writehead' },
            h('div', { className: 'gh2-var-writeinfo' },
              h('b', null, '写回卡'),
              h('span', { className: 'gh2-m5-meta' }, writeTarget || '未选卡'),
              h('span', { className: 'gh2-m5-meta' }, '先备份；只改 Schema / 初始变量 / 更新规则选中字段')),
            h(TextButton, {
              onClick: () => setWriteConfirm(true), disabled: !canWrite || writing,
              title: canWrite ? '确认后写回当前卡，并显示备份与读回验证' : '当前卡没有可写回的 MVU 来源',
              'data-gh': 'var-write-button',
            }, writing ? '写回中…' : '写回卡（备份）')),
          writeConfirm ? h('div', { className: 'gh2-var-writeconfirm', 'data-gh': 'var-write-confirm' },
            h('p', null, '目标：', h('code', { className: 'gh2-mono' }, writeTarget)),
            h('p', { className: 'gh2-m5-note' }, '宿主会先把原卡备份到卡目录 .godhand/backups/<timestamp>/<filename>，再原子写并读回验证。不会执行卡内脚本或生成模型内容。'),
            h('div', { className: 'gh2-m5-actions' },
              h(TextButton, { onClick: writeCardBack, disabled: writing, 'data-gh': 'var-write-confirm-button' }, writing ? '写回中…' : '确认写回'),
              h(TextButton, { onClick: () => { setWriteConfirm(false); setWriteError(''); }, disabled: writing, 'data-gh': 'var-write-cancel' }, '取消')))
            : null,
          errorLine(writeError, 'var-write-error'),
          writeResult ? h('div', { className: 'gh2-var-writeresult', 'data-gh': 'var-write-result' },
            h('p', null, '备份：', h('code', { className: 'gh2-mono', 'data-gh': 'var-write-backup' }, backupText || '响应未提供备份路径')),
            h('p', null, '读回验证：', h('code', { className: 'gh2-mono', 'data-gh': 'var-write-verify' }, verifyText || '响应未提供验证字段')),
            h('details', { className: 'gh2-var-raw' },
              h('summary', null, '完整写回响应'),
              h('pre', { className: 'gh2-var-initial' }, JSON.stringify(writeResult, null, 2))))
            : null);
        return h('div', { className: 'gh2-m5', 'data-gh': 'legacyVars-pane' },
          s.ws.restoreNotice ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'ws-restore-notice' }, s.ws.restoreNotice) : null,
          errorLine(s.ws.cardInspectError, 'card-inspect-error'),
          s.ws.cardInspectBusy ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'card-inspect-busy' }, '正在读取卡内变量与 MVU 元信息…') : null,
          h('section', { className: 'gh2-var-page', 'data-gh': 'var-nodes-page' },
            h('div', { className: 'gh2-m5-rowhead' },
              h('b', null, 'MVU'),
              h('span', { className: 'gh2-m5-chip' }, '只读结构'),
              h('span', { className: 'gh2-m5-chip' }, '工作副本')),
            h('p', { className: 'gh2-m5-warn', 'data-gh': 'var-nodes-note' },
              workTab === 'structure' ? '静态结构；未运行 MVU/Zod；值只读；不显示 PASS/FAIL'
                : '工作副本；运行安全子集；写回卡需手动确认并备份；不执行真实 MVU JS/Zod。'),
            sourceBar,
            h('div', { className: 'gh2-var-modebar' },
              modeButtons,
              work.resetNotice ? h('span', { className: 'gh2-m5-warn', 'data-gh': 'var-reset-notice' }, work.resetNotice) : null),
            writeBar,
            workTab === 'structure' ? manualSource : null,
            workTab === 'structure' ? structureContent : workTab === 'compare' ? compareView : runView),
          h('div', { className: 'gh2-mvu-sep' }),
          h(WorldbookJsonSection, { wb: s.wb }));
      }

      function jumpToLegacyNodes() {
        const s = store.get();
        const cardSchema = s.ws.cardDetail && s.ws.cardDetail.mvu && s.ws.cardDetail.mvu.schema;
        const manualSchema = s.mvu && s.mvu.schema;
        if (!cardSchema && !manualSchema) {
          toast('当前没有可浏览的 MVU MVU');
          return false;
        }
        setUi({ mode: 'full', tab: 'legacyVars' });
        setWs({ legacyTab: 'run', legacyFocus: Date.now() });
        return true;
      }
      function jumpToCardMvu() { return jumpToLegacyNodes(); }

      function UiEditorPane() {
        const s = useStoreState();
        const detail = s.ws.cardDetail;
        const scripts = detail && Array.isArray(detail.scripts) ? detail.scripts : [];
        const hasCardMvu = !!(detail && detail.mvu && detail.mvu.schema);
        const hasMvuSource = hasCardMvu || !!(s.mvu && s.mvu.schema);
        const layers = ['AppShell', 'StatusBar', 'DialoguePanel', 'ActionBar'];
        const inspector = [['布局', 'flex · 100vw × 100vh'], ['样式 token', '--surface / --ink'], ['数据绑定', 'ctx.app']];
        return h('div', { className: 'gh2-m5', 'data-gh': 'ui-editor-pane' },
          h('p', { className: 'gh2-m5-lead' }, '图层/编译占位；资料库已独立为“前端设计＆动效数据库”页签。'),
          h('div', { className: 'gh2-m5-actions' },
            h(TextButton, { disabled: true, title: '真实编译链还没接入', 'data-gh': 'ui-compile' }, '编译（还没接入）'),
            h('span', { className: 'gh2-m5-chip', 'data-gh': 'ui-compile-chip' }, '编译链还没接入')),
          h('div', { className: 'gh2-m5-links', 'data-gh': 'ui-links' },
            h('button', {
              type: 'button', className: 'gh2-m5-link', 'data-gh': 'ui-link-card-mvu',
              disabled: !hasMvuSource,
              title: hasMvuSource ? '跳到MVU页并选中来源' : '当前没有可浏览的 MVU Schema',
              onClick: jumpToCardMvu,
            }, '测试节点')),
          h('p', { className: 'gh2-m5-note', 'data-gh': 'ui-library-note' }, '资料库已独立为“前端设计＆动效数据库”页签；这里不再承载资料库页面。'),
          errorLine(s.ws.cardInspectError, 'card-inspect-error-ui'),
          s.ws.cardInspectBusy ? h('p', { className: 'gh2-m5-meta', 'data-gh': 'card-inspect-busy-ui' }, '正在读取卡内脚本元信息…') : null,
          h('section', { className: 'gh2-card-scripts', 'data-gh': 'card-scripts-section' },
            h('div', { className: 'gh2-m5-rowhead' },
              h('b', null, '卡内助手脚本（只读）'),
              h('span', { className: 'gh2-m5-meta' }, scripts.length + ' 个')),
            scripts.length ? h('div', { className: 'gh2-card-script-list', 'data-gh': 'card-scripts' },
              scripts.map((script, index) => h('div', {
                key: (script.id || 'script') + ':' + index,
                className: 'gh2-card-script',
                'data-gh': 'card-script-row',
                'data-id': script.id || '',
              },
                h('div', { className: 'gh2-card-script-head' },
                  h('b', null, script.name || script.id || ('脚本 ' + (index + 1))),
                  h('span', { className: 'gh2-m5-chip' }, script.type || 'script'),
                  h('span', { className: 'gh2-m5-chip' }, script.enabled ? '启用' : '停用'),
                  h('span', { className: 'gh2-m5-chip' }, script.hasSchema ? '有 Schema' : '无 Schema')),
                h('p', { className: 'gh2-m5-meta' },
                  'id：' + (script.id || '（无）') + ' · content 长度：' + (script.contentLength || 0) + ' 字符'))))
              : h('p', { className: 'gh2-m5-note', 'data-gh': 'card-scripts-empty' }, '当前卡没有助手脚本元信息，或还没选卡。'),
            h('p', { className: 'gh2-m5-note' }, '只列元信息；不执行脚本，也不伪造编译结果。')),
          h('p', { className: 'gh2-m5-warn', 'data-gh': 'ui-compile-note' }, '编译按钮只是占位：这里不会显示编译结果，也不会生成前端产物。'),
          h('div', { className: 'gh2-m5-ui-grid' },
            h('section', { className: 'gh2-m5-col', 'data-gh': 'ui-layers' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '图层'), h('span', { className: 'gh2-m5-meta' }, '组件树')),
              layers.map((name) => h('div', { key: name, className: 'gh2-ui-layer' + (name === 'AppShell' ? ' is-open' : '') }, name)),
              h('p', { className: 'gh2-m5-note' }, '占位：接入后显示真实图层、锁定与选择状态。')),
            h('section', { className: 'gh2-m5-col', 'data-gh': 'ui-canvas' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '画布'), h('span', { className: 'gh2-m5-meta' }, '预览 · 占位')),
              h('div', { className: 'gh2-ui-canvas' }, h('span', null, '真实组件预览区域（占位）')),
              h('p', { className: 'gh2-m5-note' }, '不生成前端产物；编译链还没接入。')),
            h('section', { className: 'gh2-m5-col', 'data-gh': 'ui-inspector' },
              h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '属性'), h('span', { className: 'gh2-m5-meta' }, 'Inspector')),
              inspector.map(([label, value]) => h('div', { key: label, className: 'gh2-m5-field' },
                h('span', null, label), h('div', { className: 'gh2-ui-ins' }, value))),
              h('p', { className: 'gh2-m5-note' }, '占位：源码、编译错误和草稿保留属于下一阶段。'))));
      }

      function ProjectOverlay({ s }) {
        const ws = s.ws;
        const active = ws.projects.find((project) => project.id === ws.activeProjectId) || null;
        const currentRoot = ws.versionsRoot || (active && active.root) || '';
        const activeCard = ws.activeCard;
        const activeMeta = activeCard && activeCard.meta ? activeCard.meta : {};
        useEffect(() => {
          const onKey = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            closeProjectManager();
          };
          document.addEventListener('keydown', onKey, true);
          return () => document.removeEventListener('keydown', onKey, true);
        }, []);
        const projectRows = ws.projects.length ? ws.projects.map((project) => h('li', {
          key: project.id,
          className: 'gh2-project-row' + (project.id === ws.activeProjectId ? ' is-active' : ''),
          'data-gh': 'project-row',
          'data-id': project.id,
        },
          h('button', {
            type: 'button', className: 'gh2-project-main', 'data-gh': 'project-switch',
            disabled: ws.busy,
            onClick: () => switchProject(project.id),
          },
            h('span', { className: 'gh2-project-itemtitle' },
              h('b', null, project.label),
              project.id === ws.activeProjectId ? h('span', { className: 'gh2-m5-chip' }, '当前') : null),
            h('span', { className: 'gh2-mono' }, project.root),
            h('span', { className: 'gh2-project-meta' },
              '最近版本：' + (project.lastVersionDir || '（无）') + ' · 最近卡：' + (project.lastCardPath || '（无）'))),
          h('button', {
            type: 'button', className: 'gh2-project-delete', 'data-gh': 'project-delete',
            'aria-label': '删除项目 ' + project.label,
            disabled: ws.busy,
            onClick: () => deleteProject(project.id),
          }, '删除')))
          : h('p', { className: 'gh2-m5-note', 'data-gh': 'project-empty' }, '还没有项目。选择目录或输入路径添加。');
        const versionRows = ws.versions.length ? ws.versions.map((version) => h('li', { key: version.path },
          h('button', {
            type: 'button',
            className: 'gh2-project-item' + (version.path === ws.versionsRoot ? ' is-active' : ''),
            'data-gh': 'version-row',
            'data-path': version.path,
            'data-relative': version.relative || '',
            disabled: ws.busy,
            onClick: () => switchVersion(version.path),
          },
            h('span', { className: 'gh2-project-itemtext' },
              h('span', { className: 'gh2-project-itemtitle' }, version.name),
              h('span', { className: 'gh2-mono' }, version.relative || version.path)),
            version.version ? h('span', { className: 'gh2-m5-chip' }, version.version) : null,
            version.path === ws.versionsLatest ? h('span', { className: 'gh2-m5-chip' }, '最新') : null,
            h('span', { className: 'gh2-m5-meta' }, formatMtime(version.mtime)))))
          : h('p', { className: 'gh2-m5-note', 'data-gh': 'versions-empty' }, '宿主没有返回版本子目录；项目根会作为当前目录。');
        const cardRows = ws.cards.length ? ws.cards.map((file) => {
          const info = ws.cardMeta[file.path];
          const cardMeta = info && info.meta ? info.meta : {};
          const readError = ws.cardReadErrors[file.path];
          const isActive = activeCard && activeCard.file && activeCard.file.path === file.path;
          const isLatest = ws.cardsLatest === file.path;
          const isCard = isCardRead(info);
          const notCard = !!info && !isCard;
          return h('li', { key: file.path },
            h('button', {
              type: 'button',
              className: 'gh2-project-item' + (isActive ? ' is-active' : ''),
              'data-gh': 'card-row',
              'data-path': file.path,
              disabled: ws.busy || notCard,
              title: notCard ? '这是 ' + (info.kind || 'unknown') + '，不是角色卡；请选 PNG/JSON 卡文件' : undefined,
              onClick: () => selectCard(ws.cardsRoot, file.path),
            },
              h('span', { className: 'gh2-project-itemtext' },
                h('span', { className: 'gh2-project-itemtitle' },
                  file.name,
                  isLatest ? h('span', { className: 'gh2-m5-chip' }, '最新') : null,
                  info ? h('span', { className: 'gh2-m5-chip' }, info.kind + (notCard ? ' · 非卡' : '')) : null),
                h('span', { className: 'gh2-project-meta' },
                  '卡名：' + (cardMeta.name || (ws.cardsBusy ? '读取中…' : '未知')),
                  ' · spec：' + (cardMeta.spec || '未知') + (cardMeta.specVersion ? ' ' + cardMeta.specVersion : ''),
                  file.version ? ' · 文件版本：' + file.version : ''),
                readError ? h('span', { className: 'gh2-m5-error' }, '读取失败：' + readError) : null),
              h('span', { className: 'gh2-m5-meta' }, formatSize(file.size) + ' · ' + formatMtime(file.mtime))));
        }) : h('p', { className: 'gh2-m5-note', 'data-gh': 'cards-empty' }, ws.cardsBusy ? '正在读取卡元信息…' : '这个目录没有 PNG/JSON 卡文件。');
        return h('div', {
          className: 'gh2-libmask gh2-projectmask', 'data-gh': 'project-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': '项目与角色卡',
        },
          h('div', { className: 'gh2-projectpanel' },
            h('header', { className: 'gh2-projectbar' },
              h('b', null, '项目与角色卡'),
              h('span', { className: 'gh2-m5-meta' }, active ? '当前：' + active.label : '当前：未选择项目'),
              h('span', { className: 'gh2-spacer' }),
              h(TextButton, { onClick: closeProjectManager, 'data-gh': 'project-close' }, '关闭')),
            h('div', { className: 'gh2-projectbody' },
              errorLine(ws.hostError, 'ws-host-error'),
              errorLine(ws.persistError, 'ws-persist-error'),
              h('p', { className: 'gh2-m5-meta', 'data-gh': 'ws-state-info' },
                '工作区状态：', h('span', { className: 'gh2-mono', 'data-gh': 'ws-state-path' }, ws.statePath || '（未知）'),
                ' · ', ws.savedAt ? '保存于 ' + formatMtime(ws.savedAt) : '还没保存',
                ws.hostAvailable ? '' : ' · 持久化不可用（本页仍会写 localStorage 快照）'),
              ws.restoreNotice ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'ws-restore-notice' }, ws.restoreNotice) : null,
              ws.newAvailable ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'ws-new-available' }, ws.newAvailable.message || '有新版本可用') : null,
              h('section', { className: 'gh2-project-section' },
                h('div', { className: 'gh2-m5-rowhead' }, h('b', null, '项目'), h('span', { className: 'gh2-m5-meta' }, ws.projects.length + ' 个')),
                h('div', { className: 'gh2-project-actions' },
                  h(TextButton, { onClick: pickProjectRoot, disabled: ws.picking || ws.busy, 'data-gh': 'project-pick' },
                    ws.picking ? '正在打开目录选择器…' : '选择项目目录'),
                  h('input', {
                    type: 'text', className: 'gh2-finput', 'data-gh': 'project-root-input', 'aria-label': '项目目录路径',
                    placeholder: '或输入项目目录路径（绝对路径）', value: ws.rootInput,
                    onChange: (e) => setWs({ rootInput: e.target.value }),
                    onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addProject(ws.rootInput); } },
                  }),
                  h(TextButton, { onClick: () => addProject(ws.rootInput), disabled: ws.scanBusy || ws.busy, 'data-gh': 'project-add' },
                    ws.scanBusy ? '正在扫描…' : '添加项目')),
                errorLine(ws.addError, 'project-add-error'),
                h('ul', { className: 'gh2-project-list', 'data-gh': 'project-list' }, projectRows)),
              active ? h(Fragment, null,
                h('section', { className: 'gh2-project-section' },
                  h('div', { className: 'gh2-m5-rowhead' },
                    h('b', null, '当前项目'),
                    h('span', { className: 'gh2-mono' }, active.root),
                    h('span', { className: 'gh2-spacer' }),
                    h(TextButton, { onClick: toggleAutoLatest, 'data-gh': 'auto-latest' },
                      '自动最新：' + (ws.autoLatest ? '开' : '关'))),
                  h('div', { className: 'gh2-project-actions' },
                    h(TextButton, { onClick: switchLatest, disabled: ws.busy, 'data-gh': 'switch-latest' },
                      ws.busy ? '正在切换…' : '切到最新'),
                    h(TextButton, { onClick: useProjectRootForWorldbook, disabled: !currentRoot || ws.busy, 'data-gh': 'project-use-wb' }, '用当前目录作为世界书根'),
                    h(TextButton, { onClick: useProjectRootForMvu, disabled: !currentRoot || ws.busy, 'data-gh': 'project-use-mvu' }, '用当前目录作为变量根')),
                  h('p', { className: 'gh2-m5-note' }, '自动最新按文件名里的语义版本优先，版本相同按修改时间；世界书有未保存修改时不会切换。'),
                  errorLine(ws.scanError, 'project-scan-error'),
                  h('ul', { className: 'gh2-project-list', 'data-gh': 'version-list' }, versionRows)),
                h('section', { className: 'gh2-project-section' },
                  h('div', { className: 'gh2-m5-rowhead' },
                    h('b', null, '卡文件'),
                    h('span', { className: 'gh2-m5-meta' }, ws.cardsBusy ? '正在读取卡元信息…' : ws.cards.length + ' 个 PNG/JSON'),
                    h('span', { className: 'gh2-spacer' }),
                    h('span', { className: 'gh2-mono' }, ws.cardsRoot || currentRoot)),
                  errorLine(ws.cardError, 'project-card-error'),
                  ws.cardMissing ? h('p', { className: 'gh2-m5-warn', 'data-gh': 'card-missing' }, ws.cardMissing) : null,
                  h('ul', { className: 'gh2-project-list', 'data-gh': 'card-list' }, cardRows),
                  h('p', { className: 'gh2-m5-note' }, '只读卡文件元信息：不读卡正文、不改卡、不把内容写进工作区状态。'),
                  activeCard ? h('div', { className: 'gh2-project-carddetail', 'data-gh': 'active-card' },
                    h('span', null, h('b', null, '当前卡：'), activeCard.file.name || basename(activeCard.file.path)),
                    h('span', null, h('b', null, 'kind：'), activeCard.kind || 'unknown'),
                    h('span', null, h('b', null, '卡名：'), metaText(activeMeta.name)),
                    h('span', null, h('b', null, 'spec：'), metaText(activeMeta.spec)),
                    h('span', null, h('b', null, 'specVersion：'), metaText(activeMeta.specVersion)),
                    h('span', null, h('b', null, '角色：'), metaText(activeMeta.characterName)),
                    h('span', null, h('b', null, '角色版本：'), metaText(activeMeta.characterVersion)),
                    h('span', null, h('b', null, 'creator：'), metaText(activeMeta.creator)),
                    h('span', null, h('b', null, 'createDate：'), metaText(activeMeta.createDate)),
                    h('span', null, h('b', null, '内嵌世界书：'), activeCard.hasWorldbook ? '有' : '无'),
                    h('span', null, h('b', null, '世界书条目：'), String(activeCard.worldbookEntryCount)),
                    h('span', null, h('b', null, '助手脚本：'), String(activeCard.scriptCount)),
                    h('span', null, h('b', null, '正则：'), String(activeCard.regexCount))) : null))
                : h('p', { className: 'gh2-m5-note', 'data-gh': 'project-current-empty' }, '还没有当前项目。添加或切换一个项目后，会在这里列出版本目录和卡文件。'))));
      }

      function LibraryOverlay({ lib }) {
        const [note, setNote] = useState('');
        const onEsc = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          closeLibrary();
        };
        useEffect(() => {
          document.addEventListener('keydown', onEsc, true);
          return () => document.removeEventListener('keydown', onEsc, true);
        }, []);
        const onLoad = (event) => {
          const frame = event.currentTarget;
          try {
            const doc = frame.contentDocument;
            if (!doc) { setNote(''); return; }
            doc.addEventListener('keydown', onEsc);
            const text = String(doc.body && doc.body.textContent || '');
            setNote(/数据未载入/u.test(text) ? '挑选页数据没载入：' + text.trim().slice(0, 160) : '');
          } catch {
            setNote('');
          }
        };
        return h('div', { className: 'gh2-libmask', 'data-gh': 'lib-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': lib.title },
          h('div', { className: 'gh2-libpanel' },
            h('header', { className: 'gh2-libbar' },
              h('b', null, lib.title),
              h('span', { className: 'gh2-m5-meta' }, 'TW Library 离线快照 · 候选不等于已采用'),
              h('span', { className: 'gh2-spacer' }),
              h(TextButton, { onClick: closeLibrary, 'data-gh': 'lib-close' }, '关闭')),
            lib.status === 'loading' ? h('div', { className: 'gh2-libstate', 'data-gh': 'lib-loading' }, '正在检查资料库路由…') : null,
            lib.status === 'error' ? h('div', { className: 'gh2-libstate' },
              errorLine(lib.error, 'lib-error'),
              h(TextButton, { onClick: closeLibrary }, '关闭')) : null,
            lib.status === 'ready' ? h(Fragment, null,
              note ? h('p', { className: 'gh2-m5-error', 'data-gh': 'lib-note', style: { margin: '8px 12px 0' } }, note) : null,
              h('iframe', {
                className: 'gh2-libframe',
                'data-gh': 'lib-iframe',
                title: lib.title,
                src: lib.url,
                onLoad,
              })) : null));
      }

      function LibraryTab({ tab }) {
        const [status, setStatus] = useState('loading');
        const [error, setError] = useState('');
        const [nonce, setNonce] = useState(0);
        const seq = useRef(0);
        const url = M5.libPage + '#' + tab;
        useEffect(() => {
          const my = ++seq.current;
          setStatus('loading');
          setError('');
          probeLibrary().then(() => {
            if (my === seq.current) setStatus('ready');
          }).catch((err) => {
            if (my !== seq.current) return;
            setStatus('error');
            setError('资料库没找到：' + errorText(err));
          });
          return () => { seq.current += 1; };
        }, [tab, nonce]);
        return h('div', { className: 'gh2-library-tab', 'data-gh': 'library-tab', 'data-tab': tab },
          status === 'loading' ? h('div', { className: 'gh2-libstate', 'data-gh': 'lib-tab-loading' }, '正在检查资料库路由…') : null,
          status === 'error' ? h('div', { className: 'gh2-libstate', 'data-gh': 'lib-tab-error' },
            h('p', { className: 'gh2-m5-error' }, error),
            h(TextButton, { onClick: () => setNonce((n) => n + 1) }, '重新加载')) : null,
          status === 'ready' ? h('iframe', {
            className: 'gh2-libframe gh2-libframe-tab',
            'data-gh': 'lib-tab-frame',
            title: M5.libTitles[tab],
            src: url,
            onError: () => { setStatus('error'); setError('资料库页面加载失败。'); },
          }) : null);
      }

      function FullWindow({ s }) {
        const ref = useRef(null);
        const rect = s.ui.full ? clampFull(s.ui.full) : defaultFull();
        const start = useRef(rect);
        start.current = rect;
        useEffect(() => {
          if (!store.get().ui.full) setUi({ full: rect });
          try { ref.current && ref.current.focus({ preventScroll: true }); } catch {}
        }, []);
        const onMove = (e) => beginDrag(e, ref, (dx, dy) => clampFull({ ...start.current, x: start.current.x + dx, y: start.current.y + dy }), (r) => setUi({ full: r }));
        const onResize = (e) => beginDrag(e, ref, (dx, dy) => clampFull({ ...start.current, w: start.current.w + dx, h: start.current.h + dy }), (r) => setUi({ full: r }));
        const tab = s.ui.tab;
        const isLibraryTab = tab === 'library';
        const activeWsProject = s.ws.projects.find((project) => project.id === s.ws.activeProjectId) || null;
        return h('section', {
          ref, className: 'gh2-root gh2-win', role: 'region', 'aria-label': '神之手', tabIndex: -1, 'data-gh': 'window',
          style: { left: rect.x, top: rect.y, width: rect.w, height: rect.h },
          onKeyDown: (e) => { if (e.key === 'Escape') { e.stopPropagation(); setUi({ mode: 'compact', wheelOn: true }); } },
        },
          h('header', { className: 'gh2-bar', onPointerDown: onMove, 'data-gh': 'window-bar' },
            h('span', { className: 'gh2-brand' }, h(Logo, { size: 18 })),
            h('span', { className: 'gh2-title' }, '神之手'),
            h(TextButton, {
              onClick: openProjectManager,
              className: 'gh2-projectbtn',
              'data-gh': 'project-button',
              title: activeWsProject ? activeWsProject.root : '项目与角色卡',
            }, '项目' + (activeWsProject ? ' · ' + activeWsProject.label : '')),
            h('span', { className: 'gh2-spacer' }),
            h(IconButton, { label: '收起到轮盘', onClick: () => setUi({ mode: 'compact', wheelOn: true }) }, h(IconMinimize))),
          h('div', { className: 'gh2-tabs' }, h(Tabs, { value: tab, onChange: (next) => setUi({ tab: next }) })),
          h('div', { className: 'gh2-body' + (isLibraryTab ? ' gh2-body-lib' : ''), id: 'gh2-panel-' + tab, role: 'tabpanel', 'aria-labelledby': 'gh2-tab-' + tab, 'data-gh': 'panel-' + tab },
            tab === 'skills' ? h(SkillsPane, { s })
              : tab === 'worldbook' ? h(WorldbookPane)
                : h(LibraryTab, { tab: 'design' })),
          h('div', { className: 'gh2-grip', onPointerDown: onResize, 'aria-hidden': 'true', 'data-gh': 'grip' }, h(IconGrip)));
      }

      function Overlay() {
        const s = useStoreState();
        useEffect(() => {
          let timer = 0;
          const onResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              const ui = store.get().ui;
              if (ui.full) setUi({ full: clampFull(ui.full) });
            }, 150);
          };
          window.addEventListener('resize', onResize);
          return () => { window.removeEventListener('resize', onResize); clearTimeout(timer); };
        }, []);
        // 只在完整浮窗打开时轮询：切回完整浮窗 / 每 10 秒检查一次项目版本与卡文件。
        useEffect(() => {
          if (s.ui.mode !== 'full') {
            if (s.ws.managerOpen) closeProjectManager();
            return undefined;
          }
          if (!s.ws.loaded || !s.ws.activeProjectId) return undefined;
          let disposed = false;
          const tick = () => { if (!disposed) refreshLatest(); };
          tick();
          const timer = setInterval(tick, 10000);
          return () => { disposed = true; clearInterval(timer); };
        }, [s.ui.mode, s.ws.loaded, s.ws.activeProjectId, s.ws.autoLatest]);
        const d = s.drop;
        return h(Fragment, null,
          // 轮盘开关只决定挂不挂载轮盘，其余部件（完整浮窗、项目浮层、资料库、提示）照旧。
          s.ui.wheelOn !== false ? h(Wheel, { s }) : null,
          s.ui.mode === 'full' ? h(FullWindow, { s }) : null,
          s.ws.managerOpen ? h(ProjectOverlay, { s }) : null,
          s.lib.open ? h(LibraryOverlay, { lib: s.lib }) : null,
          d ? h('div', {
            className: 'gh2-drophint', 'data-gh': 'drop-hint', 'aria-hidden': 'true',
            style: { left: d.x - 3, top: d.y - 3, width: d.w + 6, height: d.h + 6, borderRadius: 'calc(' + (d.radius || '12px') + ' + 3px)' },
          }) : null,
          s.toast ? h('div', { className: 'gh2-toast', role: 'status', 'data-gh': 'toast' }, s.toast.text) : null);
      }

      /* ---------------- 装配 ---------------- */
      const inject = ['slots', 'sidebarRight', 'sessions', 'remote', 'remote.skills', 'remote.directoryPicker'];
      function apply(ctx) {
        ctxRef = ctx;
        G.applied = true;
        injectStyles();
        ctx.effect(() => {
          const mounted = ctx.sidebarRight && ctx.sidebarRight.mounted;
          if (!mounted || typeof mounted.getSnapshot !== 'function' || typeof mounted.subscribe !== 'function') {
            fail('mounted', new Error('找不到“屏幕上的会话”来源'));
            return () => {};
          }
          const sync = () => track(mounted.getSnapshot());
          const off = mounted.subscribe(sync);
          sync();
          return () => { off(); untrack(); };
        }, 'godhand: on-screen session');
        ctx.effect(() => installDropTarget(), 'godhand: drop skill into composer');
        ctx.effect(() => { loadWorkspace(); return () => {}; }, 'godhand: restore workspace');
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: PLUGIN_ID, order: 850 }, Overlay));
        ctx.slots.inject('conversation.session.header.utilities', () => {
          const brands = [
            ctx.slots.register({ name: 'conversation.session.header.utilities', id: PLUGIN_ID, order: -30 }, HeaderButton),
            ctx.slots.register({ name: 'conversation.session.header.utilities', id: PLUGIN_ID + '-wheel', order: -29 }, WheelToggleButton),
          ].filter((off) => typeof off === 'function');
          return brands.length ? () => { for (const off of brands) { try { off(); } catch {} } } : undefined;
        });
        ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
          name: 'conversation.input.dock', id: PLUGIN_ID + '-soul', order: -10,
        }, SoulDock));
        G.api = {
          store, setUi, insertSkill, runSkill, sendSoul, soulFromText, loadCatalog, openSkill, measureGutter,
          inputSessions: () => [...inputRegistry.keys()],
          binding: () => bindingOf(store.get().sessionId),
          primitives: () => (P ? ['Button', 'Tooltip', 'Pill', 'Input', 'SegmentedTabs', 'StateDot'].filter(has) : []),
          m5: {
            openLibrary, closeLibrary, pickWorldbookRoot, openWorldbookRoot, readWorldbookFile,
            refreshWbVersions, saveWorldbook, updateWbEntry, setWb, setLib,
            pickMvuRoot, openMvuRoot, inspectMvuFile, setMvu,
            loadWorkspace, openProjectManager, closeProjectManager, pickProjectRoot, addProject,
            switchProject, deleteProject, switchVersion, switchLatest, refreshLatest, toggleAutoLatest,
            selectCard, useProjectRootForWorldbook, useProjectRootForMvu, setWs,
            inspectCardDetail,
          },
        };
      }

      module.exports = { name: 'tavernweave-ui', inject, apply };
      return module.exports;
    };
  }

  try {
    window.__ModuleLoader__.load({ id: PLUGIN_ID, factory: makeFactory() });
    G.loaded = true;
  } catch (error) {
    fail('load', error);
  }
})();
