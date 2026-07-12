/* ==== GAMASTUDIO — motor ==== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ---- inyectar previews reales de sitios (portafolio) ---- */
(() => {
  const NAMES = { cepa:'CEPA', vialactea:'VÍA LÁCTEA', obtura:'OBTURA', anden:'ANDÉN', anima:'ÁNIMA', helios:'HELIOS', palacio:'CINE PALACIO', copal:'CASA COPAL', niebla:'NIEBLA', minutero:'MINUTERO', neon:'NÉON', cumbre:'CUMBRE', meridiano:'MERIDIANO', lazaro:'LÁZARO', automata:'AUTÓMATA', helice:'HÉLICE', volta:'VOLTA', vivero:'VIVERO', plasma:'PLASMA', vertice:'VÉRTICE', nauta:'NAUTA', miga:'MIGA', noctambula:'NOCTÁMBULA', pigmento:'PIGMENTO', sumi:'SUMI', madrugada:'MADRUGADA', grado:'GRADO', reticula:'RETÍCULA', ruido:'RUIDO', modula:'MODULA', pulso:'PULSO', enjambre:'ENJAMBRE', gravedad:'GRAVEDAD', canon:'CANON', oraculo:'ORÁCULO', vitrea:'VÍTREA', faro:'FARO' };
  const FEATURED = [['cepa','Landing cinemática'],['vialactea','Scrollytelling'],['obtura','Producto interactivo'],['helios','WebGL · shader'],['anima','Showcase 3D'],['palacio','Experiencia Art Déco'],['anden','Scroll narrativo'],['copal','Lujo editorial'],['niebla','Video hero'],['minutero','Zoom infinito'],['cumbre','Scroll ascendente'],['pigmento','Fluidos WebGL']];
  const ALL = ['cepa','obtura','vialactea','anden','anima','helios','palacio','copal','niebla','minutero','neon','cumbre','meridiano','lazaro','automata','helice','volta','vivero','plasma','vertice','nauta','miga','noctambula','pigmento','sumi','madrugada','grado','reticula','ruido','modula','pulso','enjambre','gravedad','canon','oraculo','vitrea','faro'];
  const track = document.getElementById('prTrack'), gal = document.getElementById('galGrid');
  if (track) track.innerHTML = FEATURED.map(([s, t]) => `<article class="work-card tilt"><div class="wc-bar"><span class="wc-dot r"></span><span class="wc-dot"></span><span class="wc-dot"></span><span class="wc-url">gamastudio.mx/${s}</span></div><div class="wc-shot"><img src="assets/work/${s}.jpg" alt="Sitio ${NAMES[s]}" loading="eager"></div><div class="wc-meta"><span class="wc-name">${NAMES[s]}</span><span class="wc-type">${t}</span></div></article>`).join('');
  if (gal) gal.innerHTML = ALL.map(s => `<div class="gal-item"><img src="assets/work/${s}.jpg" alt="${NAMES[s]}" loading="lazy"><span class="gi-name">${NAMES[s]}</span></div>`).join('');
})();

/* cursor custom + glow */
(() => {
  if (!fine) return;
  document.body.classList.add('pointer-fine');
  const dot = document.getElementById('cursor'), glow = document.getElementById('cursorGlow');
  let tx = innerWidth / 2, ty = innerHeight / 2, gx = tx, gy = ty;
  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
  }, { passive: true });
  (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.querySelectorAll('a,button,.magnetic,.tilt').forEach(el => {
    el.addEventListener('pointerenter', () => dot.classList.add('big'));
    el.addEventListener('pointerleave', () => dot.classList.remove('big'));
  });
})();

/* nav scrolled */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

/* APERTURA — canvas que ecoa el logo (radial rojo reactivo al mouse) */
function aperture(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 1.6);
  let W, H, mx = .5, my = .5, tmx = .5, tmy = .5;
  function size() { W = canvas.width = canvas.clientWidth * DPR; H = canvas.height = canvas.clientHeight * DPR; }
  addEventListener('resize', size); size();
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });
  let vis = true;
  new IntersectionObserver(es => vis = es[0].isIntersecting).observe(canvas);
  const RINGS = 3, LINES = opts.lines || 40, DOTS = 6, t0 = performance.now();
  function frame(now) {
    if (vis && !document.hidden) {
      mx += (tmx - mx) * .05; my += (tmy - my) * .05;
      const t = reduce ? 0 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2 + (mx - .5) * W * .12, cy = H / 2 + (my - .5) * H * .12;
      const R = Math.min(W, H) * (opts.scale || .42);
      ctx.globalCompositeOperation = 'lighter';
      // anillos
      for (let i = 1; i <= RINGS; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * (i / RINGS), 0, 6.283); ctx.strokeStyle = `rgba(239,68,68,${.05 + i * .015})`; ctx.lineWidth = DPR; ctx.stroke(); }
      // líneas radiales
      for (let i = 0; i < LINES; i++) {
        const a = (i / LINES) * 6.283 + t * .12;
        const len = R * (.55 + .45 * Math.abs(Math.sin(i * 1.7 + t * .6)));
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.strokeStyle = `rgba(239,68,68,${.06 + .06 * Math.abs(Math.sin(i + t))})`; ctx.lineWidth = DPR; ctx.stroke();
      }
      // dots orbitando
      for (let i = 0; i < DOTS; i++) {
        const a = t * (.3 + i * .12) + i * 2.1, r = R * (.35 + i * .11);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * DPR);
        g.addColorStop(0, i % 2 ? 'rgba(252,165,165,.9)' : 'rgba(239,68,68,.9)'); g.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16 * DPR, 0, 6.283); ctx.fill();
      }
      // núcleo
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .3);
      cg.addColorStop(0, 'rgba(252,165,165,.5)'); cg.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R * .3, 0, 6.283); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const apHero = document.getElementById('aperture'); if (apHero) aperture(apHero, { lines: 44, scale: .42 });
