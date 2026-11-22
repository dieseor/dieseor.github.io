/* Fréchet mean on the circle — an interactive figure for the Visualisations page.

   The data are angles on the unit circle (directions). The ordinary average of
   the points, taken in the plane, falls inside the disc. The Fréchet mean is
   the point m of the circle minimising F(m) = sum_i d(m, x_i)^2, with d the
   geodesic (arc-length) distance. The circle itself is shaded by F.

   Exact computation: the global minimisers of F lie among the n candidates
   theta_bar + 2*pi*j/n, j = 0, ..., n-1, where theta_bar is the arithmetic mean
   of the angles in [0, 2*pi) (Hotz and Huckemann, 2015). We evaluate F at each
   candidate and keep every one attaining the minimum, so non-uniqueness shows.

   No dependencies. Nothing here touches the visit counter. */
(function () {
  var fig = document.querySelector('.demo-frechet');
  if (!fig) return;
  var mount = fig.querySelector('.demo-canvas');
  var readout = fig.querySelector('.demo-readout');
  if (!mount || !readout) return;

  var TAU = 2 * Math.PI;
  var NS = 'http://www.w3.org/2000/svg';
  var W = 300, H = 300, CX = 150, CY = 150, R = 116;
  var RING = 13, SEGMENTS = 360;
  var TIP = R + RING / 2 + 2, BASE = R + RING / 2 + 15, HALF = 7; /* Fréchet pointer */
  var MIN_N = 2, MAX_N = 12;
  var START = [18, 52, 78, 118, 165].map(deg2rad);

  var theta = START.slice();
  var dragging = -1;

  /* ---------------------------------------------------------------- maths */

  function deg2rad(d) { return d * Math.PI / 180; }
  function wrap(a) { a %= TAU; return a < 0 ? a + TAU : a; }
  function dist(a, b) { var d = Math.abs(wrap(a) - wrap(b)); return d > Math.PI ? TAU - d : d; }

  function frechetF(m) {
    var s = 0;
    for (var i = 0; i < theta.length; i++) { var d = dist(m, theta[i]); s += d * d; }
    return s;
  }

  function frechetMeans() {
    var n = theta.length, sum = 0;
    for (var i = 0; i < n; i++) sum += wrap(theta[i]);
    var bar = sum / n, cand = [], best = Infinity;
    for (var j = 0; j < n; j++) {
      var m = wrap(bar + TAU * j / n), f = frechetF(m);
      cand.push({ m: m, f: f });
      if (f < best) best = f;
    }
    var tol = 1e-9 * Math.max(1, best), out = [];
    cand.forEach(function (c) {
      if (c.f <= best + tol && !out.some(function (o) { return dist(o, c.m) < 1e-7; })) out.push(c.m);
    });
    return out;
  }

  function euclideanMean() {
    var x = 0, y = 0, n = theta.length;
    for (var i = 0; i < n; i++) { x += Math.cos(theta[i]); y += Math.sin(theta[i]); }
    return { x: x / n, y: y / n };
  }

  /* ----------------------------------------------------- colour from CSS */

  function hex(v) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  var lo, hi; /* lo: colour where F is largest; hi: where F is smallest */
  function readColours() {
    var cs = getComputedStyle(fig);
    lo = hex(cs.getPropertyValue('--rule')) || [221, 229, 223];
    hi = hex(cs.getPropertyValue('--green')) || [28, 90, 69];
  }
  function mix(t) {
    return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(lo[k] + (hi[k] - lo[k]) * t); }).join(',') + ')';
  }

  /* ------------------------------------------------------------- drawing */

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function px(a, r) { return CX + r * Math.cos(a); }
  function py(a, r) { return CY - r * Math.sin(a); }

  var svg = el('svg', {
    viewBox: '0 0 ' + W + ' ' + H, role: 'group',
    'aria-label': 'Points on a circle, their ordinary average and their Fréchet mean'
  });
  var gRing = el('g', { 'aria-hidden': 'true' }, svg);
  var gMarks = el('g', { 'aria-hidden': 'true' }, svg);
  var gPoints = el('g', {}, svg);
  mount.appendChild(svg);

  var segs = [];
  var step = TAU / SEGMENTS, overlap = deg2rad(0.45);
  for (var s = 0; s < SEGMENTS; s++) {
    var a0 = s * step - overlap / 2, a1 = (s + 1) * step + overlap / 2;
    segs.push(el('path', {
      d: 'M' + px(a0, R).toFixed(2) + ' ' + py(a0, R).toFixed(2) +
         ' A' + R + ' ' + R + ' 0 0 0 ' + px(a1, R).toFixed(2) + ' ' + py(a1, R).toFixed(2),
      fill: 'none', 'stroke-width': RING, 'stroke-linecap': 'butt'
    }, gRing));
  }

  var eucDot = el('circle', { r: 7, class: 'fm-euclid' }, gMarks);
  var frechetMarks = [];

  var points = [];
  function makePoint(i) {
    var g = el('g', { class: 'fm-pt', tabindex: '0', role: 'slider',
      'aria-valuemin': '0', 'aria-valuemax': '359' }, gPoints);
    el('circle', { r: 18, class: 'fm-hit' }, g);
    el('circle', { r: 6.5, class: 'fm-dot' }, g);
    g.addEventListener('pointerdown', function (e) {
      dragging = points.indexOf(g);
      g.setPointerCapture(e.pointerId);
      g.classList.add('is-dragging');
      e.preventDefault();
    });
    g.addEventListener('pointerup', function () { dragging = -1; g.classList.remove('is-dragging'); });
    g.addEventListener('pointercancel', function () { dragging = -1; g.classList.remove('is-dragging'); });
    g.addEventListener('keydown', function (e) {
      var k = points.indexOf(g), d = e.shiftKey ? 15 : 3;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') theta[k] = wrap(theta[k] + deg2rad(d));
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') theta[k] = wrap(theta[k] - deg2rad(d));
      else return;
      e.preventDefault();
      render();
    });
    return g;
  }

  svg.addEventListener('pointermove', function (e) {
    if (dragging < 0) return;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (Math.abs(p.x - CX) + Math.abs(p.y - CY) < 1) return;
    theta[dragging] = wrap(Math.atan2(CY - p.y, p.x - CX));
    render();
  });

  function syncPoints() {
    while (points.length < theta.length) points.push(makePoint(points.length));
    while (points.length > theta.length) gPoints.removeChild(points.pop());
  }

  function render() {
    syncPoints();

    /* shading of the circle by F */
    var fs = [], fmin = Infinity, fmax = -Infinity;
    for (var s = 0; s < SEGMENTS; s++) {
      var f = frechetF((s + 0.5) * step);
      fs.push(f); if (f < fmin) fmin = f; if (f > fmax) fmax = f;
    }
    var span = fmax - fmin || 1;
    for (s = 0; s < SEGMENTS; s++) {
      segs[s].setAttribute('stroke', mix(Math.pow(1 - (fs[s] - fmin) / span, 1.7)));
    }

    /* ordinary average, in the plane */
    var e = euclideanMean(), rad = Math.hypot(e.x, e.y);
    var ex = CX + R * e.x, ey = CY - R * e.y;
    eucDot.setAttribute('cx', ex.toFixed(2)); eucDot.setAttribute('cy', ey.toFixed(2));

    /* Fréchet mean(s): a pointer just outside the circle, so it never hides a data point */
    var ms = frechetMeans();
    while (frechetMarks.length < ms.length) frechetMarks.push(el('polygon', { class: 'fm-frechet' }, gMarks));
    while (frechetMarks.length > ms.length) gMarks.removeChild(frechetMarks.pop());
    ms.forEach(function (m, i) {
      var tx = -Math.sin(m), ty = -Math.cos(m); /* unit tangent, in screen coordinates */
      var bx = px(m, BASE), by = py(m, BASE);
      frechetMarks[i].setAttribute('points', [
        [px(m, TIP), py(m, TIP)], [bx + HALF * tx, by + HALF * ty], [bx - HALF * tx, by - HALF * ty]
      ].map(function (q) { return q[0].toFixed(2) + ',' + q[1].toFixed(2); }).join(' '));
    });

    /* data points on top */
    theta.forEach(function (t, i) {
      var g = points[i], deg = Math.round(t * 180 / Math.PI) % 360;
      g.setAttribute('transform', 'translate(' + px(t, R).toFixed(2) + ' ' + py(t, R).toFixed(2) + ')');
      g.setAttribute('aria-label', 'Observation ' + (i + 1));
      g.setAttribute('aria-valuenow', String(deg));
      g.setAttribute('aria-valuetext', deg + ' degrees');
    });

    readout.textContent =
      'Ordinary average at radius ' + rad.toFixed(2) + ' (the circle has radius 1). ' +
      (ms.length === 1 ? 'The Fréchet mean is unique.'
                       : 'The Fréchet mean is not unique: ' + ms.length + ' points of the circle tie.');
  }

  /* ------------------------------------------------------------ controls */

  function on(action, fn) {
    var b = fig.querySelector('[data-action="' + action + '"]');
    if (b) b.addEventListener('click', function () { fn(); render(); });
  }
  on('add', function () {
    if (theta.length >= MAX_N) return;
    var e = euclideanMean();
    var base = Math.hypot(e.x, e.y) > 1e-6 ? Math.atan2(e.y, e.x) : 0;
    theta.push(wrap(base + deg2rad(40 + Math.random() * 100) * (Math.random() < 0.5 ? -1 : 1)));
  });
  on('remove', function () { if (theta.length > MIN_N) theta.pop(); });
  on('spread', function () {
    var n = theta.length, a = theta[0];
    theta = theta.map(function (_, i) { return wrap(a + TAU * i / n); });
  });
  on('reset', function () { theta = START.slice(); });

  /* re-read colours if the light/dark preference changes while open */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var again = function () { readColours(); render(); };
    if (mq.addEventListener) mq.addEventListener('change', again);
    else if (mq.addListener) mq.addListener(again);
  }

  readColours();
  render();
  fig.hidden = false;
})();
