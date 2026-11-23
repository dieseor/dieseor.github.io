/* Visit counter.
   One count per browsing session, not one per page: moving between pages of
   this site reads the number instead of adding to it. Abacus does the
   counting (no account, no cookies); if it is unreachable the line simply
   never appears.

   Abacus can take several seconds to answer, so the last number this browser
   saw is kept in localStorage and shown at once, then replaced by the fresh
   one when it arrives. That copy only feeds the display: what is counted, and
   when, is exactly as before, and KEY must never change (a new key starts at 0). */
(function () {
  var API = 'https://abacus.jasoncameron.dev/';
  var KEY = 'dieseor-github-io/site-visits';
  var FLAG = 'ds-visit';
  var LAST = 'ds-visits-last';
  var MAX_AGE = 30 * 24 * 3600 * 1000; /* older copies are not shown */

  var line = document.querySelector('.visits');
  var slot = document.querySelector('.visit-count');

  function show(n) {
    if (!line || !slot) return;
    slot.textContent = n.toLocaleString('en');
    line.hidden = false;
  }

  /* The last number seen in this browser, if recent, while Abacus answers. */
  try {
    var last = JSON.parse(localStorage.getItem(LAST) || 'null');
    if (last && typeof last.v === 'number' && Date.now() - last.t < MAX_AGE) show(last.v);
  } catch (e) {}

  /* Default to "already counted": if this browser refuses storage we read the
     number rather than risk inflating it. */
  var counted = true;
  try { counted = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}

  fetch(API + (counted ? 'get/' : 'hit/') + KEY, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || typeof d.value !== 'number') return;
      try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
      try { localStorage.setItem(LAST, JSON.stringify({ v: d.value, t: Date.now() })); } catch (e) {}
      show(d.value);
    })
    .catch(function () {});
})();
