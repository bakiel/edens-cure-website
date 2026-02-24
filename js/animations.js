/**
 * Eden's Cure — Master Animation Controller
 * Aleph Creative-Hub
 *
 * Handles: Lenis smooth scroll, GSAP scroll reveals, hero entrances,
 * product card 3D tilt, magnetic buttons, marquee, stat counters,
 * shimmer text, parallax, page transitions, ingredient reveals.
 *
 * cursor.js handles the custom cursor separately — not duplicated here.
 */

(function () {
  'use strict';

  // ─── GUARD: require GSAP ─────────────────────────────────────────────────
  if (typeof gsap === 'undefined') {
    console.warn('[animations.js] GSAP not found — animations skipped.');
    return;
  }

  // ─── 1. GSAP PLUGIN REGISTRATION + DEFAULTS ──────────────────────────────
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  gsap.defaults({ ease: 'power3.out' });

  // ─── 2. LENIS SMOOTH SCROLL ──────────────────────────────────────────────
  var lenis = null;

  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });

    // Connect Lenis to GSAP ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      // Standalone RAF loop when ScrollTrigger is not present
      (function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }(0));
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  // Build a word-split wrapper without using innerHTML on user-supplied strings.
  // Each text node inside the element is split into per-word <span> pairs.
  function splitWordsForAnim(el) {
    if (el.classList.contains('split-done')) return;
    el.classList.add('split-done');

    var innerNodes = Array.from(el.childNodes);
    var fragment   = document.createDocumentFragment();

    innerNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Split plain-text nodes into individual word wrappers
        var words = node.textContent.split(/(\s+)/);
        words.forEach(function (token) {
          if (/^\s*$/.test(token)) {
            // Preserve whitespace as a plain text node
            fragment.appendChild(document.createTextNode(' '));
            return;
          }
          var outer = document.createElement('span');
          outer.className = 'split-word';
          outer.style.display = 'inline-block';
          outer.style.overflow = 'hidden';
          outer.style.verticalAlign = 'bottom';

          var inner = document.createElement('span');
          inner.className = 'split-inner';
          inner.style.display = 'inline-block';
          inner.textContent = token;

          outer.appendChild(inner);
          fragment.appendChild(outer);
        });
      } else {
        // Preserve existing child elements (e.g. <em>, <strong>, <span>)
        fragment.appendChild(node.cloneNode(true));
      }
    });

    // Clear and replace with split content
    while (el.firstChild) { el.removeChild(el.firstChild); }
    el.appendChild(fragment);
  }

  // ─── 3. PAGE LOAD SEQUENCE ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    document.body.style.opacity = '0';
    setTimeout(function () {
      gsap.to(document.body, {
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: function () {
          document.dispatchEvent(new CustomEvent('page:ready'));
        }
      });
    }, 80);
  });

  // ─── 4. PAGE TRANSITION OVERLAY ──────────────────────────────────────────
  // Wipe overlay away on page load
  window.addEventListener('load', function () {
    var overlay = $('.page-transition');
    if (overlay) {
      gsap.fromTo(
        overlay,
        { scaleY: 1, transformOrigin: 'top' },
        { scaleY: 0, duration: 0.65, delay: 0.05, ease: 'power3.inOut' }
      );
    }
  });

  // Wipe overlay in on internal link click
  $$('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href ||
        href.charAt(0) === '#' ||
        href.indexOf('http') === 0 ||
        href.indexOf('mailto') === 0 ||
        href.indexOf('tel') === 0) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      var dest = href;

      var overlay = $('.page-transition') || (function () {
        var el = document.createElement('div');
        el.className = 'page-transition';
        document.body.appendChild(el);
        return el;
      }());

      gsap.to(overlay, {
        scaleY: 1,
        transformOrigin: 'bottom',
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete: function () { window.location.href = dest; }
      });
    });
  });

  // ─── Everything below runs after images + fonts are loaded ───────────────
  window.addEventListener('load', function () {

    var stAvailable = typeof ScrollTrigger !== 'undefined';

    // ─── 5. HERO HEADLINE SPLIT-WORD ENTRANCE ────────────────────────────
    $$('.hero-headline, .t-hero').forEach(function (el) {
      splitWordsForAnim(el);
      gsap.from(el.querySelectorAll('.split-inner'), {
        y: '115%',
        rotateX: -40,
        opacity: 0,
        stagger: 0.07,
        duration: 1.1,
        ease: 'power4.out',
        delay: 0.25
      });
    });

    // ─── 6. HERO SUB-ELEMENTS STAGGER ────────────────────────────────────
    var heroSubs = $$('.hero-sub, .hero-label, .hero-cta, .hero-stats');
    if (heroSubs.length) {
      gsap.from(heroSubs, {
        y: 32,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        delay: 0.85,
        ease: 'power3.out'
      });
    }

    // ─── 7. HERO PRODUCT IMAGE PARALLAX ──────────────────────────────────
    if (stAvailable) {
      var heroImg     = $('.hero-product-img, .hero-image');
      var heroSection = $('.hero');
      if (heroImg && heroSection) {
        gsap.to(heroImg, {
          y: -70,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
          }
        });
      }
    }

    // ─── 8. UNIVERSAL SCROLL REVEALS ─────────────────────────────────────
    if (stAvailable) {
      $$('[data-reveal], .reveal-el').forEach(function (el) {
        var delay = parseFloat(el.dataset.delay || 0);
        var dir   = el.dataset.direction || 'up';
        var from  = { opacity: 0, duration: 0.9, ease: 'power3.out', delay: delay };

        if      (dir === 'up')    { from.y = 52; }
        else if (dir === 'down')  { from.y = -52; }
        else if (dir === 'left')  { from.x = -64; }
        else if (dir === 'right') { from.x = 64; }
        else if (dir === 'scale') { from.scale = 0.84; }

        gsap.from(el, Object.assign({}, from, {
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }));
      });

      // Toggle .in-view on CSS-only .reveal elements
      $$('.reveal').forEach(function (el) {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          onEnter: function () { el.classList.add('in-view'); }
        });
      });
    }

    // ─── 9. SECTION HEADINGS LINE REVEAL ─────────────────────────────────
    if (stAvailable) {
      $$('.section-heading').forEach(function (el) {
        var tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
        tl.from(el, { y: 44, opacity: 0, duration: 0.85 });

        var line = el.nextElementSibling;
        if (line && (line.classList.contains('heading-line') ||
                     line.classList.contains('section-divider'))) {
          tl.from(line, {
            scaleX: 0,
            duration: 0.65,
            ease: 'power3.out',
            transformOrigin: 'left'
          }, '-=0.35');
        }
      });
    }

    // ─── 10. PRODUCT CARD STAGGER ENTRANCE ───────────────────────────────
    if (stAvailable) {
      $$('.products-grid, .shop-grid, .product-grid').forEach(function (grid) {
        var cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;
        gsap.from(cards, {
          y: 80,
          opacity: 0,
          scale: 0.92,
          stagger: 0.1,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: { trigger: grid, start: 'top 80%' }
        });
      });
    }

    // ─── 11. PRODUCT CARD 3D TILT ─────────────────────────────────────────
    if (!window.matchMedia('(pointer: coarse)').matches) {
      $$('.product-card').forEach(function (card) {
        var rafId = null;

        card.addEventListener('mousemove', function (e) {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(function () {
            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left)  / r.width  - 0.5;
            var y = (e.clientY - r.top)   / r.height - 0.5;
            gsap.to(card, {
              rotateY: x * 14,
              rotateX: -y * 14,
              z: 20,
              duration: 0.4,
              ease: 'power2.out',
              transformPerspective: 800,
              transformOrigin: 'center center'
            });
            var glow = card.querySelector('.card-glow');
            if (glow) {
              // Use textContent-safe CSS property — no HTML involved
              glow.style.background =
                'radial-gradient(circle at ' +
                ((x + 0.5) * 100).toFixed(1) + '% ' +
                ((y + 0.5) * 100).toFixed(1) +
                '%, rgba(201,168,76,0.18), transparent 60%)';
            }
          });
        });

        card.addEventListener('mouseleave', function () {
          cancelAnimationFrame(rafId);
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            z: 0,
            duration: 0.85,
            ease: 'elastic.out(1, 0.55)',
            transformPerspective: 800
          });
        });
      });
    }

    // ─── 12. MAGNETIC BUTTONS ─────────────────────────────────────────────
    if (!window.matchMedia('(pointer: coarse)').matches) {
      $$('.btn, .filter-btn').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var r  = btn.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width  / 2);
          var dy = e.clientY - (r.top  + r.height / 2);
          gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', function () {
          gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }

    // ─── 13. MARQUEE — GSAP SEAMLESS LOOP ────────────────────────────────
    // Replaces the CSS animation for Lenis-synced smooth control.
    var marqueeWrap  = $('.marquee-wrap');
    var marqueeTrack = $('.marquee-track');

    if (marqueeWrap && marqueeTrack && !marqueeTrack.dataset.gsapInit) {
      marqueeTrack.dataset.gsapInit = '1';
      marqueeTrack.style.animation  = 'none';

      var clone    = marqueeTrack.cloneNode(true);
      clone.style.animation = 'none';
      marqueeTrack.parentElement.appendChild(clone);

      var marqueeDuration = 28;

      [marqueeTrack, clone].forEach(function (track, i) {
        gsap.to(track, {
          x: '-100%',
          duration: marqueeDuration,
          repeat: -1,
          ease: 'none',
          delay: i === 1 ? -(marqueeDuration / 2) : 0
        });
      });

      var marqueeTimeline = gsap.getById ? null : null; // reference placeholder
      marqueeWrap.addEventListener('mouseenter', function () {
        gsap.globalTimeline.timeScale(0.15);
      });
      marqueeWrap.addEventListener('mouseleave', function () {
        gsap.to(gsap.globalTimeline, { timeScale: 1, duration: 0.4 });
      });
    }

    // ─── 14. PARALLAX IMAGES ──────────────────────────────────────────────
    if (stAvailable) {
      $$('.parallax-img, [data-parallax]').forEach(function (el) {
        var speed   = parseFloat(el.dataset.parallaxSpeed || 0.3);
        var section = el.closest('section') || el;
        gsap.to(el, {
          y: function () { return el.offsetHeight * speed; },
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    }

    // ─── 15. INGREDIENT TIMELINE REVEAL (About page) ─────────────────────
    if (stAvailable) {
      $$('.ingredient-row').forEach(function (row, i) {
        var visual = row.querySelector('.ingredient-visual, .ingredient-img-wrap');
        var text   = row.querySelector('.ingredient-text, .ingredient-content');
        var isEven = i % 2 === 0;

        if (visual) {
          gsap.from(visual, {
            x: isEven ? -80 : 80,
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 75%' }
          });
        }
        if (text) {
          gsap.from(text, {
            x: isEven ? 64 : -64,
            opacity: 0,
            duration: 1.1,
            delay: 0.15,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 75%' }
          });
        }
      });
    }

    // ─── 16. STAT COUNTER ANIMATION ──────────────────────────────────────
    if (stAvailable) {
      $$('.stat-number[data-count]').forEach(function (el) {
        var target  = parseInt(el.dataset.count, 10);
        var suffix  = el.dataset.suffix || '';
        var counted = false;

        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          onEnter: function () {
            if (counted) return;
            counted = true;
            var obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.9,
              ease: 'power2.out',
              onUpdate: function () {
                el.textContent = Math.round(obj.val).toLocaleString() + suffix;
              }
            });
          }
        });
      });
    }

    // ─── 17. GOLD SHIMMER TEXT ────────────────────────────────────────────
    $$('.shimmer-text').forEach(function (el) {
      el.style.background           = 'linear-gradient(90deg, #C9A84C 0%, #E8C97A 22%, #C9A84C 44%, #E8C97A 66%, #C9A84C 88%, #E8C97A 100%)';
      el.style.backgroundSize       = '300% auto';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor  = 'transparent';
      el.style.backgroundClip       = 'text';
      gsap.fromTo(
        el,
        { backgroundPosition: '0% center' },
        { backgroundPosition: '-200% center', duration: 3.5, repeat: -1, ease: 'none' }
      );
    });

    // ─── 18. TESTIMONIAL HORIZONTAL TOUCH SCROLL (mobile) ────────────────
    var testimonialTrack = $('.testimonials-track');
    if (testimonialTrack && window.innerWidth < 768) {
      var tStart = 0;
      var tScrollLeft = 0;
      testimonialTrack.addEventListener('touchstart', function (e) {
        tStart      = e.touches[0].clientX;
        tScrollLeft = testimonialTrack.scrollLeft;
      }, { passive: true });
      testimonialTrack.addEventListener('touchmove', function (e) {
        var dx = e.touches[0].clientX - tStart;
        testimonialTrack.scrollLeft = tScrollLeft - dx;
      }, { passive: true });
    }

    // ─── 19. GLASS CARD HOVER LIFT ────────────────────────────────────────
    if (!window.matchMedia('(pointer: coarse)').matches) {
      $$('.glass, .glass-deep, .glass-gold').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
          gsap.to(card, { y: -6, duration: 0.3, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)' });
        });
      });
    }

    // ─── 20. FLOAT ELEMENTS (GSAP override for .gsap-float) ──────────────
    // CSS .float already handles default floating; .gsap-float opts in to
    // the GSAP version for staggered, varied timing.
    $$('.gsap-float').forEach(function (el, i) {
      gsap.to(el, {
        y: -14 + (i % 3) * 4,
        duration: 3.5 + i * 0.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.35
      });
    });

    // ─── 21. NAV SCROLL STATE ─────────────────────────────────────────────
    if (stAvailable) {
      var nav = $('nav, .nav, .navbar');
      if (nav) {
        ScrollTrigger.create({
          start: 'top -60px',
          onUpdate: function (self) {
            if (self.progress > 0) {
              nav.classList.add('scrolled');
            } else {
              nav.classList.remove('scrolled');
            }
          }
        });
      }
    }

    // ─── 22. PREFERS REDUCED MOTION ──────────────────────────────────────
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.globalTimeline.timeScale(0);
      if (lenis) { lenis.destroy(); }
    }

  }); // end window.load

}());
