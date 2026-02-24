/**
 * Eden's Cure — CSS Visual Effects
 * Noise overlay, gradient orbs, scroll-based opacity
 */

(function() {
  'use strict';

  // ─── Noise overlay ──────────────────────────────────────────────────────
  // Inject SVG noise filter + overlay div
  const noiseSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
    <defs>
      <filter id="noise-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
  </svg>`;
  document.body.insertAdjacentHTML('afterbegin', noiseSVG);

  // Add noise overlay to hero
  const hero = document.querySelector('.hero, #hero');
  if (hero) {
    const noiseEl = document.createElement('div');
    noiseEl.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:1;
      opacity:0.025;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      background-size: 200px 200px;
    `;
    hero.style.position = 'relative';
    hero.insertBefore(noiseEl, hero.firstChild);
  }

  // ─── Ambient orb animation ──────────────────────────────────────────────
  document.querySelectorAll('.ambient-orb').forEach((orb, i) => {
    const duration = 15 + i * 5;
    const delay = i * -4;
    orb.style.animation = `orbFloat${i % 3} ${duration}s ${delay}s ease-in-out infinite`;
  });

  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes orbFloat0 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.08)} 66%{transform:translate(-20px,15px) scale(0.95)} }
    @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,18px) scale(1.05)} 66%{transform:translate(20px,-25px) scale(0.92)} }
    @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(15px,25px) scale(0.96)} 66%{transform:translate(-30px,-10px) scale(1.1)} }

    /* Product image radial glow pulse */
    @keyframes glowPulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
    .product-glow { animation: glowPulse 4s ease-in-out infinite; }

    /* Page transition overlay */
    .page-transition {
      position: fixed; inset: 0; z-index: 9999;
      background: #0A0806; pointer-events: none;
      transform: scaleY(0); transform-origin: bottom;
    }

    /* Custom cursor */
    .cursor {
      position: fixed; width: 8px; height: 8px;
      background: #C9A84C; border-radius: 50%;
      pointer-events: none; z-index: 10000;
      transform: translate(-50%, -50%);
    }
    .cursor-ring {
      position: fixed; width: 36px; height: 36px;
      border: 1px solid rgba(201,168,76,0.5); border-radius: 50%;
      pointer-events: none; z-index: 9999;
      transform: translate(-50%, -50%);
    }
  `;
  document.head.appendChild(style);

  // ─── Hero canvas sizing ─────────────────────────────────────────────────
  // Size the canvas to fill hero
  function sizeHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const hero = canvas.closest('.hero, #hero') || canvas.parentElement;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  window.addEventListener('resize', sizeHeroCanvas);
  sizeHeroCanvas();

  // ─── Gold shimmer on headings ───────────────────────────────────────────
  document.querySelectorAll('.gold-shimmer').forEach(el => {
    el.style.background = 'linear-gradient(90deg, #8A6A2A, #C9A84C, #E8C97A, #C9A84C, #8A6A2A)';
    el.style.backgroundSize = '300%';
    el.style.webkitBackgroundClip = 'text';
    el.style.webkitTextFillColor = 'transparent';
    el.style.backgroundClip = 'text';
    el.style.animation = 'goldShimmerMove 4s linear infinite';
  });

  const shimmerStyle = document.createElement('style');
  shimmerStyle.textContent = `@keyframes goldShimmerMove { 0%{background-position:200%} 100%{background-position:-200%} }`;
  document.head.appendChild(shimmerStyle);

})();
