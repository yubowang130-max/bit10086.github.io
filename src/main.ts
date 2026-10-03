import "@fontsource/newsreader/latin-400.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/spline-sans/latin-400.css";
import "@fontsource/spline-sans/latin-500.css";
import "@fontsource/spline-sans/latin-600.css";
import "./style.css";

type Language = "en" | "zh";

const translations: Record<Language, Record<string, string>> = {
  en: {
    skip: "Skip to content",
    menu: "Menu",
    wordmarkLabel: "Yubo Wang, back to top",
    navLabel: "Main navigation",
    navAbout: "About",
    navResearch: "Research",
    navPublications: "Publications",
    navContact: "Contact",
    heroStatus: "Beijing → Singapore · 2026",
    heroTitle: 'Yubo Wang<span class="hero-name-secondary">王宇博</span>',
    identityLocation: "Singapore · NTU",
    heroIntro: "I build intelligent systems that connect <em>knowledge, spatial worlds, and physical action</em>.",
    heroContext: "M.Sc. student at NTU · B.Eng. in Automation at BIT",
    proofLabel: "Academic highlights",
    proofWorkshop: "AI4Research Workshop",
    proofPublications: "Publications",
    proofNtu: "NTU M.Sc.",
    heroResearch: "Explore my research",
    heroContact: "Start a conversation",
    identityFocus: "Embodied AI / VLN–VLA<br />AI agents / 3D worlds",
    identityLabel: "Identity mark for Yubo Wang",
    interestsLabel: "Areas of interest",
    interestAgents: "Scientific agents",
    interest3d: "Generative 3D",
    interestControl: "VLN / VLA",
    interestEmbodied: "Embodied intelligence",
    aboutLabel: "About",
    aboutLead: "I’m an M.Sc. student in <em>Computer Control and Automation</em> at Nanyang Technological University, working on hierarchical mobile manipulation with VLN and VLA models. I received my B.Eng. in Automation from Beijing Institute of Technology.",
    aboutBody: "My work moves between embodied AI, scientific agents, generated 3D environments, and control. I care about the point where a convincing model becomes a system that can make useful decisions under real constraints.",
    collabLabel: "Looking to connect",
    collabBody: "I welcome conversations with researchers and builders working on agents, world models, simulation, and autonomous systems.",
    ntuName: "Nanyang Technological University",
    ntuDegree: "M.Sc. · Computer Control & Automation",
    anuName: "Australian National University",
    anuDegree: "Exchange · AI & Control",
    bitName: "Beijing Institute of Technology",
    bitDegree: "B.Eng. · Automation",
    educationLabel: "Education timeline",
    researchLabel: "Selected research",
    researchIntro: "Five projects trace the question I keep returning to: how can intelligent systems turn representations into reliable action?",
    researchMeta: "2024—present · Selected work",
    dissertationDate: "Aug 2026—present",
    dissertationTitle: "Hierarchical mobile manipulation with VLN and VLA models",
    dissertationBody: "Developing an embodied-AI framework that decomposes language instructions into navigation, search, approach, grasp, and placement. The project studies VLN/VLM planning, VLA or diffusion-policy control, navigation–manipulation hand-offs, recovery, and safety in simulation with limited real-robot validation.",
    mscDissertation: "M.Sc. dissertation",
    scientifyDate: "Mar—May 2026",
    scientifyTitle: "Scientify: autonomous scientific discovery agents",
    scientifyBody: "Co-developed an LLM-agent framework that learns from evolving literature and generates research hypotheses. I built API orchestration, figure-digitisation skills, and local inference workflows for large-scale ablations.",
    scientifyResult: "Paper result · 72% of topics yielded validated hypotheses · 91% lower token cost",
    readPaper: "Read the paper",
    thesisTitle: "Generative 3D scenes for UAV reinforcement learning",
    thesisBody: "Built an end-to-end pipeline for simulator-ready environments: generated scenes and assets, estimated support surfaces, checked collisions, and composed 3D Gaussian Splatting worlds for a downstream UAV RL loop.",
    undergradThesis: "Undergraduate thesis",
    marsTitle: "Mars landing-site selection from terrain constraints",
    marsBody: "Built a geospatial pipeline that combines illumination and slope constraints to rank candidate landing zones, turning Martian DEM evidence into an inspectable selection workflow.",
    viewCode: "View code",
    radarTitle: "Radar emitter recognition with DBSCAN + Transformer",
    radarBody: "Designed a two-stage pipeline for clustering pulse streams and classifying emitter types. It reached 89% accuracy, a 12-point absolute improvement over the CNN baseline on the same dataset.",
    researchProject: "Research project",
    questionsLabel: "Questions I’m exploring",
    questionA: "Can software keep learning from a changing body of knowledge?",
    questionABody: "Research agents, evolving literature, memory, and the gap between retrieval and reasoning.",
    questionB: "When does a generated world become useful rather than merely convincing?",
    questionBBody: "3D representations, simulation, spatial constraints, and environments for autonomous systems.",
    questionC: "How should navigation and manipulation become one reliable system?",
    questionCBody: "Language-conditioned task decomposition, VLN–VLA hand-offs, recovery, and safety under real sensor and physics constraints.",
    publicationsLabel: "Publications",
    firstAuthor: "First author",
    contactLabel: "Contact & links",
    contactIntro: "If our interests overlap, I’d be glad to compare notes, explore a research idea, or contribute to an ambitious prototype.",
    contactNote: "Open to research collaboration and lab opportunities",
    codeLabel: "Code",
    codeNote: "Open-source experiments and project work",
    emailLabel: "Email",
    emailNote: "NTU student email · The best way to reach me",
    cvTitle: "Curriculum vitae",
    cvNote: "Available by email · personal details protected",
    footerPrompt: "Have a question worth exploring?",
    footerCta: "Let’s talk",
    footerBuild: "Designed & built between Beijing and Singapore",
    backTop: "Back to top ↑",
  },
  zh: {
    skip: "跳至主要内容",
    menu: "菜单",
    wordmarkLabel: "王宇博，返回顶部",
    navLabel: "主导航",
    navAbout: "关于我",
    navResearch: "研究项目",
    navPublications: "论文发表",
    navContact: "联系",
    heroStatus: "北京 → 新加坡 · 2026",
    heroTitle: '王宇博<span class="hero-name-secondary">Yubo Wang</span>',
    identityLocation: "新加坡 · 南洋理工",
    heroIntro: "我构建连接<em>知识、空间世界与物理行动</em>的智能系统。",
    heroContext: "南洋理工大学在读硕士 · 北京理工大学自动化学士",
    proofLabel: "学术概览",
    proofWorkshop: "AI4Research 研讨会",
    proofPublications: "论文发表",
    proofNtu: "南洋理工硕士",
    heroResearch: "查看研究项目",
    heroContact: "与我交流",
    identityFocus: "具身智能 / VLN–VLA<br />智能体 / 三维世界",
    identityLabel: "王宇博的视觉身份标识",
    interestsLabel: "研究兴趣",
    interestAgents: "科学智能体",
    interest3d: "生成式三维",
    interestControl: "VLN / VLA",
    interestEmbodied: "具身智能",
    aboutLabel: "关于我",
    aboutLead: "我目前在南洋理工大学攻读<em>计算机控制与自动化</em>硕士，研究基于 VLN 与 VLA 模型的分层移动操作；此前获北京理工大学自动化专业学士学位。",
    aboutBody: "我的工作横跨具身智能、科学智能体、生成式三维环境与控制。我更关注这样一个交汇点：如何让看起来可信的模型，真正成为能够在现实约束下作出有效决策的系统。",
    collabLabel: "期待交流",
    collabBody: "欢迎从事智能体、世界模型、仿真与自主系统的研究者和开发者与我交流。",
    ntuName: "南洋理工大学",
    ntuDegree: "硕士 · 计算机控制与自动化",
    anuName: "澳大利亚国立大学",
    anuDegree: "交换生 · 人工智能与控制",
    bitName: "北京理工大学",
    bitDegree: "学士 · 自动化",
    educationLabel: "教育经历时间线",
    researchLabel: "代表性研究",
    researchIntro: "这五项工作围绕着一个持续吸引我的问题：智能系统如何将表征转化为可靠的行动？",
    researchMeta: "2024—至今 · 精选工作",
    dissertationDate: "2026 年 8 月—至今",
    dissertationTitle: "基于 VLN 与 VLA 模型的分层移动操作",
    dissertationBody: "正在开发一个具身智能框架，将语言指令分解为导航、搜索、接近、抓取和放置阶段。项目研究 VLN/VLM 规划、VLA 或扩散策略控制、导航—操作衔接、失败恢复与安全约束，并在仿真环境中评估，在条件允许时进行有限的真实机器人验证。",
    mscDissertation: "硕士学位论文",
    scientifyDate: "2026 年 3 月—5 月",
    scientifyTitle: "Scientify：自主科学发现智能体",
    scientifyBody: "共同开发从持续演化的文献中学习并生成科研假设的 LLM 智能体框架。我负责 API 编排、图表数字化技能，以及面向大规模消融实验的本地推理流程。",
    scientifyResult: "论文结果 · 72% 的主题产生通过验证的假设 · token 成本降低 91%",
    readPaper: "阅读论文",
    thesisTitle: "面向无人机强化学习的生成式三维场景",
    thesisBody: "构建可直接用于仿真的端到端环境生成管线：生成场景与资产、估计支撑平面、检测碰撞，并组合三维高斯泼溅世界，供下游无人机强化学习使用。",
    undergradThesis: "本科毕业设计",
    marsTitle: "基于地形约束的火星着陆区优选",
    marsBody: "构建结合光照与坡度约束的地理空间分析流程，对候选着陆区进行排序，把火星 DEM 证据转化为可检查的优选过程。",
    viewCode: "查看代码",
    radarTitle: "DBSCAN + Transformer 雷达辐射源识别",
    radarBody: "设计两阶段流程，对脉冲流进行聚类并识别辐射源类型。在相同数据集上达到 89% 准确率，较 CNN 基线绝对提升 12 个百分点。",
    researchProject: "研究项目",
    questionsLabel: "我正在探索的问题",
    questionA: "软件能否从持续变化的知识体系中不断学习？",
    questionABody: "科研智能体、动态文献、记忆，以及检索与推理之间的鸿沟。",
    questionB: "生成的世界何时不只是逼真，而是真正有用？",
    questionBBody: "三维表征、仿真、空间约束，以及面向自主系统的训练环境。",
    questionC: "如何把导航与操作整合为一个可靠系统？",
    questionCBody: "语言条件任务分解、VLN–VLA 衔接、失败恢复，以及真实传感器与物理约束下的安全性。",
    publicationsLabel: "论文发表",
    firstAuthor: "第一作者",
    contactLabel: "联系与链接",
    contactIntro: "如果我们的兴趣有所交集，我很乐意交流研究思路、共同探索问题，或参与一个有挑战性的原型项目。",
    contactNote: "欢迎科研合作与实验室机会",
    codeLabel: "代码",
    codeNote: "开源实验与项目记录",
    emailLabel: "邮箱",
    emailNote: "南洋理工学生邮箱 · 联系我的最佳方式",
    cvTitle: "个人简历",
    cvNote: "可通过邮件索取 · 已保护个人信息",
    footerPrompt: "有一个值得探索的问题？",
    footerCta: "聊一聊",
    footerBuild: "设计与开发于北京和新加坡之间",
    backTop: "返回顶部 ↑",
  },
};

