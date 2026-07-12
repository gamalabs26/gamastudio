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

  const N = 149, TRANS = 61, PAD = 'assets/dna/frames/';
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = x => Math.max(0, Math.min(1, x));

  /* línea de tiempo (p sobre toda la sección) */
  const FRAME_START = 0.24, FRAME_SPAN = 0.72;        // el ADN se scrubea de p=0.24 a 0.96
  const transEndDp = (TRANS - 1) / (N - 1);
  const frontP = FRAME_START + transEndDp * FRAME_SPAN; // p donde llegamos a la vista frontal (~0.53)

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
  const CST = frontP + 0.02, WIN = 0.30, STEP = (1 - WIN) / (nCards - 1);
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
    canvas.style.opacity = sstep(0.15, 0.26, p).toFixed(3);           // el ADN APARECE mientras las partículas vuelan
    canvas.style.transform = `scale(${(1 + 0.16 * (1 - sstep(0.15, 0.34, p))).toFixed(3)})`;  // dive: zoom-out al entrar
    if (flash) flash.style.opacity = (sstep(0.16, 0.24, p) * (1 - sstep(0.24, 0.35, p))).toFixed(3);  // túnel de luz
    if (overlay) overlay.style.opacity = (1 - sstep(0.09, 0.16, p)).toFixed(3);     // texto de bienvenida se va en el dive
    if (cue) cue.style.opacity = (1 - clamp(p / 0.06)).toFixed(3);
    if (intro) intro.style.opacity = (sstep(frontP - 0.10, frontP - 0.02, p) * (1 - sstep(frontP + 0.03, frontP + 0.13, p))).toFixed(3);
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
