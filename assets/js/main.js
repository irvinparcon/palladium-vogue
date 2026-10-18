// Palladium Vogue — Phase I preview interactions (kept deliberately quiet)
(function () {
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.getElementById('drawer');

  // Solid nav once the hero is scrolled past its first fold
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 60);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile drawer
  const setDrawer = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setDrawer(toggle.getAttribute('aria-expanded') !== 'true'));
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

  // Pointer-driven 3D tilt with a soft return; skipped on touch and reduced-motion
  const canTilt = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
  if (canTilt) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 8;
      el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1100px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
        setTimeout(() => el.classList.remove('is-tilting'), 300);
      });
    });
  }

  // Subtle fade-and-rise reveals, staggered within each parent
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 110}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => io.observe(el));
})();
