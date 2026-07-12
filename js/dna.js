/* ==== GAMASTUDIO — Fase 2: ADN fotorreal (video Seedance) scrubeado con el scroll ====
   La doble hélice fotorrealista (imagen maestra Codex → órbita cinematográfica Seedance)
   se reproduce cuadro a cuadro CON el scroll: girar = deslizar. Encima, el intro se
   desvanece y van emergiendo las 7 cards del proceso, alternando lados. */
(() => {
  const canvas = document.getElementById('dnaCanvas');
  const section = document.getElementById('proceso');
  if (!canvas || !section) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduce || !ctx || typeof ScrollTrigger === 'undefined') { section.classList.add('dna-nogl'); return; }

  const N = 88, PAD = 'assets/dna/frames/';
  const imgs = new Array(N + 1); let loaded = 0, ready = false, curImg = null;
  const dpr = Math.min(devicePixelRatio || 1, 2);

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

  // precarga de cuadros; arranca el scrub apenas hay suficientes
  for (let i = 1; i <= N; i++) {
    const im = new Image();
    im.onload = () => { loaded++; if (!ready && (loaded > 6 || i === 1)) { ready = true; resize(); render(); } };
    im.src = `${PAD}f_${String(i).padStart(3, '0')}.jpg`;
    imgs[i] = im;
  }

  /* cards del proceso */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  const intro = section.querySelector('.dna-intro');
  function updateCards(p) {
    const cp = Math.min(1, Math.max(0, (p - 0.16) / 0.80));
    cards.forEach((c, i) => {
      const center = (i + 0.5) / nCards, dist = Math.abs(cp - center) * nCards;
      const o = Math.max(0, 1 - dist * 1.3);
      c.style.opacity = o.toFixed(3);
      const off = (1 - o) * 40, sc = 0.94 + o * 0.06;
      c.style.transform = `translateY(-50%) translateX(${c.dataset.side === 'r' ? off : -off}px) scale(${sc.toFixed(3)})`;
      c.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
    });
  }

  let prog = 0;
  function frameFor(p) {
    const fp = Math.min(1, Math.max(0, (p - 0.05) / 0.92));   // pequeño hold al entrar (entrada del túnel)
    return 1 + Math.round(fp * (N - 1));
  }
  function render() {
    const idx = frameFor(prog);
    const im = imgs[idx];
    if (im && im.complete && im.naturalWidth) drawCover(im);
    else { for (let d = 1; d < N; d++) { const a = imgs[idx - d], b = imgs[idx + d]; if (a && a.complete) { drawCover(a); break; } if (b && b.complete) { drawCover(b); break; } } }
  }

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', scrub: .5,
    onUpdate: self => {
      prog = self.progress;
      if (ready) render();
      updateCards(prog);
      if (intro) intro.style.opacity = (1 - Math.min(1, prog * 4.5)).toFixed(3);
    }
  });
  updateCards(0);

  addEventListener('load', () => ScrollTrigger.refresh());
})();
