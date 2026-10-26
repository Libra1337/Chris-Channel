// Projects: four are featured as media panels on the home page (Featured.astro), the rest sit in the index. Ordered to show range (native app → libraries → full-stack → product
// work → brand). LynShen-related work is three tiles, after my independent projects.
// Copy rules: engineering only, no pricing/plans/store pitch, no business data. Roles come from the commit data
//. cat groups the index filter; preview is what the index shows under the cursor.
export type L = { en: string; zh: string };
export type Cat = 'apps' | 'systems' | 'design';
export type Project = {
  slug: string; n: string; accent: 'amber' | 'teal';
  name: L; kicker: L; oneLine: L; tags: string[];
  repo?: string;   // the repository's own name, shown small in mono; titles use the product name
  site?: string;   // the product's official site, shown as "Website" / 「官网」 in the project facts
  status: L; group?: L; cat: Cat; role: L;
  preview: { kind: 'img' | 'video' | 'concept'; name: string; tall?: boolean };
  cover: { kind: 'img' | 'video' | 'mark'; name: string; frame: 'phone' | 'laptop' | 'browser' | 'plain' | 'none' };
  facts: { v: L; k: L }[];
};
const s = (en: string, zh: string): L => ({ en, zh });
// 牵星's English name. Every visible English string uses it.
export const ARMIL_EN = 'Armil';
const AR = ARMIL_EN;
// armil.io does not load yet: it redirects to www.armil.io, which still has a self-signed certificate (checked
// 2026-10-27). Set to true at deploy time once https://armil.io loads; until then the Armil page shows no Website row.
export const ARMIL_SITE_LIVE = false;
// Old slugs → current slug. src/pages/projects/[old].astro builds a forwarding page for each.
export const moved: Record<string, string> = { 'md-reader': 'zaji', pane: 'zaji', qianxing: 'armil', lodestar: 'armil' };
export const projects: Project[] = [
  {
    slug: 'zaji', n: '01', accent: 'teal',
    cat: 'apps', role: s('Sole author. I designed and built it end to end.', '独立作者。从设计到实现，都由我一个人完成。'),
    preview: { kind: 'img', name: 'pn-md' },
    name: s('Zaji', 'Zaji'), site: 'https://www.zaji.io',
    kicker: s('Mac and iPhone app · Swift + Go', 'Mac 和 iPhone 应用 · Swift + Go'),
    oneLine: s('A quiet reader for the Mac and a notebook for the iPhone: Markdown, PDF, Word, HTML, CSV, plain text and code in one reading column, with find in page and type you can tune; on the phone, short notes styled as cards to share.',
      '一个安静的阅读器，也是一本随身的小记本：Mac 上，Markdown、PDF、Word、HTML、CSV、纯文本和代码都放进同一个阅读栏，能在文中查找，字体也能自己调；iPhone 上写小记，排成卡片分享出去。'),
    tags: ['Swift', 'AppKit', 'SwiftUI', 'WKWebView', 'Go', 'pdf.js', 'marked', 'Mermaid', 'KaTeX'],
    status: s('Private repo · v1.3.0', '私有仓库 · v1.3.0'),
    cover: { kind: 'img', name: 'pn-md', frame: 'browser' },
    facts: [
      { v: s('8', '8'), k: s('document formats, one reading column', '种文档格式，同一个阅读栏') },
      { v: s('8 MB', '8 MB'), k: s('first chunk of a huge text file; the rest streams in 2 MB parts', '超大文本先读开头，后面按 2 MB 一段接着读') },
      { v: s('2.5 s', '2.5 秒'), k: s('search budget: results stream back, nothing freezes', '搜索时间上限：结果边找边回，界面不卡') },
    ],
  },
  {
    slug: 'llm-provider-kit', n: '02', accent: 'teal',
    cat: 'systems', role: s('Co-author of a shared Rust library. My part: the transport, retries, thinking parameters and client headers.', '共同作者，这是一个共享的 Rust 库。我负责的部分：传输层、重试、思考参数和客户端请求头。'),
    preview: { kind: 'concept', name: 'code' },
    name: s('LLM Provider Kit', '大模型接入库'), repo: 'llm-provider-kit',
    kicker: s('Rust library · open source', 'Rust 库 · 开源'),
    oneLine: s('A Rust crate that speaks three LLM wire protocols and turns their streams into one event type, with OAuth and device-code logins.',
      '一个 Rust 库：讲三种大模型通信协议，把它们的流统一成一种事件，并支持 OAuth 和设备码登录。'),
    tags: ['Rust', 'ureq', 'serde_json', 'SSE', 'OAuth 2.0', 'PKCE'],
    status: s('Public · Apache-2.0', '公开 · Apache-2.0'),
    cover: { kind: 'mark', name: 'code', frame: 'none' },
    facts: [
      { v: s('3', '3'), k: s('wire protocols, one event type', '种协议，一种事件') },
      { v: s('126', '126'), k: s('unit tests', '个单元测试') },
      { v: s('0', '0'), k: s('async runtime dependencies', '个异步运行时依赖') },
    ],
  },
  {
    slug: 'jm2api', n: '03', accent: 'amber',
    cat: 'systems', role: s('Sole author. I designed and built it end to end.', '独立作者。从设计到实现，都由我一个人完成。'),
    preview: { kind: 'concept', name: 'contract' },
    name: s('Video API Adapter', '视频接口适配器'), repo: 'Jm2api',
    kicker: s('Full-stack TypeScript · Bun + Hono + React', '全栈 TypeScript · Bun + Hono + React'),
    oneLine: s('A video-generation API protocol adapter. Server and admin panel share one zod type contract; load balancing and an asset-mapping layer sit in between.',
      '一个视频生成 API 协议适配器。服务端和管理面板共用一份 zod 类型契约，中间是负载均衡和素材映射层。'),
    tags: ['TypeScript', 'Bun', 'Hono', 'Drizzle', 'PostgreSQL', 'zod', 'React Router', 'shadcn/ui'],
    status: s('Private repo', '私有仓库'),
    cover: { kind: 'mark', name: 'contract', frame: 'none' },
    facts: [
      { v: s('1', '1'), k: s('type contract for server and panel', '份类型契约，服务端和面板共用') },
      { v: s('3', '3'), k: s('packages: protocol, server, panel', '个包：协议、服务端、面板') },
      { v: s('0', '0'), k: s('config files: settings live in the panel', '个配置文件：设置都在面板里') },
    ],
  },
  {
    slug: 'accc-libra', n: '04', accent: 'amber',
    cat: 'systems', role: s('Sole author.', '独立作者。'),
    preview: { kind: 'concept', name: 'flow' },
    name: s('Verified Records Service', '带验证的记录服务'), repo: 'accc-Libra',
    kicker: s('Java · Spring Boot · SQLite', 'Java · Spring Boot · SQLite'),
    oneLine: s('A Spring Boot web app: a captcha-verified public page, a password-protected admin page with single entry and CSV batch import, and SQLite storage created on startup.',
      '一个 Spring Boot Web 应用：带人机验证的公开页、有口令保护的管理页（单条录入和 CSV 批量导入），以及启动时自动建表的 SQLite 存储。'),
    tags: ['Java 17', 'Spring Boot', 'Maven', 'SQLite', 'Geetest v4', 'CSV'],
    status: s('Private repo', '私有仓库'),
    cover: { kind: 'mark', name: 'flow', frame: 'none' },
    facts: [
      { v: s('2', '2'), k: s('pages: public and admin', '个页面：公开页和管理页') },
      { v: s('1', '1'), k: s('jar to run, schema created on start', '个 jar 即可运行，启动时建表') },
      { v: s('env', 'env'), k: s('overrides for every secret', '变量覆盖所有密钥') },
    ],
  },
  {
    slug: 'gateway', n: '05', accent: 'teal', group: s('LynShen', 'LynShen'),
    cat: 'systems', role: s('Lead developer of LynShen’s fork of an open-source MIT gateway core: the console UI, CDN-resilient delivery, routing and failover, a search API, and the release pipeline.', 'LynShen 分支的主力开发者，基于一个 MIT 协议的开源网关内核：控制台界面、抗 CDN 故障的分发、路由与故障切换、搜索 API，以及发布流水线。'),
    preview: { kind: 'video', name: 'gw-logs' },
    name: s('LynShen Gateway', 'LynShen 网关'),
    kicker: s('Rust service · React console', 'Rust 服务 · React 控制台'),
    oneLine: s('A Rust gateway that translates between three AI API dialects by meaning, not field names, and routes each request with retries and health checks.',
      '一个 Rust 网关：在三种 AI API 协议之间按含义转换，而不是按字段名；每条请求都有重试和健康检查的路由。'),
    tags: ['Rust', 'axum', 'tokio', 'SeaORM', 'React 19', 'TypeScript'],
    status: s('Private repo', '私有仓库'),
    cover: { kind: 'img', name: 'g-logs', frame: 'browser' },
    facts: [
      { v: s('3 → 6', '3 → 6'), k: s('client protocols → upstream channel types', '客户端协议 → 上游渠道类型') },
      { v: s('1,600+', '1600+'), k: s('Rust tests added in this codebase', '这个代码库里新增的 Rust 测试') },
      { v: s('4', '4'), k: s('docs locales, 104 MDX pages', '种文档语言，104 个 MDX 页面') },
    ],
  },
  {
    slug: 'aogiri-desktop', n: '06', accent: 'amber', group: s('LynShen', 'LynShen'),
    cat: 'apps', role: s('Lead developer and product lead. I took over an early codebase and grew it into the LynShen desktop app and engine: multi-agent orchestration, the phone remote with end-to-end encryption and push, approvals, skills and MCP, and the release pipeline.', '主力开发者，同时负责产品。我接手了一个早期代码库，把它做成了 LynShen 桌面端和引擎：多智能体编排、端到端加密并带推送的手机遥控、审批、技能与 MCP，以及发布流水线。'),
    preview: { kind: 'video', name: 'desk-eco-dark' },
    name: s('Aogiri Desktop + CLI', 'Aogiri 桌面端 + CLI'),
    kicker: s('Tauri + Svelte · Rust engine', 'Tauri + Svelte · Rust 引擎'),
    oneLine: s('A desktop workbench for coding agents and the Rust engine behind it: plans, subagents, approvals, and a phone signed in to the same account that can follow the work and answer them.',
      '给编程智能体用的桌面工作台，以及背后的 Rust 引擎：计划、子智能体、审批；登录同一个账号的手机能跟进进度，也能回复审批。'),
    tags: ['Tauri 2', 'Svelte 5', 'Rust', 'Go', 'Noise IK', 'Ed25519'],
    status: s('Shipped · desktop v0.11.0 · CLI v0.8.0', '已发布 · 桌面端 v0.11.0 · CLI v0.8.0'),
    cover: { kind: 'video', name: 'desk-eco', frame: 'laptop' },
    facts: [
      { v: s('v0.11.0', 'v0.11.0'), k: s('desktop release · CLI v0.8.0', '桌面端版本 · CLI v0.8.0') },
      { v: s('1,472', '1472'), k: s('Rust tests in the CLI engine', 'CLI 引擎里的 Rust 测试') },
      { v: s('~1,700', '约 1700'), k: s('front-end test cases in the desktop app', '桌面端前端测试用例') },
    ],
  },
  {
    slug: 'aogiri-phone', n: '07', accent: 'amber', group: s('LynShen', 'LynShen'),
    cat: 'apps', role: s('Sole author. I designed and built it end to end.', '独立作者。从设计到实现，都由我一个人完成。'),
    preview: { kind: 'video', name: 'phone-glass', tall: true },
    name: s('Aogiri for iPhone & Android', 'Aogiri 手机端'),
    kicker: s('React Native · Swift · Kotlin', 'React Native · Swift · Kotlin'),
    oneLine: s('A pocket companion called Lumen that sets real alarms, writes to your calendar, and approves your computer’s next step.',
      '口袋里的伙伴 Lumen：能定真的闹钟、写日历，也能替你批准电脑的下一步。'),
    tags: ['Expo', 'React Native', 'Swift · AlarmKit', 'Kotlin · Shizuku', 'Reanimated'],
    status: s('In development · v0.1.0 · test builds', '开发中 · v0.1.0 · 测试版'),
    cover: { kind: 'video', name: 'phone-glass', frame: 'phone' },
    facts: [
      { v: s('5', '5'), k: s('native modules in Swift and Kotlin', '个原生模块（Swift、Kotlin）') },
      { v: s('697', '697'), k: s('unit tests (Vitest)', '个单元测试（Vitest）') },
      { v: s('10', '10'), k: s('design changes in the glass redesign', '项「通透」改版改动') },
    ],
  },
  {
    slug: 'brand', n: '08', accent: 'amber',
    cat: 'design', role: s('Designer and director: the logo, the launch animation, and the promo storyboard and film.', '设计与导演：标志、开屏动画，以及宣传片的分镜和成片。'),
    preview: { kind: 'video', name: 'launch' },
    name: s('Brand, motion & film', '品牌、动效与短片'),
    kicker: s('Logo system · launch animation · 60-second film', '标志系统 · 开屏动画 · 60 秒短片'),
    oneLine: s('The logo, its launch animation, and a 60-second film cut to a 100 BPM grid.',
      '标志、它的开屏动画，以及一部按 100 BPM 节拍剪辑的 60 秒短片。'),
    tags: ['SVG', 'CSS keyframes', 'Remotion', 'FFmpeg'],
    status: s('Shipped in desktop v0.10', '已随桌面端 v0.10 发布'),
    cover: { kind: 'video', name: 'launch', frame: 'plain' },
    facts: [
      { v: s('2.05 s', '2.05 秒'), k: s('launch entrance, 5 parts', '开屏入场，5 个部件') },
      { v: s('≥ 3:1', '≥ 3:1'), k: s('contrast for the light on both themes', '光在深浅两种底色上的对比度') },
      { v: s('25 bars', '25 小节'), k: s('film cut to a 100 BPM grid', '短片按 100 BPM 节拍剪辑') },
    ],
  },
  {
    slug: 'armil', n: '09', accent: 'amber',
    cat: 'apps', role: s('Sole author. I designed and built it end to end.', '独立作者。从设计到实现，都由我一个人完成。'),
    preview: { kind: 'img', name: 'qx-chart', tall: true },
    name: s(AR, '牵星'), site: ARMIL_SITE_LIVE ? 'https://armil.io' : undefined,
    kicker: s('Phone app · TypeScript + Capacitor · Go', '手机应用 · TypeScript + Capacitor · Go'),
    oneLine: s(`${AR} is a phone app that computes traditional Chinese and Western charts the way a calculator would: the same input always gives the same result, each line of the plain-language reading cites where it comes from, and the charts are computed on the phone. Friends, a feed and messages now sit around the calculator.`,
      '牵星是一个手机应用，像计算器一样排传统历法和星盘：同样的输入永远得到同样的结果，白话解读的每一句都写明出处，盘在手机上算。计算器之外，现在还有好友、圈子和私信。'),
    tags: ['TypeScript', 'Web Worker', 'lunar-javascript', 'astronomy-engine', 'React 19', 'Capacitor', 'Go', 'PostgreSQL', 'Vitest'],
    status: s('In development · TestFlight · private repo', '开发中 · TestFlight 测试中 · 私有仓库'),
    cover: { kind: 'img', name: 'qx-chart', frame: 'phone' },
    facts: [
      { v: s('179', '179'), k: s('accuracy, regression and reading tests', '项准确性、回归与解读测试') },
      { v: s('0.1°', '0.1°'), k: s('tolerance against Swiss Ephemeris', '与 Swiss Ephemeris 对照的容差') },
      { v: s('128', '128'), k: s('golden inputs matched field by field after the port to TypeScript', '组金标准输入，移植到 TypeScript 后逐字段一致') },
    ],
  },
];
