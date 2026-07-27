(async () => {
  const main = document.getElementById('main');

  try {
    const urls = [
      './content-1.html?v=16',
      './content-2.html?v=16',
      './content-3.html?v=16',
      './content-4.html?v=16',
      './content-5.html?v=16',
      './content-6.html?v=16',
      './content-7.html?v=16',
      './content-8.html?v=16',
    ];
    const responses = await Promise.all(urls.map(url => fetch(url, { cache: 'no-store' })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`HTTP ${failed.status}`);
    main.innerHTML = (await Promise.all(responses.map(response => response.text()))).join('');
  } catch (error) {
    main.innerHTML = `<section class="section"><h2>页面内容加载失败</h2><p>${String(error)}</p><p>请刷新页面，或打开固定版本预览。</p></section>`;
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
    codex: '<strong>推荐：Codex 桌面端</strong><br><span class="muted">你的核心诉求是自然语言指挥、任务管理和 TW Skill 阵列。它最接近“Agent 指挥台”。</span>',
    claude: '<strong>推荐：Claude Code Desktop</strong><br><span class="muted">你的工作高度依赖前端预览、真实点击和应用验证，集成预览与电脑操作更重要。</span>',
    cursor: '<strong>推荐：Cursor Agents Window</strong><br><span class="muted">你希望 Agent 和完整 IDE 同时存在，准备进入文件、代码跳转和人工微调层。</span>',
    cli: '<strong>推荐：Agent CLI（进阶路径）</strong><br><span class="muted">脚本、服务器和自动化是第一需求。CLI 更灵活，但不属于本教程的默认入口。</span>',
  };

  function calculateRecommendation() {
    if (!choices.size) {
      recommendation.textContent = '选择你的工作方式后，这里会给出推荐。';
      return;
    }
    if (choices.has('automation')) recommendation.innerHTML = recommendations.cli;
    else if (choices.has('manual')) recommendation.innerHTML = recommendations.cursor;
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
