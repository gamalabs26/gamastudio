/* ==== GAMASTUDIO — ACTO 1: secuencia cinematográfica Seedance scrubeada con el scroll ====
   El scroll reproduce cuadro a cuadro: (1) "GamaStudio" → (2) morph a ícono → (3) dive-in de
   partículas → (4) ADN de frente que gira → (5) PULL-BACK: el ADN se aleja y revela el monitor
   sobre el escritorio. Encima, overlays HTML (copy + cards del proceso).
   1–61 dive · 61–149 rotación · 149–215 pull-back. El pull-back ocupa la ÚLTIMA pantalla del hero
   (la zona donde el sticky sale de vista), que ANTES quedaba con la hélice CONGELADA + una línea de
   división visible. Al terminar (frame 215, escritorio revelado) cede el canvas a app.js, que fija
   el escritorio y muestra el showcase del portafolio. El dive+rotación queda idéntico al de antes;
   sólo se añadió el pull-back en esa pantalla muerta. */
(() => {
  const section = document.getElementById('proceso');
  const canvas = document.getElementById('dnaCanvas');
  if (!section || !canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx) { section.classList.add('dna-nogl'); return; }

  const N = 149, PB_END = 215, PAD = 'assets/dna/frames/';   // 1–61 dive · 61–149 rotación · 149–215 pull-back al escritorio
  const F0 = 0.15;                                      // el video (Seedance) arranca tras el morph de partículas (p=0.15)
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = x => Math.max(0, Math.min(1, x));
  // PB_START = p donde el sticky del hero EMPIEZA A SALIR (fin de la rotación). De ahí a p=1 va el
  // pull-back, aprovechando la última pantalla del hero (antes: hélice congelada). Con el calcProg de
  // abajo (denominador = offsetHeight), el frame 149 cae en el MISMO scroll que antes → dive/rotación idénticos.
  const PB_START = () => clamp((section.offsetHeight - innerHeight) / Math.max(1, section.offsetHeight));
  const pAt = k => F0 + (PB_START() - F0) * ((k - 1) / (N - 1));   // p del cuadro k dentro del dive+rotación
  const FRONT = () => pAt(61);                          // p donde el ADN queda de frente

  const imgs = new Array(PB_END + 1); let loaded = 0, ready = false, curImg = null;
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
  for (let i = 1; i <= PB_END; i++) {
    const im = new Image();
    im.onload = () => { loaded++; if (!ready && (loaded > 4 || i === 1)) { ready = true; resize(); } };
    im.src = `${PAD}f_${String(i).padStart(3, '0')}.jpg`;
    imgs[i] = im;
  }
  // frame según p: [F0..PB_START] dive+rotación 1→149 · [PB_START..1] pull-back 149→215
  function frameIdx(p) {
    const pbs = PB_START();
    if (p <= pbs) return 1 + Math.round(clamp((p - F0) / (pbs - F0)) * (N - 1));
    return N + Math.round(clamp((p - pbs) / (1 - pbs)) * (PB_END - N));
  }
  function renderFrame(p) {
    const idx = frameIdx(p), im = imgs[idx];
    if (im && im.complete && im.naturalWidth) drawCover(im);
    else for (let d = 1; d < PB_END; d++) { const a = imgs[idx - d], b = imgs[idx + d]; if (a && a.complete) { drawCover(a); break; } if (b && b.complete) { drawCover(b); break; } }
  }

  /* cards que VIAJAN por el ADN: abajo-izq → grande al centro → arriba-der (terminan ANTES del pull-back) */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  const intro = section.querySelector('.dna-intro');
  const overlay = section.querySelector('.hero-overlay');
  const veilEl = section.querySelector('.hero-veil');   // viñeta del hero: su borde var(--bg) creaba una línea oscura en el límite con #proyectos durante el pull-back
  const cue = document.getElementById('heroCue');
  const WIN = 0.30, STEP = (1 - WIN) / (nCards - 1);
  function updateCards(p) {
    const CST = FRONT() + 0.03, CEND = PB_START() - 0.01;   // cards entre el ADN de frente y justo antes del pull-back
    const cp = clamp((p - CST) / (CEND - CST));
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
    // Cede el canvas a app.js SOLO cuando #proyectos ya se fijó (scroll CRUDO = 1). Hasta ahí dna.js
    // dibuja TODO, incluido el pull-back → no hay hélice congelada ni línea de división. Se usa el
    // scroll crudo (calcProg), NO el prog suavizado, para que con scroll rápido no peleen los dos scripts.
    if (calcProg() >= 0.9995) return;
    const cop = sstep(0.14, 0.16, p);                    // el video toma la escena tras el morph
    canvas.style.opacity = cop.toFixed(3);
    canvas.style.visibility = cop > 0.001 ? 'visible' : 'hidden';
    if (ready) renderFrame(p);
    // copy del hero: se sostiene durante el morph y se disuelve en la transición al ADN
    if (overlay) {
      const g = sstep(0.14, 0.185, p);
      overlay.style.opacity = (1 - g).toFixed(3);
      overlay.style.transform = `translateX(-50%) translateY(${(g * 16).toFixed(0)}px)`;
      overlay.style.pointerEvents = g > 0.5 ? 'none' : 'auto';
    }
    if (cue) cue.style.opacity = (1 - clamp(p / 0.05)).toFixed(3);
    // la viñeta se desvanece antes del pull-back → sin línea oscura en el borde con #proyectos. Se ata al scroll
    // CRUDO (calcProg), no al prog suavizado: con scroll rápido el suavizado se rezaga y la viñeta seguiría opaca en el borde.
    if (veilEl) { const pbs = PB_START(); veilEl.style.opacity = (1 - sstep(pbs - 0.15, pbs - 0.02, calcProg())).toFixed(3); }
    // intro del proceso: entra cuando el ADN ya está de frente, antes de las cards
    if (intro) {
      const front = FRONT(), cst = front + 0.03;
      const io = sstep(front - 0.03, front + 0.02, p) * (1 - sstep(cst - 0.02, cst + 0.05, p));
      intro.style.opacity = io.toFixed(3);
      intro.style.transform = `translateX(-50%) translateY(${((1 - io) * 18).toFixed(0)}px)`;
    }
    updateCards(p);
  }

  /* progreso CRUDO desde la geometría: 0 al inicio del hero, 1 cuando #proyectos se fija (fin de la
     sección). Incluye la última pantalla (salida del sticky), donde ahora va el pull-back. */
  function calcProg() {
    const rect = section.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, section.offsetHeight));
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
