/**
 * Eden's Cure — Light / Dark Theme Toggle
 * Persists preference to localStorage. Applies instantly on load (no flash).
 */
(function () {
  'use strict';

  var KEY  = 'ec-theme';
  var html = document.documentElement;

  /* Apply saved theme immediately (before paint) */
  var saved = localStorage.getItem(KEY);
  if (saved === 'light') html.setAttribute('data-theme', 'light');

  /* Wire toggle button once DOM is ready */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isLight = html.getAttribute('data-theme') === 'light';
      if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.setItem(KEY, 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem(KEY, 'light');
      }
    });
  });

}());
