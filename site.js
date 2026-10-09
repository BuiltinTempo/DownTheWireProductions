(() => {
  const businessEmail = 'josh@downthewire.productions';
  const nav = document.querySelector('.nav-links');
  const toggle = document.querySelector('.menu-toggle');

  const styles = document.createElement('style');
  styles.textContent = `
    .nav-rent-menu{position:relative;display:flex;align-items:center}
    .nav-rent-toggle{display:inline-flex;align-items:center;gap:7px;padding:10px 0;border:0;border-bottom:1px solid transparent;background:transparent;color:var(--muted);font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
    .nav-rent-toggle:after{content:'▾';font-size:10px;color:#d96767;transition:transform .2s}
    .nav-rent-menu.open .nav-rent-toggle{color:#fff;border-color:var(--red)}
    .nav-rent-menu.open .nav-rent-toggle:after{transform:rotate(180deg)}
    .nav-rent-dropdown{position:absolute;top:calc(100% + 15px);right:0;z-index:150;display:none;min-width:260px;padding:8px;border:1px solid var(--line2);background:#080808;box-shadow:0 18px 45px rgba(0,0,0,.45)}
    .nav-rent-menu.open .nav-rent-dropdown{display:grid}
    .nav-rent-dropdown a{display:grid;gap:2px;padding:12px 13px;border-bottom:1px solid rgba(255,255,255,.08);color:#fff!important;font-size:12px!important;font-weight:900!important;letter-spacing:.07em!important;text-transform:uppercase!important}
    .nav-rent-dropdown a:last-child{border-bottom:0}
    .nav-rent-dropdown a span{color:var(--subtle);font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:none}
    .nav-rent-dropdown a:hover{background:#111}
    .rent-scroll-cta{position:fixed;right:22px;bottom:22px;z-index:90;display:flex;align-items:center;gap:10px;padding:13px 17px;border:1px solid #d05d5d;background:rgba(184,72,72,.97);color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 14px 36px rgba(0,0,0,.45);transform:translateY(90px);opacity:0;pointer-events:none;transition:transform .25s,opacity .25s,background .2s}
    .rent-scroll-cta.visible{transform:translateY(0);opacity:1;pointer-events:auto}
    .rent-scroll-cta:hover{background:#c95555}
    @media(max-width:780px){.nav-rent-menu{display:grid;width:100%}.nav-rent-toggle{width:100%;justify-content:space-between;padding:13px 0}.nav-rent-dropdown{position:static;min-width:0;margin:0 0 8px;padding:4px 0 4px 12px;border:0;border-left:2px solid var(--red);box-shadow:none;background:transparent}.nav-rent-dropdown a{padding:10px 8px}.rent-scroll-cta{right:12px;left:12px;bottom:12px;justify-content:center}}
  `;
  document.head.appendChild(styles);

  document.querySelectorAll('form[action*="formsubmit.co/"]').forEach(form => form.action = `https://formsubmit.co/${businessEmail}`);
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => { link.href = `mailto:${businessEmail}`; if (link.textContent.includes('@')) link.textContent = businessEmail; });
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => { try { const data = JSON.parse(script.textContent); if (data && typeof data === 'object' && 'email' in data) { data.email = businessEmail; script.textContent = JSON.stringify(data); } } catch (_) {} });

  if (nav && !nav.querySelector('.nav-rent-menu')) {
    const rentalsLink = Array.from(nav.querySelectorAll('a')).find(a => (a.getAttribute('href') || '') === 'rentals.html');
    const primaryButton = nav.querySelector('.btn');
    const menu = document.createElement('div');
    menu.className = 'nav-rent-menu';
    menu.innerHTML = `<button class="nav-rent-toggle" type="button" aria-expanded="false" aria-haspopup="true">Rentals</button><div class="nav-rent-dropdown"><a href="rentals.html">Rental Overview<span>Packages, show builds, and rental process</span></a><a href="rent-now.html">Rent Now<span>Browse currently published rental inventory</span></a></div>`;
    if (rentalsLink) rentalsLink.replaceWith(menu); else if (primaryButton) nav.insertBefore(menu, primaryButton); else nav.appendChild(menu);
    const button = menu.querySelector('.nav-rent-toggle');
    const closeDrop = () => { menu.classList.remove('open'); button.setAttribute('aria-expanded','false'); };
    button.addEventListener('click', e => { e.stopPropagation(); const open = !menu.classList.contains('open'); menu.classList.toggle('open', open); button.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', e => { if (!menu.contains(e.target)) closeDrop(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrop(); });
  }

  if (location.pathname.endsWith('rentals.html')) {
    const cta = document.createElement('a');
    cta.className = 'rent-scroll-cta';
    cta.href = 'rent-now.html';
    cta.textContent = 'Browse Rental Inventory →';
    document.body.appendChild(cta);
    const update = () => cta.classList.toggle('visible', window.scrollY > 420);
    window.addEventListener('scroll', update, {passive:true}); update();
  }

  const pageContent = [document.querySelector('main'), document.querySelector('.site-footer')].filter(Boolean);
  const setPageInert = value => pageContent.forEach(el => value ? el.setAttribute('inert','') : el.removeAttribute('inert'));
  const closeMenu = ({restoreFocus=false}={}) => { if(!toggle||!nav)return; toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Open navigation'); nav.classList.remove('open'); document.body.classList.remove('menu-open'); setPageInert(false); if(restoreFocus)toggle.focus(); };
  const openMenu = () => { if(!toggle||!nav)return; toggle.setAttribute('aria-expanded','true'); toggle.setAttribute('aria-label','Close navigation'); nav.classList.add('open'); document.body.classList.add('menu-open'); setPageInert(true); const first=nav.querySelector('a,button'); if(first)setTimeout(()=>first.focus(),80); };
  if(toggle&&nav){ toggle.addEventListener('click',()=>toggle.getAttribute('aria-expanded')==='true'?closeMenu():openMenu()); nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu())); window.addEventListener('resize',()=>{if(innerWidth>780)closeMenu();}); document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu({restoreFocus:true});}); }

  const reveal = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){ const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.13}); reveal.forEach(el=>observer.observe(el)); } else reveal.forEach(el=>el.classList.add('visible'));
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

  const params=new URLSearchParams(location.search); if(params.get('submitted')==='1'){ const target=location.hash?document.querySelector(location.hash):null; const message=target?target.querySelector('.success-message'):document.querySelector('.success-message'); if(message){message.classList.add('is-visible');message.tabIndex=-1;message.focus();} if(history.replaceState)history.replaceState({},document.title,location.pathname+location.hash); }

  // HC-X2 gallery repair: temporarily use only verified full-resolution product files.
  if (location.pathname.endsWith('rent-panasonic-hcx2.html')) {
    const thumbs = document.getElementById('gallery-thumbs');
    const main = document.getElementById('gallery-main');
    const modal = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('gallery-modal-image');
    if (thumbs && main) {
      const verified = [
        {src:'panasonic-hcx2-gallery-06.jpg?v=20261009-9', alt:'Panasonic HC-X2 side profile'},
        {src:'panasonic-hcx2-gallery-07.jpg?v=20261009-9', alt:'Panasonic HC-X2 front three-quarter view'},
        {src:'panasonic-hcx2-gallery-08.jpg?v=20261009-9', alt:'Panasonic HC-X2 camera view'},
        {src:'panasonic-hcx2-gallery-05.jpg?v=20261009-9', alt:'Panasonic HC-X2 SDI, timecode and power connections'}
      ];
      let galleryIndex = 0;
      const render = i => {
        galleryIndex = (i + verified.length) % verified.length;
        main.src = verified[galleryIndex].src;
        main.alt = verified[galleryIndex].alt;
        if (modalImage) { modalImage.src = verified[galleryIndex].src; modalImage.alt = verified[galleryIndex].alt; }
        [...thumbs.children].forEach((el,j)=>el.classList.toggle('active',j===galleryIndex));
      };
      thumbs.innerHTML = '';
      verified.forEach((p,i)=>{
        const b=document.createElement('button'); b.type='button'; b.className='gallery-thumb'+(i===0?' active':''); b.setAttribute('aria-label','View '+p.alt);
        const img=document.createElement('img'); img.src=p.src; img.alt=''; img.loading=i===0?'eager':'lazy';
        b.appendChild(img); b.addEventListener('click',()=>render(i)); thumbs.appendChild(b);
      });
      render(0);
      const prev=document.querySelector('.gallery-prev'); const next=document.querySelector('.gallery-next');
      if(prev){const clone=prev.cloneNode(true);prev.replaceWith(clone);clone.addEventListener('click',()=>render(galleryIndex-1));}
      if(next){const clone=next.cloneNode(true);next.replaceWith(clone);clone.addEventListener('click',()=>render(galleryIndex+1));}
      main.onerror = () => { if (galleryIndex !== 1) render(1); };

      // Force the enlarged viewer to use the currently visible image and an explicit viewport size.
      if (modal && modalImage) {
        const modalFix = document.createElement('style');
        modalFix.textContent = `
          #gallery-modal.open{display:flex!important;align-items:center!important;justify-content:center!important}
          #gallery-modal-image{display:block!important;width:auto!important;height:auto!important;max-width:calc(100vw - 150px)!important;max-height:calc(100vh - 80px)!important;object-fit:contain!important;position:relative!important;z-index:2!important;opacity:1!important;visibility:visible!important}
          @media(max-width:700px){#gallery-modal-image{max-width:calc(100vw - 40px)!important;max-height:calc(100vh - 90px)!important}}
        `;
        document.head.appendChild(modalFix);
        main.addEventListener('click', () => {
          modalImage.src = main.currentSrc || main.src;
          modalImage.alt = main.alt;
          modal.classList.add('open');
          modal.setAttribute('aria-hidden','false');
          document.body.style.overflow='hidden';
        }, true);
      }
    }
  }
})();
