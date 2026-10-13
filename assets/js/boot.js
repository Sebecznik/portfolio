(() => {
  try {
    const saved = localStorage.getItem('sp-theme');
    if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
  } catch (_) { /* The page also works when storage is disabled. */ }
})();
