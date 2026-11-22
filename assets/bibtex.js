/* "BibTeX" buttons on the Publications page.
   Each entry keeps its BibTeX in a hidden <pre class="bibtex">, so the text
   lives in the HTML and is edited there. The button copies it; if the browser
   refuses the clipboard, the entry is shown instead, to be selected by hand.
   Without JavaScript nothing appears. */
(function () {
  document.querySelectorAll('.entries > li').forEach(function (li) {
    var pre = li.querySelector('pre.bibtex');
    var links = li.querySelector('.links');
    if (!pre || !links) return;

    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'BibTeX';
    b.title = 'Copy the BibTeX entry';
    var timer;

    function copied() {
      b.textContent = 'Copied';
      clearTimeout(timer);
      timer = setTimeout(function () { b.textContent = 'BibTeX'; }, 1600);
    }
    function show() { pre.hidden = !pre.hidden; }

    b.addEventListener('click', function () {
      var text = pre.textContent.trim() + '\n';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(copied, show);
      } else {
        show();
      }
    });
    links.appendChild(b);
  });
})();
