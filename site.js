(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const pageContent = [document.querySelector('main'), document.querySelector('.site-footer')].filter(Boolean);

  const setPageInert = (isInert) => {
    pageContent.forEach((element) => {
      if (isInert) element.setAttribute('inert', '');
      else element.removeAttribute('inert');
    });
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    setPageInert(false);
    if (restoreFocus) toggle.focus();
  };

  const openMenu = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    setPageInert(true);
    const firstLink = nav.querySelector('a');
    if (firstLink) window.setTimeout(() => firstLink.focus(), 80);
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: true });
      }
    });
  }

  const revealElements = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('submitted') === '1') {
    const message = document.querySelector('.success-message');
    if (message) {
      message.classList.add('is-visible');
      message.tabIndex = -1;
      message.focus();
    }
    if (history.replaceState) history.replaceState({}, document.title, location.pathname + location.hash);
  }
})();
