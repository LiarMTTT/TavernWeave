(async () => {
  const main = document.getElementById('main');

  try {
    const urls = [
      './content-1.html?v=18',
      './content-2.html?v=18',
      './content-3.html?v=18',
      './content-4.html?v=18',
      './content-5.html?v=18',
      './content-6.html?v=18',
      './content-7.html?v=18',
      './content-8.html?v=18',
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

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '×' : '☰';
  }

  menuToggle.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
  overlay.addEventListener('click', () => setNav(false));
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => setNav(false)));
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

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    backtop.classList.toggle('show', window.scrollY > 620);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const activeLink = navLinks.find(link => link.getAttribute('href') === `#${visible.target.id}`);
    navLinks.forEach(link => link.classList.toggle('active', link === activeLink));
    if (!activeLink) return;
    const activeChapter = activeLink.closest('.nav-chapter');
    chapterGroups.forEach(group => group.classList.toggle('contains-active', group === activeChapter));
    const sectionNumber = activeLink.querySelector('span')?.textContent || '—';
    tocProgress.textContent = `${sectionNumber} / 45`;
  }, { rootMargin: '-18% 0px -70% 0px', threshold: [0, 0.15, 0.4] });

  sections.forEach(section => observer.observe(section));

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
    codex: '<strong>推荐：Codex 桌面端</strong><br><span class="muted">你主要靠说人话带项目，还要调 TW Skill 阵列。它最像一张能直接派活的 Agent 指挥台。</span>',
    claude: '<strong>推荐：Claude Code Desktop</strong><br><span class="muted">你的活离不开前端预览、真实点击和应用验货；能把页面当场打开，比多一块代码面板更值钱。</span>',
    opencode: '<strong>推荐：OpenCode</strong><br><span class="muted">你准备进入代码层，也希望自己选择当前环境中真正可用的供应商、模型或自定义 API。Cursor 可以作为备用 IDE，但先别为没验过货的 Pro+ 或 Ultra 买单。</span>',
    cli: '<strong>推荐：Agent CLI（进阶路径）</strong><br><span class="muted">你的主菜是脚本、服务器和自动化。CLI 更自由，也更容易把环境杂活一锅端上来，所以放进阶路径。</span>',
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
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target?.scrollIntoView();
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    });
  }
})();
