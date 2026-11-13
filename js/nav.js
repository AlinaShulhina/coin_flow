(() => {
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  const icon = btn.querySelector('use');

  const setOpen = (open) => {
    nav.toggleAttribute('data-open', open);
    btn.setAttribute('aria-expanded', String(open));
    icon?.setAttribute('href', open ? '#i-x' : '#i-menu');
  };

  btn.addEventListener('click', () => {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  // закриття після вибору пункту
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Escape закриває меню
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.hasAttribute('data-open')) {
      setOpen(false);
      btn.focus();
    }
  });

  // на десктопі скидаємо стан
  matchMedia('(min-width: 80rem)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
})();