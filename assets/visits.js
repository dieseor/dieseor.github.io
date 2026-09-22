/* Visit counter.
   One count per browsing session, not one per page: moving between pages of
   this site reads the number instead of adding to it. Abacus does the
   counting (no account, no cookies); if it is unreachable the line simply
   never appears. */
(function () {
  var API = 'https://abacus.jasoncameron.dev/';
  var KEY = 'dieseor-github-io/site-visits';
  var FLAG = 'ds-visit';

  /* Default to "already counted": if this browser refuses storage we read the
     number rather than risk inflating it. */
  var counted = true;
  try { counted = sessionStorage.getItem(FLAG) === '1'; } catch (e) {}

  fetch(API + (counted ? 'get/' : 'hit/') + KEY, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || typeof d.value !== 'number') return;
      try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
      var line = document.querySelector('.visits');
      var slot = document.querySelector('.visit-count');
      if (!line || !slot) return;
      slot.textContent = d.value.toLocaleString('en');
      line.hidden = false;
    })
    .catch(function () {});
})();
