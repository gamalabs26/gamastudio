/* ==== GAMASTUDIO — ACTO 1: secuencia cinematográfica Seedance scrubeada con el scroll ====
   Todo el visual es VIDEO (Codex + Seedance), NO canvas/partículas/matemática. El scroll
   reproduce cuadro a cuadro: (1) aparece "GamaStudio" → (2) morph a ícono → (3) dive-in de
   partículas → (4) ADN de frente que gira. Encima, overlays HTML (copy + cards del proceso).
   Frames: 1–49 palabra→ícono · 49–110 ícono→ADN (dive) · 110–198 rotación del ADN. */
(() => {
  const section = document.getElementById('proceso');
  const canvas = document.getElementById('dnaCanvas');
  if (!section || !canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx) { section.classList.add('dna-nogl'); return; }

  const N = 149, PAD = 'assets/dna/frames/';           // 1–61 dive ícono→ADN · 61–149 rotación del ADN
  const F0 = 0.15, FSPAN = 0.83;                        // el video (Seedance) arranca tras el morph de partículas (p=0.15)
  const FRONT = F0 + FSPAN * (60 / (N - 1));            // p donde el ADN queda de frente (~0.49)
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = x => Math.max(0, Math.min(1, x));

  const imgs = new Array(N + 1); let loaded = 0, ready = false, curImg = null;
  function drawCover(img) {
    if (!img || !img.complete || !img.naturalWidth) return; curImg = img;
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.clearRect(0, 0, cw, ch); ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function resize() {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    if (curImg) drawCover(curImg);
  }
  addEventListener('resize', resize); resize();
  for (let i = 1; i <= N; i++) {
    const im = new Image();
    im.onload = () => { loaded++; if (!ready && (loaded > 4 || i === 1)) { ready = true; resize(); } };
    im.src = `${PAD}f_${String(i).padStart(3, '0')}.jpg`;
    imgs[i] = im;
  }
  function renderFrame(p) {
    const fp = clamp((p - F0) / FSPAN), idx = 1 + Math.round(fp * (N - 1)), im = imgs[idx];
    if (im && im.complete && im.naturalWidth) drawCover(im);
    else for (let d = 1; d < N; d++) { const a = imgs[idx - d], b = imgs[idx + d]; if (a && a.complete) { drawCover(a); break; } if (b && b.complete) { drawCover(b); break; } }
  }

  /* cards que VIAJAN por el ADN: abajo-izq → grande al centro → arriba-der */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  const intro = section.querySelector('.dna-intro');
  const overlay = section.querySelector('.hero-overlay');
  const cue = document.getElementById('heroCue');
  const CST = FRONT + 0.05, WIN = 0.30, STEP = (1 - WIN) / (nCards - 1);   // cards tras quedar el ADN de frente
  function updateCards(p) {
    const cp = clamp((p - CST) / (0.985 - CST));
    const Xmax = Math.min(innerWidth * 0.30, 360), Ymax = innerHeight * 0.34;
    cards.forEach((c, i) => {
      const u = (cp - i * STEP) / WIN;
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

  function apply(p) {
    window.__ACT1P = p;                                  // lo leen las partículas del logo (hero3d.js)
    canvas.style.opacity = sstep(0.14, 0.16, p).toFixed(3);   // el video (ícono de partículas → ADN) toma la escena tras el morph
    if (ready) renderFrame(p);
    // copy del hero: presente al inicio, se desliza y sale mientras la palabra se deshace (movimiento, no zoom)
    if (overlay) {
      const g = sstep(0.02, 0.14, p);
      overlay.style.opacity = (1 - g).toFixed(3);
      overlay.style.transform = `translateX(-50%) translateY(${(g * 70).toFixed(0)}px)`;
      overlay.style.pointerEvents = g > 0.5 ? 'none' : 'auto';
    }
    if (cue) cue.style.opacity = (1 - clamp(p / 0.05)).toFixed(3);
    // intro del proceso: entra cuando el ADN ya está de frente, antes de las cards
    if (intro) {
      const io = sstep(FRONT - 0.03, FRONT + 0.02, p) * (1 - sstep(CST - 0.02, CST + 0.05, p));
      intro.style.opacity = io.toFixed(3);
      intro.style.transform = `translateX(-50%) translateY(${((1 - io) * 18).toFixed(0)}px)`;
    }
    updateCards(p);
  }

  /* progreso desde la geometría real del sticky + loop rAF suavizado */
  function calcProg() {
    const rect = section.getBoundingClientRect();
    const total = Math.max(1, section.offsetHeight - innerHeight);
    return clamp(-rect.top / total);
  }
  let prog = 0, active = true, raf = 0;
  function tick() {
    const target = calcProg();
    prog += (target - prog) * 0.16;
    if (Math.abs(target - prog) < 0.0004) prog = target;
    apply(prog);
    if (active || Math.abs(target - prog) > 0.0004) raf = requestAnimationFrame(tick); else raf = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  new IntersectionObserver(e => { active = e[0].isIntersecting; if (active) kick(); }, { rootMargin: '300px' }).observe(section);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { resize(); kick(); });
  apply(0);
})();