const apCta = document.getElementById('apertureCta'); if (apCta) aperture(apCta, { lines: 30, scale: .5 });

/* headline cinético (palabras suben con blur) — sin romper el span de gradiente */
(() => {
  const el = document.querySelector('[data-kinetic]');
  if (!el) return;
  const targets = [];
  [...el.childNodes].forEach(node => {
    if (node.nodeType === 3) { // texto suelto → partir en palabras
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(tok => {
        if (tok.trim()) { const s = document.createElement('span'); s.className = 'word'; s.textContent = tok; frag.appendChild(s); targets.push(s); }
        else frag.appendChild(document.createTextNode(tok));
      });
      el.replaceChild(frag, node);
    } else if (node.nodeName === 'BR') { /* conservar salto */ }
    else if (node.classList) { node.classList.add('word'); targets.push(node); } // el <span class="grad"> anima COMPLETO
  });
  if (reduce) return;
  gsap.set(targets, { yPercent: 115, opacity: 0, filter: 'blur(8px)' });
  gsap.to(targets, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: .9, stagger: .05, ease: 'power3.out', delay: .15 });
})();

/* reveals */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '-8%' });
  document.querySelectorAll('.sec-head,.srv-card,.step,.price-card,.gal-item').forEach(el => { el.setAttribute('data-reveal', ''); io.observe(el); });
  requestAnimationFrame(() => document.querySelectorAll('[data-reveal]').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('in'); }));
})();

/* tilt 3D */
(() => {
  if (!fine || reduce) return;
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.transform = `perspective(700px) rotateX(${((e.clientY - r.top) / r.height - .5) * -6}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 6}deg) translateY(-4px)`; });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
})();

/* magnéticos */
(() => {
  if (!fine || reduce) return;
  document.querySelectorAll('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
})();

/* counters */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', money = to >= 1000, t0 = performance.now();
    (function s(now) { const k = Math.min(1, (now - t0) / 1300), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = (money ? v.toLocaleString('en-US') : v) + suf; if (k < 1) requestAnimationFrame(s); })(t0);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => { if (reduce) { const to = +el.dataset.count; el.textContent = (to >= 1000 ? to.toLocaleString('en-US') : to) + (el.dataset.suffix || ''); } else io.observe(el); });
})();

/* toolset marquee */
(() => {
  const tr = document.getElementById('mqTrack'); if (!tr) return;
  const tools = ['Figma', 'Illustrator', 'Photoshop', 'After Effects', 'Webflow', 'Framer', 'Blender', 'Lottie', 'Spline', 'InDesign', 'Premiere', 'Notion'];
  const one = tools.map(t => `<span class="tool">${t}</span>`).join('');
  tr.innerHTML = one + one;
  if (reduce) tr.style.animation = 'none';
})();

/* PROYECTOS — scroll horizontal pinneado */
(() => {
  const pin = document.getElementById('prPin'), track = document.getElementById('prTrack');
  if (!pin || !track || reduce || innerWidth <= 820) return;
  gsap.to(track, {
    x: () => -(track.scrollWidth - pin.clientWidth + 50),
    ease: 'none',
    scrollTrigger: {
      trigger: '.proyectos', start: 'top top',
      end: () => '+=' + (track.scrollWidth - pin.clientWidth + 50),
      scrub: .6, pin: pin, anticipatePin: 1, invalidateOnRefresh: true
    }
  });
})();

