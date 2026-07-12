/* ==== GAMASTUDIO — Fase 2: túnel de luz → ADN bicolor del proceso ====
   Cinematográfico: doble hélice GRANDE y con volumen (glow aditivo + profundidad)
   que llena la pantalla y GIRA con el scroll. El túnel entra como estelas blancas
   que se asientan y colorean en el ADN. Van saliendo las 7 cards del proceso.
   Hebra roja = ADN de marca (#EF4444) · hebra violeta = identidad GamaLabs (#8B5CF6). */
(() => {
  const canvas = document.getElementById('dnaCanvas');
  const section = document.getElementById('proceso');
  if (!canvas || !section) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const testGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (reduce || !testGL || typeof THREE === 'undefined' || typeof ScrollTrigger === 'undefined') {
    section.classList.add('dna-nogl'); return;              // fallback: lista estática (CSS)
  }

  const RED = new THREE.Color('#EF4444'), REDL = new THREE.Color('#FCA5A5');
  const VIO = new THREE.Color('#8B5CF6'), VIOL = new THREE.Color('#A78BFA');
  const H = 32, R = 4.2, TURNS = 7.5, PER = 2300, RUNGS = 60, RSUB = 13;
  const CAMZ = 13;

  const N = PER * 2 + RUNGS * RSUB;
  const aHelix = new Float32Array(N * 3), aTunnel = new Float32Array(N * 3),
        aColor = new Float32Array(N * 3), aSize = new Float32Array(N);
  const tmp = new THREE.Color();
  let k = 0;
  function put(x, y, z, col, size) {
    aHelix[k*3]=x; aHelix[k*3+1]=y; aHelix[k*3+2]=z;
    aTunnel[k*3]=x*2.4; aTunnel[k*3+1]=y*1.1; aTunnel[k*3+2]=z - 60 - Math.random()*90;  // estela lejana → se asienta
    aColor[k*3]=col.r; aColor[k*3+1]=col.g; aColor[k*3+2]=col.b;
    aSize[k]=size; k++;
  }
  // backbones densos (dos hebras) → cintas glow continuas
  for (let s = 0; s < 2; s++) {
    const phase = s * Math.PI, base = s === 0 ? RED : VIO, light = s === 0 ? REDL : VIOL;
    for (let i = 0; i < PER; i++) {
      const t = i / (PER - 1), ang = t * TURNS * Math.PI * 2 + phase;
      const jitter = 0.06;
      const x = Math.cos(ang) * R + (Math.random()-.5)*jitter, y = (t - 0.5) * H, z = Math.sin(ang) * R + (Math.random()-.5)*jitter;
      tmp.copy(base).lerp(light, 0.5 + 0.5 * Math.sin(ang * 2));
      put(x, y, z, tmp, 2.0 + Math.random() * 1.6);
    }
  }
  // peldaños: barras de varios puntos, gradiente rojo↔violeta
  for (let i = 0; i < RUNGS; i++) {
    const t = (i + 0.5) / RUNGS, ang = t * TURNS * Math.PI * 2, y = (t - 0.5) * H;
    const ax = Math.cos(ang)*R, az = Math.sin(ang)*R, bx = Math.cos(ang+Math.PI)*R, bz = Math.sin(ang+Math.PI)*R;
    for (let j = 0; j < RSUB; j++) {
      const u = j / (RSUB - 1);
      tmp.copy(RED).lerp(VIO, u);
      put(ax + (bx-ax)*u, y, az + (bz-az)*u, tmp, 1.5 + Math.random()*0.8);
    }
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 300); camera.position.z = CAMZ;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(aHelix.slice(), 3));
  geo.setAttribute('aHelix', new THREE.BufferAttribute(aHelix, 3));
  geo.setAttribute('aTunnel', new THREE.BufferAttribute(aTunnel, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));

  const uniforms = {
    uWarp: { value: 0 }, uTime: { value: 0 }, uCamZ: { value: CAMZ }, uR: { value: R },
    uSize: { value: 34 * renderer.getPixelRatio() }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aHelix; attribute vec3 aTunnel; attribute vec3 aColor; attribute float aSize;
      uniform float uWarp, uTime, uSize, uCamZ, uR;
      varying vec3 vColor; varying float vA;
      void main(){
        float w = smoothstep(0.0, 1.0, uWarp);
        vec3 pos = mix(aTunnel, aHelix, w);
        pos.x += sin(uTime*0.5 + pos.y*0.35) * 0.06 * w;
        vColor = mix(vec3(1.0), aColor, smoothstep(0.22, 1.0, uWarp));
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        // profundidad: frente brillante, fondo tenue (volumen)
        float front = smoothstep(-(uCamZ+uR), -(uCamZ-uR), mv.z);
        vA = (0.28 + 0.72*front) * mix(0.9, 1.0, w);
        float streak = mix(2.6, 1.0, w);
        gl_PointSize = aSize * uSize * streak / -mv.z;
      }`,
    fragmentShader: `varying vec3 vColor; varying float vA;
      void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.03,d); if(a<0.015) discard; gl_FragColor=vec4(vColor, a*vA); }`
  });
  const points = new THREE.Points(geo, mat);
  const group = new THREE.Group(); group.add(points); scene.add(group);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    camera.position.z = camera.aspect < 0.85 ? CAMZ + 5 : CAMZ;   // móvil: alejar para que quepa el ancho
    uniforms.uCamZ.value = camera.position.z;
    uniforms.uSize.value = 34 * renderer.getPixelRatio();
  }
  addEventListener('resize', resize); resize();

  /* ---- cards del proceso: emergen una a una con el scroll ---- */
  const cards = Array.from(section.querySelectorAll('.dna-card'));
  const nCards = cards.length || 1;
  function updateCards(p) {
    const cp = Math.min(1, Math.max(0, (p - 0.18) / 0.80));
    cards.forEach((c, i) => {
      const center = (i + 0.5) / nCards, dist = Math.abs(cp - center) * nCards;
      const o = Math.max(0, 1 - dist * 1.3);
      c.style.opacity = o.toFixed(3);
      const off = (1 - o) * 40, sc = 0.94 + o * 0.06;
      c.style.transform = `translateY(-50%) translateX(${c.dataset.side === 'r' ? off : -off}px) scale(${sc.toFixed(3)})`;
      c.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
    });
  }
  updateCards(0);

  // sticky nativo maneja el "pin"; el ScrollTrigger solo LEE el progreso (sin pin → sin conflicto)
  const intro = section.querySelector('.dna-intro');
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', scrub: .5,
    onUpdate: self => {
      const p = self.progress;
      uniforms.uWarp.value = Math.min(1, p / 0.13);                // túnel → hélice
      const cp = Math.max(0, p - 0.13);
      group.rotation.y = cp * Math.PI * 3.4;                       // GIRA con el scroll
      group.position.y = cp * 6.0;                                 // viaja a lo largo del ADN
      updateCards(p);
      if (intro) intro.style.opacity = (1 - Math.min(1, p * 4.5)).toFixed(3);
    }
  });

  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => {
    group.rotation.x = (e.clientY / innerHeight - 0.5) * 0.28;
  }, { passive: true });

  let vis = true;
  new IntersectionObserver(e => vis = e[0].isIntersecting, { rootMargin: '150px' }).observe(section);
  const t0 = performance.now();
  function loop(now) {
    if (vis && !document.hidden) {
      uniforms.uTime.value = (now - t0) / 1000;
      group.rotation.y += 0.0016;                                  // deriva viva
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // reordena los pins (hero/adn/proyectos) para que no se encimen
  requestAnimationFrame(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