const root = document.documentElement;
const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle");
const nav = document.querySelector<HTMLElement>(".site-nav");
const progressBar = document.querySelector<HTMLElement>(".progress span");
const revealItems = document.querySelectorAll<HTMLElement>(".reveal");
const identityCard = document.querySelector<HTMLElement>(".identity-card");
const languageButton = document.querySelector<HTMLButtonElement>(".language-toggle");

const setLanguage = (language: Language) => {
  const copy = translations[language];
  root.lang = language === "zh" ? "zh-CN" : "en";
  root.dataset.language = language;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key && copy[key]) element.textContent = copy[key];
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;
    if (key && copy[key]) element.innerHTML = copy[key];
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key && copy[key]) element.setAttribute("aria-label", copy[key]);
  });

  const isChinese = language === "zh";
  document.title = isChinese ? "王宇博 — 研究与项目" : "Yubo Wang — Research & Projects";
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    "content",
    isChinese
      ? "王宇博的学术主页，研究方向包括具身智能、分层移动操作、VLN/VLA、科学智能体与生成式三维环境。"
      : "Yubo Wang researches embodied AI, hierarchical mobile manipulation, VLN/VLA systems, scientific agents, and generative 3D environments.",
  );
  languageButton?.setAttribute("aria-label", isChinese ? "Switch to English" : "切换为中文");
  languageButton?.setAttribute("title", isChinese ? "Switch to English" : "切换为中文");
  try {
    localStorage.setItem("language", language);
  } catch {
    // Language switching still works when browser storage is unavailable.
  }
};

