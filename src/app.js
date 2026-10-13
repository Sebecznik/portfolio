(() => {
  'use strict';
  const copy = window.PORTFOLIO_COPY || {};
  let language = 'en';
  let previewKey = null;
  let previousFocus = null;
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { /* Optional preference. */ } };
  const text = key => copy[key]?.[language] || copy[key]?.en || '';
  const dialog = $('#image-dialog');
  const navigation = $('#navigation');
  const menuButton = $('#menu-toggle');

  function setLanguage(next, persist = false) {
    if (!['en', 'pl'].includes(next)) return;
    language = next;
    document.documentElement.lang = next;
    $$('[data-i18n]').forEach(element => {
      const value = text(element.dataset.i18n);
      if (value) element.textContent = value;
    });
    for (const [dataAttribute, targetAttribute] of [['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt']]) {
      $$(`[${dataAttribute}]`).forEach(element => {
        const value = text(element.getAttribute(dataAttribute));
        if (value) element.setAttribute(targetAttribute, value);
      });
    }
    $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
    $$('[data-preview]').forEach(link => link.setAttribute('aria-label', `${text('projects.preview')} — ${text(`projects.${link.dataset.preview}.title`)}`));
    navigation.setAttribute('aria-label', next === 'pl' ? 'Nawigacja główna' : 'Main navigation');
    document.title = text('meta.title');
    $('meta[name="description"]').setAttribute('content', text('meta.description'));
    if (dialog.open && previewKey) updatePreviewText();
    if (persist) {
      save('sp-language', next);
      try {
        const url = new URL(window.location.href);
        if (next === 'pl') url.searchParams.set('lang', 'pl'); else url.searchParams.delete('lang');
        history.replaceState(null, '', url);
      } catch (_) { /* Local-file previews do not need URL state. */ }
    }
  }
  const urlLanguage = new URLSearchParams(window.location.search).get('lang');
  setLanguage(['en', 'pl'].includes(urlLanguage) ? urlLanguage : read('sp-language') || 'en');
  $$('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language, true)));

  const themeButton = $('#theme-toggle');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#141c17' : '#f7f7f2');
  }
  applyTheme(document.documentElement.dataset.theme || 'light');
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    save('sp-theme', theme);
  });

  function closeMenu() { navigation.dataset.open = 'false'; menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.dataset.open = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
  });

  function updatePreviewText() {
    $('#dialog-title').textContent = text(`projects.${previewKey}.title`);
    $('#dialog-image').alt = text(`projects.${previewKey}.alt`);
  }
  $$('[data-preview]').forEach(link => link.addEventListener('click', event => {
    if (!dialog || typeof dialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    previewKey = link.dataset.preview;
    previousFocus = link;
    $('#dialog-image').src = link.href;
    updatePreviewText();
    document.body.classList.add('dialog-open');
    dialog.showModal();
  }));
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (previousFocus) previousFocus.focus();
    previewKey = null;
  });

  function announce(message) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }
  $('#copy-email').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('paszek0302@gmail.com');
      announce(text('contact.copied'));
    } catch (_) {
      announce(text('contact.copyfailed'));
    }
  });
  $('#year').textContent = String(new Date().getFullYear());

  if ('IntersectionObserver' in window) {
    const sections = $$('main > section[id]').filter(section => ['about', 'projects', 'experience', 'contact'].includes(section.id));
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $$('.main-nav a').forEach(link => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -20px 0px', threshold: 0.05 });
      $$('[data-reveal]').forEach(element => {
        if (element.getBoundingClientRect().top > window.innerHeight) {
          element.classList.add('will-reveal');
          revealObserver.observe(element);
        }
      });
    }
  }
})();
