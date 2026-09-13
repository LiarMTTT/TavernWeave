(async () => {
  const main = document.getElementById('main');

  try {
    const urls = [
      './content-0.html?v=42',
      './content-1.html?v=42',
      './content-2.html?v=42',
      './content-3.html?v=42',
      './content-4.html?v=42',
      './content-5.html?v=42',
      './content-6.html?v=42',
      './content-7.html?v=42',
      './content-8.html?v=42',
      './content-9.html?v=42',
    ];
    const responses = await Promise.all(urls.map(url => fetch(url, { cache: 'no-store' })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`HTTP ${failed.status}`);
    main.innerHTML = (await Promise.all(responses.map(response => response.text()))).join('');
  } catch (error) {
    main.innerHTML = `<section class="section"><h2>正文没加载出来</h2><p>${String(error)}</p><p>先刷新一次；还不行，就打开固定版本预览。</p></section>`;
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const progress = document.getElementById('progress');
  const backtop = document.getElementById('backtop');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const overlay = document.getElementById('overlay');
  const sidebar = document.querySelector('.sidebar');
  const tocProgress = document.getElementById('tocProgress');
  const chapterGroups = [...document.querySelectorAll('.nav-chapter')];
  const releaseEntries = [...document.querySelectorAll('.release-entry')];
  const savedTheme = localStorage.getItem('tw-guide-theme');
  const systemLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  root.dataset.theme = savedTheme || (systemLight ? 'light' : 'dark');

  function updateThemeMeta() {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', root.dataset.theme === 'dark' ? '#0b0d12' : '#f4f3ef');
    themeToggle.textContent = root.dataset.theme === 'dark' ? '☼' : '◐';
  }

  updateThemeMeta();
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tw-guide-theme', root.dataset.theme);
    updateThemeMeta();
  });

  let navScrollY = 0;
  let navScrollHeight = 0;

  function setNav(open) {
    const wasOpen = body.classList.contains('nav-open');
    if (open === wasOpen) return;
    const activeBeforeOpen = open ? document.querySelector('.nav-link.active') : null;

    if (open) {
      navScrollY = window.scrollY;
      navScrollHeight = document.documentElement.scrollHeight;
      body.classList.add('nav-open');
      body.style.position = 'fixed';
      body.style.top = `-${navScrollY}px`;
      body.style.width = '100%';
    } else {
      body.classList.remove('nav-open');
    }

    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '×' : '☰';

    if (!open) {
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      window.scrollTo({ top: navScrollY, left: 0, behavior: 'auto' });
    }

    window.requestAnimationFrame(() => {
      if (open) {
        const activeAtFrozenScroll = getActiveEntryAt(navScrollY, navScrollHeight)?.link || activeBeforeOpen;
        setActiveLink(activeAtFrozenScroll);
        keepActiveLinkVisible(activeAtFrozenScroll);
      }
      else updateActiveNav();
    });
  }

  menuToggle.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
  overlay.addEventListener('click', () => setNav(false));
  chapterGroups.forEach(group => {
    group.addEventListener('toggle', () => {
      if (!group.open) return;
      chapterGroups.forEach(other => {
        if (other !== group) other.open = false;
      });
      window.requestAnimationFrame(() => {
        sidebar.scrollTo({
          top: Math.max(0, group.offsetTop - 82),
          behavior: 'smooth',
        });
      });
    });
  });
  releaseEntries.forEach(entry => {
    entry.addEventListener('toggle', () => {
      if (!entry.open) return;
      releaseEntries.forEach(other => {
        if (other !== entry) other.open = false;
      });
      window.requestAnimationFrame(requestActiveNavUpdate);
    });
  });

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    backtop.classList.toggle('show', window.scrollY > 620);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const navLinks = [...document.querySelectorAll('.nav-link')];
  const navAnchors = navLinks.map(link => {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    return { link, target: document.getElementById(id) };
  }).filter(entry => entry.target);
  const documentOrderedAnchors = [...navAnchors].sort((a, b) => {
    if (a.target === b.target) return 0;
    const relation = a.target.compareDocumentPosition(b.target);
    return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  const navTotal = navAnchors.length;
  const tocHead = sidebar.querySelector('.toc-head');
  let currentActiveLink = null;
  let activeNavFrame = 0;

  function keepActiveLinkVisible(activeLink) {
    if (!activeLink || (window.innerWidth <= 940 && !body.classList.contains('nav-open'))) return;
    const sidebarRect = sidebar.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const visibleTop = Math.max(sidebarRect.top, tocHead?.getBoundingClientRect().bottom || sidebarRect.top) + 10;
    const visibleBottom = sidebarRect.bottom - 12;
    let delta = 0;

    if (linkRect.top < visibleTop) delta = linkRect.top - visibleTop;
    else if (linkRect.bottom > visibleBottom) delta = linkRect.bottom - visibleBottom;
    if (!delta) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sidebar.scrollTo({
      top: Math.max(0, sidebar.scrollTop + delta),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }

  function setActiveLink(activeLink) {
    if (!activeLink) return;
    if (activeLink === currentActiveLink) {
      keepActiveLinkVisible(activeLink);
      return;
    }
    currentActiveLink = activeLink;
    navLinks.forEach(link => link.classList.toggle('active', link === activeLink));
    const activeChapter = activeLink.closest('.nav-chapter');
    chapterGroups.forEach(group => group.classList.toggle('contains-active', group === activeChapter));
    if (activeChapter && !activeChapter.open) activeChapter.open = true;
    const sectionNumber = activeLink.querySelector('span')?.textContent || '—';
    tocProgress.textContent = `${sectionNumber} / ${navTotal}`;
    window.requestAnimationFrame(() => keepActiveLinkVisible(activeLink));
  }

  function getActiveEntryAt(scrollTop, pageScrollHeight = document.documentElement.scrollHeight) {
    const headerHeight = Number.parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 64;
    const activationLine = headerHeight + Math.min(128, window.innerHeight * 0.22);
    let activeEntry = documentOrderedAnchors[0];

    documentOrderedAnchors.forEach(entry => {
      const targetDocumentTop = entry.target.getBoundingClientRect().top + scrollTop;
      if (targetDocumentTop <= scrollTop + activationLine) activeEntry = entry;
    });

    if (scrollTop + window.innerHeight >= pageScrollHeight - 2) {
      activeEntry = documentOrderedAnchors.at(-1);
    }

    return activeEntry;
  }

  function updateActiveNav() {
    if (body.classList.contains('nav-open')) return;
    const activeEntry = getActiveEntryAt(window.scrollY);

    setActiveLink(activeEntry?.link);
  }

  function requestActiveNavUpdate() {
    if (activeNavFrame) return;
    activeNavFrame = window.requestAnimationFrame(() => {
      activeNavFrame = 0;
      updateActiveNav();
    });
  }

  navLinks.forEach(link => link.addEventListener('click', event => {
    const href = link.getAttribute('href');
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;

    event.preventDefault();
    const navigate = () => {
      const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const releaseEntry = target.querySelector('.release-entry');
      if (releaseEntry && !releaseEntry.open) releaseEntry.open = true;
      history.pushState(null, '', href);
      setActiveLink(link);
      target.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
      window.setTimeout(requestActiveNavUpdate, reducedMotion ? 0 : 360);
    };

    if (body.classList.contains('nav-open')) {
      setNav(false);
      window.requestAnimationFrame(navigate);
    } else {
      navigate();
    }
  }));
  window.addEventListener('scroll', requestActiveNavUpdate, { passive: true });
  window.addEventListener('resize', requestActiveNavUpdate);
  window.addEventListener('load', requestActiveNavUpdate, { once: true });
  document.fonts?.ready.then(requestActiveNavUpdate);
  updateActiveNav();

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text.trim());
      const before = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = before; }, 1400);
    } catch {
      const area = document.createElement('textarea');
      area.value = text.trim();
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = '复制'; }, 1400);
    }
  }

  document.querySelectorAll('.code-block').forEach(block => {
    const button = block.querySelector('.copy-btn');
    if (button) button.addEventListener('click', () => copyText(block.querySelector('code').innerText, button));
  });

  document.querySelectorAll('[data-copy-target]').forEach(button => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.copyTarget);
    copyText(target.querySelector('code').innerText, button);
  }));

  const choices = new Set();
  const recommendation = document.getElementById('recommendation');
  const choiceButtons = [...document.querySelectorAll('.choice-btn')];
  const recommendations = {
    codex: '<strong>可以从 Codex 桌面端试起</strong><br><span class="muted">你倾向于用自然语言描述需求，再查看改动和结果。先用 TW 做一个小任务，看看这种项目管理方式是否顺手。</span>',
    claude: '<strong>可以试试 Claude Code Desktop</strong><br><span class="muted">你经常需要运行和预览前端，可以先试它的浏览器面板与检查流程。可用能力仍要以你的系统、版本和权限为准。</span>',
    opencode: '<strong>可以了解 OpenCode</strong><br><span class="muted">你愿意查看代码，也想自己配置供应商和模型。先接入当前环境可用的 API，再用一项真实任务确认工具调用是否正常。</span>',
    cli: '<strong>可以考虑 Agent CLI（进阶路径）</strong><br><span class="muted">你需要脚本、服务器或自动化工作流，可以逐步学习命令行。先熟悉目录、权限与环境配置，再接入正式任务。</span>',
  };

  function calculateRecommendation() {
    if (!choices.size) {
      recommendation.textContent = '选择你的工作方式后，这里会给出推荐。';
      return;
    }
    if (choices.has('automation')) recommendation.innerHTML = recommendations.cli;
    else if (choices.has('manual')) recommendation.innerHTML = recommendations.opencode;
    else if (choices.has('preview')) recommendation.innerHTML = recommendations.claude;
    else recommendation.innerHTML = recommendations.codex;
  }

  choiceButtons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.choice;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    pressed ? choices.delete(key) : choices.add(key);
    calculateRecommendation();
  }));

  if (location.hash) {
    window.requestAnimationFrame(() => {
      const hash = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(hash);
      const targetLink = navLinks.find(link => link.getAttribute('href') === `#${hash}`);
      const targetChapter = targetLink?.closest('.nav-chapter');
      if (targetChapter) targetChapter.open = true;
      setActiveLink(targetLink);
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target?.scrollIntoView();
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    });
  }
})();
