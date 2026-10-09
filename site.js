(() => {
  const businessEmail = 'josh@downthewire.productions';
  const nav = document.querySelector('.nav-links');
  const toggle = document.querySelector('.menu-toggle');

  const enhancementStyles = document.createElement('style');
  enhancementStyles.textContent = `
    .nav-rent-menu{position:relative;display:flex;align-items:center}
    .nav-rent-toggle{display:inline-flex;align-items:center;gap:7px;padding:10px 0;border:0;border-bottom:1px solid transparent;background:transparent;color:var(--muted);font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
    .nav-rent-toggle:after{content:'▾';font-size:10px;color:#d96767;transition:transform .2s}
    .nav-rent-menu.open .nav-rent-toggle{color:#fff;border-color:var(--red)}
    .nav-rent-menu.open .nav-rent-toggle:after{transform:rotate(180deg)}
    .nav-rent-dropdown{position:absolute;top:calc(100% + 15px);right:0;z-index:150;display:none;min-width:245px;padding:8px;border:1px solid var(--line2);background:#080808;box-shadow:0 18px 45px rgba(0,0,0,.45)}
    .nav-rent-menu.open .nav-rent-dropdown{display:grid}
    .nav-rent-dropdown a{display:grid;gap:2px;padding:12px 13px;border-bottom:1px solid rgba(255,255,255,.08);color:#fff!important;font-size:12px!important;font-weight:900!important;letter-spacing:.07em!important;text-transform:uppercase!important}
    .nav-rent-dropdown a:last-child{border-bottom:0}
    .nav-rent-dropdown a span{color:var(--subtle);font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:none}
    .nav-rent-dropdown a:hover{background:#111;border-color:rgba(255,255,255,.08)!important}
    .rent-scroll-cta{position:fixed;right:22px;bottom:22px;z-index:90;display:flex;align-items:center;gap:10px;padding:13px 17px;border:1px solid #d05d5d;background:rgba(184,72,72,.97);color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 14px 36px rgba(0,0,0,.45);transform:translateY(90px);opacity:0;pointer-events:none;transition:transform .25s,opacity .25s,background .2s}
    .rent-scroll-cta.visible{transform:translateY(0);opacity:1;pointer-events:auto}
    .rent-scroll-cta:hover{background:#c95555}
    @media(max-width:780px){
      .nav-rent-menu{display:grid;width:100%}
      .nav-rent-toggle{width:100%;justify-content:space-between;padding:13px 0}
      .nav-rent-dropdown{position:static;min-width:0;margin:0 0 8px;padding:4px 0 4px 12px;border:0;border-left:2px solid var(--red);box-shadow:none;background:transparent}
      .nav-rent-dropdown a{padding:10px 8px}
      .rent-scroll-cta{right:12px;left:12px;bottom:12px;justify-content:center}
    }
  `;
  document.head.appendChild(enhancementStyles);

  const routeBusinessContact = () => {
    document.querySelectorAll('form[action*="formsubmit.co/"]').forEach((form) => {
      form.action = `https://formsubmit.co/${businessEmail}`;
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = `mailto:${businessEmail}`;
      if (link.textContent.includes('@')) link.textContent = businessEmail;
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        if (data && typeof data === 'object' && 'email' in data) {
          data.email = businessEmail;
          script.textContent = JSON.stringify(data);
        }
      } catch (_) {}
    });
  };

  const buildRentMenu = () => {
    if (!nav || nav.querySelector('.nav-rent-menu')) return;
    const currentRentalLink = Array.from(nav.querySelectorAll('a')).find((link) => {
      const href = link.getAttribute('href') || '';
      return href === 'rentals.html' || (location.pathname.endsWith('rentals.html') && href === '#equipment');
    });
    const primaryButton = nav.querySelector('.btn');
    const menu = document.createElement('div');
    menu.className = 'nav-rent-menu';
    menu.innerHTML = `
      <button class="nav-rent-toggle" type="button" aria-expanded="false" aria-haspopup="true">Rent Now</button>
      <div class="nav-rent-dropdown">
        <a href="rentals.html">Rental Overview<span>Gear, show builds, and production support</span></a>
        <a href="rent-panasonic-hcx2.html">Panasonic HC-X2<span>$225/day · $400/weekend · $675/7 days</span></a>
      </div>`;

    if (currentRentalLink && currentRentalLink.getAttribute('href') === 'rentals.html') {
      currentRentalLink.replaceWith(menu);
    } else if (primaryButton) {
      nav.insertBefore(menu, primaryButton);
    } else {
      nav.appendChild(menu);
    }

    const button = menu.querySelector('.nav-rent-toggle');
    const closeDropdown = () => {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      document.querySelectorAll('.nav-rent-menu.open').forEach((other) => other.classList.remove('open'));
      menu.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) closeDropdown();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDropdown();
    });
  };

  const addRentalScrollCta = () => {
    if (!location.pathname.endsWith('/rentals.html') && !location.pathname.endsWith('rentals.html')) return;
    const cta = document.createElement('a');
    cta.className = 'rent-scroll-cta';
    cta.href = 'rent-panasonic-hcx2.html';
    cta.textContent = 'Rent Panasonic HC-X2 →';
    cta.setAttribute('aria-label', 'View Panasonic HC-X2 rental listing');
    document.body.appendChild(cta);
    const update = () => cta.classList.toggle('visible', window.scrollY > 420);
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  routeBusinessContact();
  buildRentMenu();
  addRentalScrollCta();

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
    const firstLink = nav.querySelector('a,button');
    if (firstLink) window.setTimeout(() => firstLink.focus(), 80);
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu({ restoreFocus: true });
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
    const target = location.hash ? document.querySelector(location.hash) : null;
    const message = target ? target.querySelector('.success-message') : document.querySelector('.success-message');
    if (message) {
      message.classList.add('is-visible');
      message.tabIndex = -1;
      message.focus();
    }
    if (history.replaceState) history.replaceState({}, document.title, location.pathname + location.hash);
  }
})();
