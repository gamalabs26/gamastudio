/* ==== GAMASTUDIO — partículas del logo: "GamaStudio" (wordmark) → (scroll) morphea al ÍCONO ====
   Canvas de utilidad (morph del logo + mouse-over), NO un visual cinematográfico. Al terminar el
   morph, el ícono de partículas se congela y el video Seedance (que arranca justo de ese cuadro)
   toma la escena para el dive al ADN. Progreso compartido vía window.__ACT1P (lo pone dna.js). */
(() => {
  const canvas = document.getElementById('logo3d');
  const fallback = document.querySelector('.logo-fallback');
  if (!canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const testGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const bail = () => { canvas.style.display = 'none'; if (fallback) fallback.style.display = 'block'; };
  if (reduce || !testGL || typeof THREE === 'undefined') { bail(); return; }
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const ICON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 4 44 44' width='440' height='440'>
    <defs><radialGradient id='gl' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='#EF4444' stop-opacity='0.4'/><stop offset='100%' stop-color='#EF4444' stop-opacity='0'/></radialGradient>
    <filter id='bl' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='2.2' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs>
    <circle cx='22' cy='26' r='13' fill='url(#gl)'/>
    <line x1='22' y1='26' x2='22' y2='13' stroke='#EF4444' stroke-width='1.6' stroke-linecap='round' opacity='0.9'/>
    <line x1='22' y1='26' x2='35' y2='26' stroke='#EF4444' stroke-width='1.6' stroke-linecap='round' opacity='0.85'/>
    <line x1='22' y1='26' x2='22' y2='39' stroke='#EF4444' stroke-width='1.6' stroke-linecap='round' opacity='0.6'/>
    <line x1='22' y1='26' x2='9' y2='26' stroke='#EF4444' stroke-width='1.6' stroke-linecap='round' opacity='0.6'/>
    <line x1='22' y1='26' x2='31.5' y2='16.5' stroke='#EF4444' stroke-width='1.4' stroke-linecap='round' opacity='0.4'/>
    <line x1='22' y1='26' x2='31.5' y2='35.5' stroke='#EF4444' stroke-width='1.4' stroke-linecap='round' opacity='0.3'/>
    <line x1='22' y1='26' x2='12.5' y2='16.5' stroke='#EF4444' stroke-width='1.4' stroke-linecap='round' opacity='0.4'/>
    <line x1='22' y1='26' x2='12.5' y2='35.5' stroke='#EF4444' stroke-width='1.4' stroke-linecap='round' opacity='0.3'/>
    <circle cx='22' cy='13' r='3.2' fill='#EF4444'/><circle cx='35' cy='26' r='3' fill='#EF4444'/>
    <circle cx='22' cy='39' r='2.4' fill='#EF4444' opacity='0.7'/><circle cx='9' cy='26' r='2.4' fill='#EF4444' opacity='0.7'/>
    <circle cx='31.5' cy='16.5' r='1.9' fill='#FCA5A5'/><circle cx='12.5' cy='16.5' r='1.9' fill='#FCA5A5'/>
    <circle cx='22' cy='26' r='5.4' fill='#EF4444' filter='url(#bl)'/><circle cx='22' cy='26' r='3.4' fill='#FCA5A5'/>
  </svg>`;

  const iconImg = new Image();
  iconImg.onerror = bail;
  iconImg.onload = () => ((document.fonts && document.fonts.ready) || Promise.resolve()).then(() => { try { start(iconImg); } catch (e) { bail(); } });
  iconImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(ICON);

  function samplePts(ctx, W, H, unit) {
    const data = ctx.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4; if (data[i + 3] < 110) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2]; if (Math.max(r, g, b) < 72) continue;
      pts.push([(x - W / 2) / unit, -(y - H / 2) / unit, r / 255, g / 255, b / 255]);
    }
    return pts;
  }

  function start(iconImg) {
    /* estado ÍCONO (cuadrado) */
    const IS = 440, ic = document.createElement('canvas'); ic.width = ic.height = IS;
    ic.getContext('2d').drawImage(iconImg, 0, 0, IS, IS);
    const iconPts = samplePts(ic.getContext('2d'), IS, IS, IS / 2 / 1.3);

    /* estado WORDMARK "GamaStudio" + "CREATIVE DESIGN" (ancho) */
    const WW = 1160, WH = 360, wc = document.createElement('canvas'); wc.width = WW; wc.height = WH;
    const g = wc.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '900 150px Inter, Arial, sans-serif';
    const gama = 'Gama', studio = 'Studio', wG = g.measureText(gama).width, wS = g.measureText(studio).width, tot = wG + wS, yT = 210;
    g.fillStyle = '#F1F5F9'; g.fillText(gama, WW / 2 - tot / 2 + wG / 2, yT);
    g.fillStyle = '#EF4444'; g.fillText(studio, WW / 2 - tot / 2 + wG + wS / 2, yT);
    try { g.letterSpacing = '12px'; } catch (e) { }
    g.font = '600 30px Inter, Arial, sans-serif'; g.fillStyle = '#9aa7b8'; g.fillText('CREATIVE DESIGN', WW / 2, yT + 62);
    const wordPts = samplePts(g, WW, WH, WH / 2 / 0.8);

    const iL = iconPts.length, wL = wordPts.length, N = Math.max(iL, wL);
    const aIcon = new Float32Array(N * 3), aWord = new Float32Array(N * 3), aRand = new Float32Array(N * 3),
      aCI = new Float32Array(N * 3), aCW = new Float32Array(N * 3), aSize = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const ip = iconPts[i % iL], wp = wordPts[i % wL];
      aIcon[i * 3] = ip[0]; aIcon[i * 3 + 1] = ip[1]; aIcon[i * 3 + 2] = (Math.random() - .5) * .14;
      aWord[i * 3] = wp[0]; aWord[i * 3 + 1] = wp[1]; aWord[i * 3 + 2] = (Math.random() - .5) * .14;
      aCI[i * 3] = ip[2]; aCI[i * 3 + 1] = ip[3]; aCI[i * 3 + 2] = ip[4];
      aCW[i * 3] = wp[2]; aCW[i * 3 + 1] = wp[3]; aCW[i * 3 + 2] = wp[4];
      const rr = 6 + Math.random() * 3, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      aRand[i * 3] = Math.sin(ph) * Math.cos(th) * rr; aRand[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * rr; aRand[i * 3 + 2] = Math.cos(ph) * rr;
      aSize[i] = 1.5 + Math.random() * 2.3;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100); camera.position.z = 8;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(aWord.slice(), 3));   // arranca en el wordmark
    geo.setAttribute('aIcon', new THREE.BufferAttribute(aIcon, 3));
    geo.setAttribute('aWord', new THREE.BufferAttribute(aWord, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 3));
    geo.setAttribute('aCI', new THREE.BufferAttribute(aCI, 3));
    geo.setAttribute('aCW', new THREE.BufferAttribute(aCW, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));

    const uniforms = {
      uProgress: { value: 0 }, uMorph: { value: 0 }, uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(999, 999) }, uSizeScale: { value: 15 * renderer.getPixelRatio() }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aIcon; attribute vec3 aWord; attribute vec3 aRand; attribute vec3 aCI; attribute vec3 aCW; attribute float aSize;
        uniform float uProgress, uMorph, uTime, uSizeScale; uniform vec2 uMouse;
        varying vec3 vColor; varying float vA;
        void main(){
          float m = smoothstep(0.0,1.0,uMorph);                 // 0 = wordmark · 1 = ícono
          vColor = mix(aCW, aCI, m);
          vec3 base = mix(aWord, aIcon, m);
          vec3 pos = mix(aRand, base, uProgress);
          vec2 away = pos.xy - uMouse; float dd = length(away);
          float force = exp(-dd*dd*3.4) * 0.16 * uProgress;      // repulsión sutil con el mouse
          pos.xy += (dd > 1e-4 ? away/dd : vec2(0.0)) * force;
          pos.z += (sin(pos.x*1.3+uTime*0.6)+cos(pos.y*1.3-uTime*0.5))*0.03*uProgress
                 + m*(1.0-m)*sin(pos.x*8.0+uTime*3.0)*0.2;        // dispersión durante el morph
          vA = 0.5 + 0.5*uProgress;
          vec4 mv = modelViewMatrix * vec4(pos,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uSizeScale / -mv.z;
        }`,
      fragmentShader: `varying vec3 vColor; varying float vA;
        void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d); if(a<0.02) discard; gl_FragColor=vec4(vColor,a*vA); }`
    });
    const points = new THREE.Points(geo, mat); scene.add(points);

    const rad = a => a * Math.PI / 180;
    let halfH = 1, halfW = 1, gscale = 1;
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      halfH = Math.tan(rad(25)) * camera.position.z; halfW = halfH * camera.aspect;
      gscale = Math.min(0.9 * halfW / 2.6, 0.56 * halfH / 1.3);
      points.scale.setScalar(gscale); points.position.y = 0;   // centrado (el video Seedance también está centrado)
      uniforms.uSizeScale.value = 15 * renderer.getPixelRatio();
    }
    addEventListener('resize', resize); resize();

    let tmx = 999, tmy = 999, mmx = 999, mmy = 999;
    if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => {
      const wx = (e.clientX / innerWidth * 2 - 1) * halfW, wy = -(e.clientY / innerHeight * 2 - 1) * halfH;
      tmx = wx / gscale; tmy = (wy - points.position.y) / gscale;
    }, { passive: true });

    let vis = true;
    new IntersectionObserver(e => vis = e[0].isIntersecting).observe(canvas);
    const t0 = performance.now();
    function loop(now) {
      if (vis && !document.hidden) {
        const t = (now - t0) / 1000;
        uniforms.uProgress.value = Math.min(1, t / 2);
        uniforms.uTime.value = t;
        const p = window.__ACT1P || 0;
        uniforms.uMorph.value = ss(0, 0.14, p);                 // wordmark → ícono
        canvas.style.opacity = (1 - ss(0.15, 0.175, p)).toFixed(3);   // se congela y cede al video Seedance (match-cut)
        mmx += (tmx - mmx) * .08; mmy += (tmy - mmy) * .08;
        uniforms.uMouse.value.set(mmx, mmy);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
