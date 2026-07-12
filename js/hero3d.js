/* ==== GAMASTUDIO — hero: logo de GamaStudio en partículas 3D ==== */
(() => {
  const canvas = document.getElementById('logo3d');
  const fallback = document.querySelector('.logo-fallback');
  if (!canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const testGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (reduce || !testGL || typeof THREE === 'undefined') {
    canvas.style.display = 'none'; if (fallback) fallback.style.display = 'block'; return;
  }

  /* ---- 1) dibujar el logo (apertura roja) en un canvas y muestrear puntos ---- */
  const S = 560, oc = document.createElement('canvas'); oc.width = oc.height = S;
  const g = oc.getContext('2d'); g.translate(S / 2, S / 2);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
  const R = S / 2;
  [0.30, 0.45, 0.58].forEach(rr => { g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, rr * R, 0, 6.283); g.stroke(); });
  const N = 116;
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.283, len = (0.5 + 0.42 * Math.abs(Math.sin(i * 1.7))) * R;
    g.lineWidth = 3; g.beginPath();
    g.moveTo(Math.cos(a) * 0.12 * R, Math.sin(a) * 0.12 * R);
    g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
  }
  [[-Math.PI / 2, 0.5, 11], [0, 0.58, 9], [Math.PI / 2, 0.58, 7], [Math.PI, 0.58, 7]].forEach(([a, rr, dr]) => {
    g.beginPath(); g.arc(Math.cos(a) * rr * R, Math.sin(a) * rr * R, dr, 0, 6.283); g.fill();
  });
  g.beginPath(); g.arc(0, 0, 0.16 * R, 0, 6.283); g.fill();

  const data = g.getImageData(0, 0, S, S).data;
  const R3D = 2.25;
  const tgt = [], rnd = [], col = [], siz = [];
  const cA = [252, 165, 165], cB = [239, 68, 68]; // salmón → rojo
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) {
    if (data[(y * S + x) * 4 + 3] < 120) continue;
    const nx = (x - S / 2) / (S / 2), ny = -(y - S / 2) / (S / 2);
    const nr = Math.min(1, Math.hypot(nx, ny));
    tgt.push(nx * R3D, ny * R3D, (0.5 - nr) * 0.6 + (Math.random() - .5) * 0.25);
    // arranque disperso (esfera)
    const rr = 6 + Math.random() * 3, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    rnd.push(Math.sin(ph) * Math.cos(th) * rr, Math.sin(ph) * Math.sin(th) * rr, Math.cos(ph) * rr);
    const t = Math.pow(nr, .7);
    col.push((cA[0] + (cB[0] - cA[0]) * t) / 255, (cA[1] + (cB[1] - cA[1]) * t) / 255, (cA[2] + (cB[2] - cA[2]) * t) / 255);
    siz.push(2.0 + Math.random() * 2.9);
  }
  const COUNT = siz.length;

  /* ---- 2) escena Three.js ---- */
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
    uAmp: { value: 0 }, uSizeScale: { value: 16 * renderer.getPixelRatio() }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aTarget; attribute vec3 aRand; attribute vec3 aColor; attribute float aSize;
      uniform float uProgress, uTime, uAmp, uSizeScale; uniform vec2 uMouse;
      varying vec3 vColor; varying float vA;
      void main(){
        vColor = aColor;
        float p = uProgress;
        vec3 pos = mix(aRand, aTarget, p);
        float d = distance(pos.xy, uMouse);
        float ripple = sin(d*3.0 - uTime*2.4) * exp(-d*0.75) * uAmp;
        float wave = sin(pos.x*1.2 + uTime*0.6)*0.045 + cos(pos.y*1.1 - uTime*0.5)*0.045;
        pos.z += (ripple + wave*uAmp*4.0);
        vA = 0.55 + 0.45*p;
        vec4 mv = modelViewMatrix * vec4(pos,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uSizeScale / -mv.z;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d);
        if(a < 0.02) discard;
        gl_FragColor = vec4(vColor, a*vA);
      }`
  });
  const points = new THREE.Points(geo, mat); points.position.y = 1.5; scene.add(points);

  /* ---- 3) mouse → mundo (plano z=0), en espacio local del grupo ---- */
  let tmx = 999, tmy = 999, mmx = 999, mmy = 999;
  const rad = a => a * Math.PI / 180;
  let halfH = 1, halfW = 1;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(rad(25)) * camera.position.z; halfW = halfH * camera.aspect;
    uniforms.uSizeScale.value = 16 * renderer.getPixelRatio();
  }
  addEventListener('resize', resize); resize();
  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => {
    tmx = (e.clientX / innerWidth * 2 - 1) * halfW;
    tmy = -(e.clientY / innerHeight * 2 - 1) * halfH - points.position.y;
  }, { passive: true });

  /* ---- 4) loop: assemble + ondas + rotación sutil ---- */
  let vis = true;
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(canvas);
  const t0 = performance.now();
  function loop(now) {
    if (vis && !document.hidden) {
      const t = (now - t0) / 1000;
      uniforms.uProgress.value = Math.min(1, t / 2);                 // ensamblado ~2s
      uniforms.uAmp.value = Math.min(0.5, Math.max(0, (t - 2) * 0.4)); // olas entran tras armarse
      uniforms.uTime.value = t;
      mmx += (tmx - mmx) * .08; mmy += (tmy - mmy) * .08;
      uniforms.uMouse.value.set(mmx, mmy);
      points.rotation.y = Math.sin(t * .12) * .09;
      points.rotation.x = Math.sin(t * .1) * .03;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
