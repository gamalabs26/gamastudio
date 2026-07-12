/* ==== GAMASTUDIO — hero: el LOGO REAL en partículas 3D (rasterizado del SVG) ==== */
(() => {
  const canvas = document.getElementById('logo3d');
  const fallback = document.querySelector('.logo-fallback');
  if (!canvas) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const testGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const bail = () => { canvas.style.display = 'none'; if (fallback) fallback.style.display = 'block'; };
  if (reduce || !testGL || typeof THREE === 'undefined') { bail(); return; }

  const img = new Image();
  img.onerror = bail;
  img.onload = () => { try { init(img); } catch (e) { bail(); } };
  img.src = 'assets/brand/gama-studio.svg';

  function init(img) {
    /* ---- 1) rasterizar el logo real y muestrear píxeles brillantes (con su color) ---- */
    const H = 360, W = Math.round(H * (img.width / img.height || 4.23));
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    const g = oc.getContext('2d'); g.drawImage(img, 0, 0, W, H);
    const data = g.getImageData(0, 0, W, H).data;
    const tgt = [], rnd = [], col = [], siz = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4, a = data[i + 3];
      if (a < 110) continue;
      const r = data[i], gg = data[i + 1], bb = data[i + 2];
      if (Math.max(r, gg, bb) < 72) continue; // saltar la caja oscura del ícono
      const nx = (x - W / 2) / (H / 2), ny = -(y - H / 2) / (H / 2);
      tgt.push(nx, ny, (Math.random() - .5) * 0.14);
      const rr = 6 + Math.random() * 3, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      rnd.push(Math.sin(ph) * Math.cos(th) * rr, Math.sin(ph) * Math.sin(th) * rr, Math.cos(ph) * rr);
      col.push(r / 255, gg / 255, bb / 255);
      siz.push(1.5 + Math.random() * 2.3);
    }
    const AR = W / H;

    /* ---- 2) escena ---- */
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
          float ripple = sin(d*2.6 - uTime*2.4) * exp(-d*0.6) * uAmp;
          float wave = sin(pos.x*1.1 + uTime*0.6)*0.05 + cos(pos.y*1.6 - uTime*0.5)*0.05;
          pos.z += (ripple + wave*uAmp*3.0);
          vA = 0.5 + 0.5*p;
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
    const points = new THREE.Points(geo, mat); scene.add(points);

    /* ---- 3) tamaño responsivo + posición + mouse ---- */
    const rad = a => a * Math.PI / 180;
    let halfH = 1, halfW = 1, gscale = 1;
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      halfH = Math.tan(rad(25)) * camera.position.z; halfW = halfH * camera.aspect;
      // el logo (normalizado a media-altura=1, media-ancho=AR) cabe al 76% del ancho o 62% de la altura
      gscale = Math.min(0.76 * halfW / AR, 0.62 * halfH);
      points.scale.setScalar(gscale);
      points.position.y = halfH * 0.30;               // logo arriba, texto abajo
      uniforms.uSizeScale.value = 15 * renderer.getPixelRatio();
    }
    addEventListener('resize', resize); resize();

    let tmx = 999, tmy = 999, mmx = 999, mmy = 999;
    if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => {
      const wx = (e.clientX / innerWidth * 2 - 1) * halfW;
      const wy = -(e.clientY / innerHeight * 2 - 1) * halfH;
      tmx = wx / gscale; tmy = (wy - points.position.y) / gscale;  // a espacio local del logo
    }, { passive: true });

    /* ---- 4) loop ---- */
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
        points.rotation.y = Math.sin(t * .12) * .06;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
