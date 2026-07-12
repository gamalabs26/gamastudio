/* ==== GAMASTUDIO — hero: logo REAL apilado (ícono grande arriba + GamaStudio abajo) en partículas ==== */
(() => {
  const canvas = document.getElementById('logo3d');
  const fallback = document.querySelector('.logo-fallback');
  if (!canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const testGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const bail = () => { canvas.style.display = 'none'; if (fallback) fallback.style.display = 'block'; };
  if (reduce || !testGL || typeof THREE === 'undefined') { bail(); return; }

  /* ---- ícono real (diamante cardinal), viewBox recortado, trazos un pelín más gruesos para densidad ---- */
  const ICON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 4 44 44' width='400' height='400'>
    <defs>
      <radialGradient id='gl' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='#EF4444' stop-opacity='0.42'/><stop offset='100%' stop-color='#EF4444' stop-opacity='0'/></radialGradient>
      <filter id='bl' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='2.2' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
    </defs>
    <circle cx='22' cy='26' r='13' fill='url(#gl)'/>
    <line x1='22' y1='26' x2='22' y2='13' stroke='#EF4444' stroke-width='1.5' stroke-linecap='round' opacity='0.9'/>
    <line x1='22' y1='26' x2='35' y2='26' stroke='#EF4444' stroke-width='1.5' stroke-linecap='round' opacity='0.85'/>
    <line x1='22' y1='26' x2='22' y2='39' stroke='#EF4444' stroke-width='1.5' stroke-linecap='round' opacity='0.6'/>
    <line x1='22' y1='26' x2='9' y2='26' stroke='#EF4444' stroke-width='1.5' stroke-linecap='round' opacity='0.6'/>
    <line x1='22' y1='26' x2='31.5' y2='16.5' stroke='#EF4444' stroke-width='1.3' stroke-linecap='round' opacity='0.4'/>
    <line x1='22' y1='26' x2='31.5' y2='35.5' stroke='#EF4444' stroke-width='1.3' stroke-linecap='round' opacity='0.3'/>
    <line x1='22' y1='26' x2='12.5' y2='16.5' stroke='#EF4444' stroke-width='1.3' stroke-linecap='round' opacity='0.4'/>
    <line x1='22' y1='26' x2='12.5' y2='35.5' stroke='#EF4444' stroke-width='1.3' stroke-linecap='round' opacity='0.3'/>
    <circle cx='22' cy='13' r='3' fill='#EF4444'/><circle cx='35' cy='26' r='2.8' fill='#EF4444'/>
    <circle cx='22' cy='39' r='2.3' fill='#EF4444' opacity='0.7'/><circle cx='9' cy='26' r='2.3' fill='#EF4444' opacity='0.7'/>
    <circle cx='31.5' cy='16.5' r='1.8' fill='#FCA5A5'/><circle cx='12.5' cy='16.5' r='1.8' fill='#FCA5A5'/>
    <circle cx='22' cy='26' r='5.2' fill='#EF4444' filter='url(#bl)'/><circle cx='22' cy='26' r='3.3' fill='#FCA5A5'/>
  </svg>`;

  const iconImg = new Image();
  iconImg.onerror = bail;
  iconImg.onload = () => {
    const ready = (document.fonts && document.fonts.ready) || Promise.resolve();
    ready.then(() => { try { start(iconImg); } catch (e) { bail(); } });
  };
  iconImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(ICON);

  function start(iconImg) {
    /* ---- componer: ícono grande arriba + "GamaStudio" + "CREATIVE DESIGN" abajo ---- */
    const CW = 560, CH = 660, oc = document.createElement('canvas'); oc.width = CW; oc.height = CH;
    const g = oc.getContext('2d');
    const isz = 340; g.drawImage(iconImg, (CW - isz) / 2, 20, isz, isz);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '900 96px Inter, Arial, sans-serif';
    const gama = 'Gama', studio = 'Studio';
    const wG = g.measureText(gama).width, wS = g.measureText(studio).width, tot = wG + wS, yT = 500;
    g.fillStyle = '#F1F5F9'; g.fillText(gama, CW / 2 - tot / 2 + wG / 2, yT);
    g.fillStyle = '#EF4444'; g.fillText(studio, CW / 2 - tot / 2 + wG + wS / 2, yT);
    try { g.letterSpacing = '7px'; } catch (e) { }
    g.font = '600 21px Inter, Arial, sans-serif'; g.fillStyle = '#93a1b3';
    g.fillText('CREATIVE DESIGN', CW / 2, yT + 46);

    const data = g.getImageData(0, 0, CW, CH).data;
    const tgt = [], rnd = [], col = [], siz = [];
    for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) {
      const i = (y * CW + x) * 4, a = data[i + 3];
      if (a < 110) continue;
      const r = data[i], gg = data[i + 1], bb = data[i + 2];
      if (Math.max(r, gg, bb) < 72) continue;
      const nx = (x - CW / 2) / (CH / 2), ny = -(y - CH / 2) / (CH / 2);
      tgt.push(nx, ny, (Math.random() - .5) * 0.14);
      const rr = 6 + Math.random() * 3, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      rnd.push(Math.sin(ph) * Math.cos(th) * rr, Math.sin(ph) * Math.sin(th) * rr, Math.cos(ph) * rr);
      col.push(r / 255, gg / 255, bb / 255);
      siz.push(1.5 + Math.random() * 2.3);
    }
    const AR = CW / CH;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 100); camera.position.z = 8;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tgt), 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(tgt), 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(new Float32Array(rnd), 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(col), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(siz), 1));

    const uniforms = {
      uProgress: { value: 0 }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(999, 999) },
      uAmp: { value: 0 }, uSizeScale: { value: 15 * renderer.getPixelRatio() }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute vec3 aTarget; attribute vec3 aRand; attribute vec3 aColor; attribute float aSize;
        uniform float uProgress, uTime, uAmp, uSizeScale; uniform vec2 uMouse;
        varying vec3 vColor; varying float vA;
        void main(){
          vColor = aColor; float p = uProgress;
          vec3 pos = mix(aRand, aTarget, p);
          float d = distance(pos.xy, uMouse);
          float ripple = sin(d*2.6 - uTime*2.4) * exp(-d*0.6) * uAmp;
          float wave = sin(pos.x*1.3 + uTime*0.6)*0.05 + cos(pos.y*1.3 - uTime*0.5)*0.05;
          pos.z += (ripple + wave*uAmp*3.0);
          vA = 0.5 + 0.5*p;
          vec4 mv = modelViewMatrix * vec4(pos,1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uSizeScale / -mv.z;
        }`,
      fragmentShader: `
        varying vec3 vColor; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5,0.05,d); if(a<0.02) discard; gl_FragColor = vec4(vColor, a*vA); }`
    });
    const points = new THREE.Points(geo, mat); scene.add(points);

    const rad = a => a * Math.PI / 180;
    let halfH = 1, halfW = 1, gscale = 1;
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      halfH = Math.tan(rad(25)) * camera.position.z; halfW = halfH * camera.aspect;
      gscale = Math.min(0.82 * halfW / AR, 0.58 * halfH);
      points.scale.setScalar(gscale);
      points.position.y = halfH * 0.14;
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
        uniforms.uAmp.value = Math.min(0.5, Math.max(0, (t - 2) * 0.4));
        uniforms.uTime.value = t;
        mmx += (tmx - mmx) * .08; mmy += (tmy - mmy) * .08;
        uniforms.uMouse.value.set(mmx, mmy);
        points.rotation.y = Math.sin(t * .12) * .05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