/* ---- HERO: campo 3D de sitios reales (parallax + deriva) ---- */
(() => {
  const field = document.getElementById('field'); if (!field) return;
  const IMGS = ['helios','anima','palacio','copal','niebla','cumbre','pigmento','plasma','minutero','obtura','anden','vialactea'];
  const SPOTS = [[4,16,.9],[13,60,.55],[1,40,.35],[20,4,.5],[7,83,.72],[24,38,.32],[80,10,.5],[90,58,.85],[74,82,.6],[95,32,.38],[84,46,.32],[70,26,.45]];
  const cards = SPOTS.map(([x, y, d], i) => {
    const c = document.createElement('div'); c.className = 'fcard';
    const w = 90 + d * 132;
    c.style.cssText = `left:${x}%;top:${y}%;width:${w}px;height:${Math.round(w * .62)}px;filter:blur(${((1 - d) * 3).toFixed(1)}px) brightness(${(.5 + d * .5).toFixed(2)});z-index:${Math.round(d * 10)}`;
    c.innerHTML = `<img src="assets/work/${IMGS[i % IMGS.length]}.jpg" alt="" loading="eager">`;
    c._d = d; c._ph = i * 1.7; field.appendChild(c);
    setTimeout(() => c.style.opacity = (.32 + d * .5).toFixed(2), 350 + i * 80);
    return c;
  });
  let tmx = .5, tmy = .5, mx = .5, my = .5;
  if (fine) addEventListener('pointermove', e => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });
  const t0 = performance.now();
  (function loop(now) {
    mx += (tmx - mx) * .06; my += (tmy - my) * .06;
    const t = reduce ? 0 : (now - t0) / 1000;
    for (const c of cards) {
      const dx = (mx - .5) * -c._d * 46 + (reduce ? 0 : Math.sin(t * .3 + c._ph) * 8 * c._d);
      const dy = (my - .5) * -c._d * 46 + (reduce ? 0 : Math.cos(t * .25 + c._ph) * 8 * c._d);
      c.style.transform = `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0)`;
    }
    requestAnimationFrame(loop);
  })(performance.now());
})();

/* ---- HERO: el navegador que se construye solo ---- */
(() => {
  const builder = document.getElementById('builder'), site = document.getElementById('site');
  if (!builder || !site || typeof gsap === 'undefined') return;
  const bwUrl = document.getElementById('bwUrl'), bwStatus = document.getElementById('bwStatus'),
    sImg = document.getElementById('sImg'), tint = document.getElementById('tint'), bcur = document.getElementById('bcursor');
  const boxes = gsap.utils.toArray('#site .s-box');
  const fills = '#site .fill, #site .s-h1, #site .s-h2, #site .s-btn';
  const SITES = [['cepa','gamastudio.mx/cepa'],['vialactea','gamastudio.mx/vialactea'],['obtura','gamastudio.mx/obtura'],['palacio','gamastudio.mx/palacio'],['helios','gamastudio.mx/helios']];
  if (fine && !reduce) {
    const bw = builder.querySelector('.bw');
    builder.addEventListener('pointermove', e => { const r = builder.getBoundingClientRect(); bw.style.transform = `rotateY(${((e.clientX - r.left) / r.width - .5) * 7}deg) rotateX(${((e.clientY - r.top) / r.height - .5) * -7}deg)`; });
    builder.addEventListener('pointerleave', () => bw.style.transform = '');
  }
  if (reduce) { gsap.set(fills, { opacity: 1 }); gsap.set(sImg, { opacity: 1 }); gsap.set(boxes, { borderColor: 'rgba(255,255,255,.07)' }); site.classList.add('built'); bwStatus.textContent = 'publicado ✓'; return; }
  let idx = 0, vis = true;
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(builder);
  function build() {
    if (!vis || document.hidden) { setTimeout(build, 700); return; }
    const [slug, url] = SITES[idx % SITES.length]; idx++;
    site.classList.remove('built');
    const tl = gsap.timeline({ onComplete: () => setTimeout(build, 2400) });
    tl.add(() => bwStatus.textContent = 'construyendo…')
      .set(boxes, { scaleX: 0, transformOrigin: 'left center', borderColor: 'rgba(239,68,68,.55)', opacity: 1 })
      .set(fills, { opacity: 0 }).set(sImg, { opacity: 0 }).set(tint, { opacity: 0 }).set(bcur, { opacity: 0 })
      .to(boxes, { scaleX: 1, duration: .5, stagger: .05, ease: 'power2.out' })
      .add(() => sImg.src = 'assets/work/' + slug + '.jpg')
      .to(sImg, { opacity: 1, duration: .5 }, '+=.05')
      .add(() => { site.classList.add('built'); bwUrl.textContent = url; })
      .to(fills, { opacity: 1, duration: .45, stagger: .035 }, '<')
      .to(boxes, { borderColor: 'rgba(255,255,255,.07)', duration: .4 }, '<')
      .fromTo(tint, { opacity: .55, xPercent: -35 }, { opacity: 0, xPercent: 35, duration: .7, ease: 'power1.inOut' })
      .add(() => bwStatus.textContent = 'publicado ✓')
      .set(bcur, { opacity: 1, left: '55%', top: '42%' })
      .add(() => { const b = document.querySelector('.s-btn').getBoundingClientRect(), body = document.querySelector('.bw-body').getBoundingClientRect(); gsap.to(bcur, { left: b.left + b.width / 2 - body.left, top: b.top + b.height / 2 - body.top, duration: .5, ease: 'power2.inOut' }); })
      .to({}, { duration: .55 })
      .to('.s-btn', { scale: .93, duration: .1, yoyo: true, repeat: 1, transformOrigin: 'center' })
      .to(bcur, { opacity: 0, duration: .3 }, '+=.15');
  }
  build();
})();
