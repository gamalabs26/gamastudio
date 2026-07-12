/* ==== GAMASTUDIO — Fase 2: ADN fotorreal (video Seedance) scrubeado con el scroll ====
   Storytelling: el dive-in de partículas (túnel de luz) desemboca en la vista AXIAL del ADN
   (la "O" girando, como entrar por el eje) y la cámara rota hasta verlo de FRENTE. De ahí,
   la hélice sigue girando y las 7 cards del proceso VIAJAN por el ADN: nacen abajo-izquierda,
   crecen al centro y se esconden arriba-derecha, una tras otra.
   Frames: 1..61 = transición axial→frontal · 62..149 = rotación de frente.
   El progreso se lee de la GEOMETRÍA real del sticky (inmune a los spacers de otros pins). */
(() => {
  const canvas = document.getElementById('dnaCanvas');
  const section = document.getElementById('proceso');
  if (!canvas || !section) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx) { section.classList.add('dna-nogl'); return; }

  const N = 149, TRANS = 61, PAD = 'assets/dna/frames/';
  const transEndP = 0.05 + 0.92 * (TRANS - 1) / (N - 1);        // progreso donde llegamos a la vista frontal (~0.42)
  const imgs = new Array(N + 1); let loaded = 0, ready = false, curImg = null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function drawCover(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    curImg = img;
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function resize() {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    if (curImg) drawCover(curImg);
  }
  addEventListener('resize', resize);

  for (let i = 1; i <= N; i++) {
    const im = new Image();
    im.onload = () => { loaded++; if (!ready && (loaded > 6 || i === 1)) { ready = true; resize(); } };
    im.src = `${PAD}f_${String(i).padStart(3, '0')}.jpg`;
    imgs[i] = im;
  }

  /* cards que VIAJAN por el ADN */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  const intro = section.querySelector('.dna-intro');
  const flash = document.getElementById('dnaFlash');
  const CST = transEndP + 0.03, WIN = 0.30, STEP = (1 - WIN) / (nCards - 1);
  function updateCards(p) {
    const cp = Math.min(1, Math.max(0, (p - CST) / (0.99 - CST)));
    const Xmax = Math.min(innerWidth * 0.30, 360), Ymax = innerHeight * 0.34;
    cards.forEach((c, i) => {
      const u = (cp - i * STEP) / WIN;                          // 0=abajo-izq · 0.5=centro · 1=arriba-der
      if (u <= -0.05 || u >= 1.05) { if (c.style.opacity !== '0') { c.style.opacity = '0'; c.style.pointerEvents = 'none'; } return; }
      const x = (-1 + 2 * u) * Xmax, y = (1 - 2 * u) * Ymax;
      const sc = 0.6 + 0.5 * Math.sin(Math.max(0, Math.min(1, u)) * Math.PI);
      const o = sstep(0, 0.16, u) * sstep(1, 0.84, u);
      c.style.opacity = o.toFixed(3);
      c.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      c.style.zIndex = String(Math.round(sc * 100));
      c.style.pointerEvents = o > 0.7 ? 'auto' : 'none';
    });
  }

  function frameFor(p) {
    const fp = Math.min(1, Math.max(0, (p - 0.03) / 0.94));
    return 1 + Math.round(fp * (N - 1));
  }
  function render(p) {
    const idx = frameFor(p), im = imgs[idx];
    if (im && im.complete && im.naturalWidth) drawCover(im);
    else for (let d = 1; d < N; d++) { const a = imgs[idx - d], b = imgs[idx + d]; if (a && a.complete) { drawCover(a); break; } if (b && b.complete) { drawCover(b); break; } }
  }
  function apply(p) {
    if (ready) render(p);
    updateCards(p);
    if (intro) intro.style.opacity = (sstep(transEndP - 0.14, transEndP - 0.02, p) * (1 - sstep(transEndP + 0.02, transEndP + 0.14, p))).toFixed(3);
    if (flash) flash.style.opacity = (1 - Math.min(1, p / 0.06)).toFixed(3);          // ADN emerge de la luz (vista axial)
    canvas.style.transform = `scale(${(1 + 0.12 * (1 - Math.min(1, p / 0.05))).toFixed(3)})`;   // dive: leve zoom-out al entrar
  }

  /* progreso desde la geometría real del sticky (no depende de ScrollTrigger) */
  function calcProg() {
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, section.offsetHeight - innerHeight);
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  let prog = 0, target = 0, active = false, raf = 0;
  function tick() {
    target = calcProg();
    prog += (target - prog) * 0.16;
    if (Math.abs(target - prog) < 0.0004) prog = target;
    apply(prog);
    if (active || Math.abs(target - prog) > 0.0004) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  new IntersectionObserver(e => { active = e[0].isIntersecting; if (active) kick(); }, { rootMargin: '200px' }).observe(section);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { resize(); kick(); });
  apply(0);
})();