let storedLanguage: string | null = null;
try {
  storedLanguage = localStorage.getItem("language");
} catch {
  // Keep the default language when persistence is blocked.
}
const initialLanguage: Language = storedLanguage === "zh" ? "zh" : "en";
setLanguage(initialLanguage);

languageButton?.addEventListener("click", () => {
  setLanguage(root.dataset.language === "zh" ? "en" : "zh");
  closeMenu();
});

const closeMenu = () => {
  menuButton?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
  root.classList.remove("menu-open");
};

menuButton?.addEventListener("click", () => {
  const nextOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(nextOpen));
  nav?.classList.toggle("is-open", nextOpen);
  root.classList.toggle("menu-open", nextOpen);
});

nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }
});

document.addEventListener("click", (event) => {
  if (event.target instanceof Node && !nav?.contains(event.target) && !menuButton?.contains(event.target)) {
    closeMenu();
  }
});

window.matchMedia("(min-width: 721px)").addEventListener("change", closeMenu);

const navLinks = Array.from(nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? []);
const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting);
  if (!visible.length) return;
  const id = visible[0].target.id;
  navLinks.forEach((link) => {
    if (link.hash === "#" + id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
document.querySelectorAll("main > section[id]").forEach((section) => sectionObserver.observe(section));

window.addEventListener(
  "scroll",
  () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    if (progressBar) progressBar.style.transform = "scaleX(" + progress + ")";
  },
  { passive: true },
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  root.classList.add("motion-ready");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -24px 0px" },
  );
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll<HTMLElement>("[data-year]").forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});

if (identityCard && !prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  identityCard.addEventListener("pointermove", (event) => {
    const bounds = identityCard.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    identityCard.style.setProperty("--tilt-x", (0.5 - y) * 3 + "deg");
    identityCard.style.setProperty("--tilt-y", (x - 0.5) * 4 + "deg");
    identityCard.style.setProperty("--spot-x", x * 100 + "%");
    identityCard.style.setProperty("--spot-y", y * 100 + "%");
  });

  identityCard.addEventListener("pointerleave", () => {
    identityCard.style.setProperty("--tilt-x", "0deg");
    identityCard.style.setProperty("--tilt-y", "0deg");
    identityCard.style.setProperty("--spot-x", "50%");
    identityCard.style.setProperty("--spot-y", "50%");
  });
}
