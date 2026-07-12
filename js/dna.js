/* ==== GAMASTUDIO — ACTO 1: hero partículas → dive-in → ADN (una sola secuencia) ====
   Controlador único. Lee el progreso de la sección (#proceso/.act1) por geometría real y orquesta:
   - las partículas del logo (hero3d.js las lee de window.__ACT1P): ícono→wordmark→dive-in
   - el ADN fotorreal (frames Seedance) que APARECE por debajo mientras las partículas vuelan (dive)
   - túnel de luz (flash) + el ADN entra en vista AXIAL (la "O") y rota a FRONTAL
   - las 7 cards del proceso que VIAJAN por el ADN (abajo-izq → centro → arriba-der).
   Todo en un mismo stage fijo → es adentrarse, no cambiar de sección. */
(() => {
  const section = document.getElementById('proceso');
  const canvas = document.getElementById('dnaCanvas');
  if (!section || !canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx) { section.classList.add('dna-nogl'); window.__ACT1P = 0; return; }

  const N = 88, PAD = 'assets/dna/frames/';           // solo rotación FRONTAL (el ADN empieza de frente)
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = x => Math.max(0, Math.min(1, x));

  /* línea de tiempo (p sobre toda la sección) — entrada por MORPH de partículas, sin zoom/fade */
  const MAT = 0.30;                                    // punto de materialización (partículas → ADN fotorreal)
  const FRAME_START = MAT, FRAME_SPAN = 0.66;          // el ADN (ya de frente) gira de p=0.30 a 0.96

  /* precarga de frames */
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
    im.onload = () => { loaded++; if (!ready && (loaded > 6 || i === 1)) { ready = true; resize(); } };
    im.src = `${PAD}f_${String(i).padStart(3, '0')}.jpg`;
    imgs[i] = im;
  }
  function renderFrame(dp) {
    const idx = 1 + Math.round(clamp(dp) * (N - 1)), im = imgs[idx];
    if (im && im.complete && im.naturalWidth) drawCover(im);
    else for (let d = 1; d < N; d++) { const a = imgs[idx - d], b = imgs[idx + d]; if (a && a.complete) { drawCover(a); break; } if (b && b.complete) { drawCover(b); break; } }
  }

  /* cards que VIAJAN por el ADN */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  const intro = section.querySelector('.dna-intro');
  const overlay = section.querySelector('.hero-overlay');
  const cue = document.getElementById('heroCue');
  const flash = document.getElementById('dnaFlash');
  const CST = MAT + 0.08, WIN = 0.30, STEP = (1 - WIN) / (nCards - 1);   // cards arrancan tras materializar
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
    window.__ACT1P = p;                                   // lo leen las partículas (hero3d.js)
    if (ready) renderFrame((p - FRAME_START) / FRAME_SPAN);
    // materialización: el ADN fotorreal aparece RÁPIDO justo en el pico del destello (no fade lento, no zoom)
    canvas.style.opacity = sstep(MAT - 0.02, MAT + 0.03, p).toFixed(3);
    if (flash) flash.style.opacity = (sstep(MAT - 0.06, MAT, p) * (1 - sstep(MAT, MAT + 0.08, p))).toFixed(3);  // destello que tapa la costura
    if (overlay) overlay.style.opacity = (1 - sstep(0.08, 0.15, p)).toFixed(3);     // bienvenida se va al iniciar el morph
    if (cue) cue.style.opacity = (1 - clamp(p / 0.05)).toFixed(3);
    if (intro) intro.style.opacity = (sstep(MAT + 0.02, MAT + 0.08, p) * (1 - sstep(MAT + 0.10, MAT + 0.18, p))).toFixed(3);
    updateCards(p);
  }

  /* progreso desde la geometría real (inmune a pins) + loop rAF suavizado */
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
