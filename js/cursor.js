/**
 * Eden's Cure — Golden Ember Cursor
 * Precise dot + spring ring + canvas particle trail.
 * Embers drift upward and fade as you move. Burst on click.
 */
(function () {
  'use strict';

  if (window.matchMedia('(pointer: coarse)').matches) return;

  /* ── Styles ─────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '*, *::before, *::after { cursor: none !important; }' +

    '#ec-dot {' +
    '  position: fixed; top: 0; left: 0;' +
    '  width: 5px; height: 5px;' +
    '  border-radius: 50%;' +
    '  background: #C4853A;' +
    '  box-shadow: 0 0 10px 3px rgba(196,133,58,0.55);' +
    '  pointer-events: none; z-index: 99999;' +
    '  transform: translate(-50%,-50%);' +
    '  will-change: left, top;' +
    '  transition: width 180ms ease, height 180ms ease,' +
    '    opacity 200ms ease, background 200ms ease, transform 180ms ease;' +
    '}' +

    '#ec-dot.is-hover {' +
    '  width: 3px; height: 3px;' +
    '  background: rgba(196,133,58,0.45);' +
    '  box-shadow: none;' +
    '}' +

    '#ec-ring {' +
    '  position: fixed; top: 0; left: 0;' +
    '  width: 32px; height: 32px;' +
    '  border-radius: 50%;' +
    '  border: 1px solid rgba(196,133,58,0.38);' +
    '  background: transparent;' +
    '  pointer-events: none; z-index: 99998;' +
    '  transform: translate(-50%,-50%);' +
    '  will-change: left, top, width, height;' +
    '  transition:' +
    '    width 400ms cubic-bezier(0.34, 1.56, 0.64, 1),' +
    '    height 400ms cubic-bezier(0.34, 1.56, 0.64, 1),' +
    '    border-color 300ms ease,' +
    '    background 300ms ease,' +
    '    opacity 200ms ease;' +
    '}' +

    '#ec-ring.is-hover {' +
    '  width: 54px; height: 54px;' +
    '  border-color: rgba(196,133,58,0.6);' +
    '  background: rgba(196,133,58,0.05);' +
    '}' +

    '#ec-ring.is-click {' +
    '  width: 18px; height: 18px;' +
    '  border-color: rgba(196,133,58,0.95);' +
    '  background: rgba(196,133,58,0.14);' +
    '  transition: width 80ms ease, height 80ms ease,' +
    '    border-color 80ms, background 80ms;' +
    '}' +

    '#ec-canvas {' +
    '  position: fixed; top: 0; left: 0;' +
    '  width: 100%; height: 100%;' +
    '  pointer-events: none;' +
    '  z-index: 99997;' +
    '}';

  document.head.appendChild(style);

  /* ── Canvas ──────────────────────────────────────────────── */
  var canvas = document.createElement('canvas');
  canvas.id = 'ec-canvas';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Elements ────────────────────────────────────────────── */
  var dot  = document.createElement('div'); dot.id  = 'ec-dot';
  var ring = document.createElement('div'); ring.id = 'ec-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  /* ── State ───────────────────────────────────────────────── */
  var mx = -200, my = -200;
  var rx = -200, ry = -200;
  var prevMx = -200, prevMy = -200;
  var spawnDist2 = 64; /* spawn particle every ~8px */
  var particles  = [];
  var maxP       = 28;

  /* ── Particle factory ────────────────────────────────────── */
  function emit(x, y, burst) {
    var count = burst ? 10 : 1;
    for (var i = 0; i < count; i++) {
      if (particles.length >= maxP) break;
      var angle = burst
        ? (Math.PI * 2 / count) * i + Math.random() * 0.4
        : Math.random() * Math.PI * 2;
      var spd = burst
        ? 1.2 + Math.random() * 1.8
        : 0.25 + Math.random() * 0.45;
      particles.push({
        x:    x,
        y:    y,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd - (burst ? 0.4 : 0.9), /* upward bias */
        r:    burst ? 1.5 + Math.random() * 2 : 1 + Math.random() * 2,
        life: 1.0,
        fade: burst
          ? 0.014 + Math.random() * 0.01
          : 0.018 + Math.random() * 0.012,
        alpha: 0.55 + Math.random() * 0.45
      });
    }
  }

  /* ── Mouse tracking ──────────────────────────────────────── */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    var dx = mx - prevMx, dy = my - prevMy;
    if (dx * dx + dy * dy > spawnDist2) {
      emit(mx, my, false);
      prevMx = mx;
      prevMy = my;
    }
  });

  /* ── Main loop ───────────────────────────────────────────── */
  function tick() {
    /* spring ring */
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';

    /* clear canvas */
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* update + draw particles */
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.015; /* gentle gravity — embers slow then drift */
      p.life -= p.fade;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      var a = p.life * p.alpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(196,133,58,' + a + ')';
      ctx.shadowBlur  = 8;
      ctx.shadowColor = 'rgba(196,133,58,' + (a * 0.6) + ')';
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    requestAnimationFrame(tick);
  }
  tick();

  /* ── Show / hide ─────────────────────────────────────────── */
  document.addEventListener('mouseleave', function () {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  /* ── Hover on interactive targets ────────────────────────── */
  var SEL = 'a, button, .btn, label, input, select, textarea, [role="button"], .product-card, .nav-logo, .tribute-dl-btn';

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(SEL)) {
      ring.classList.add('is-hover');
      dot.classList.add('is-hover');
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(SEL)) {
      ring.classList.remove('is-hover');
      dot.classList.remove('is-hover');
    }
  });

  /* ── Click burst ─────────────────────────────────────────── */
  document.addEventListener('mousedown', function () {
    ring.classList.remove('is-hover');
    ring.classList.add('is-click');
    emit(mx, my, true);
  });
  document.addEventListener('mouseup', function () {
    ring.classList.remove('is-click');
  });

})();
