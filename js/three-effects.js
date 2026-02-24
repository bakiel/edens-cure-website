/**
 * Eden's Cure — Three.js Hero Particle Field
 * Gold + amber particles in 3D space with mouse parallax
 */

(function() {
  'use strict';

  // Check Three.js available
  if (typeof THREE === 'undefined') {
    console.warn('[EdensCure3D] Three.js not loaded');
    return;
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  // ─── Setup ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent bg

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  // ─── Resize handler ─────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ─── Particles ──────────────────────────────────────────────────────────
  const PARTICLE_COUNT = 2400;
  const SPREAD = 80;

  // Color palette — gold, amber, cream, sage
  const COLORS = [
    new THREE.Color(0xC9A84C), // gold
    new THREE.Color(0xE8C97A), // gold light
    new THREE.Color(0x8A6A2A), // gold dim
    new THREE.Color(0xF5EFE0), // cream — small fraction
    new THREE.Color(0x4A7C59), // sage — rare
  ];

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT); // drift speed
  const phases = new Float32Array(PARTICLE_COUNT); // phase offset

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * SPREAD; // cube-root for even density

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 0.6;

    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    colors[i * 3 + 0] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    // Smaller particles are more common → natural look
    sizes[i] = Math.random() < 0.7
      ? 0.2 + Math.random() * 0.4   // small
      : 0.6 + Math.random() * 0.8;  // large (rare)

    speeds[i] = 0.2 + Math.random() * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uPixelRatio;

      void main() {
        vColor = color;

        vec3 pos = position;

        // Gentle drift — each particle floats slightly
        float drift = sin(uTime * 0.3 + pos.x * 0.05 + pos.z * 0.02) * 0.8;
        pos.y += drift;
        pos.x += cos(uTime * 0.2 + pos.y * 0.04) * 0.4;

        // Mouse parallax — particles shift with mouse
        pos.x += uMouse.x * (0.5 + abs(pos.z) * 0.02);
        pos.y += uMouse.y * (0.5 + abs(pos.z) * 0.02);

        // Distance from camera affects alpha (depth fog)
        float dist = length(pos);
        vAlpha = smoothstep(80.0, 10.0, dist) * 0.85;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Circular soft particle
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        // Soft edge
        float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ─── Ambient glow orbs (large blurred spheres) ──────────────────────────
  function createGlowOrb(color, radius, x, y, z) {
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  const orb1 = createGlowOrb(0xC9A84C, 30, -20, 10, -20); // gold
  const orb2 = createGlowOrb(0x4A7C59, 25, 25, -8, -15);  // sage
  const orb3 = createGlowOrb(0xE8C97A, 20, 5, 20, -25);   // gold light

  // ─── Mouse tracking ─────────────────────────────────────────────────────
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  document.addEventListener('mousemove', e => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Scroll parallax ────────────────────────────────────────────────────
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  // ─── Animation loop ─────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update shader uniforms
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uMouse.value.set(mouse.x * 3, mouse.y * 3);

    // Slow rotation on Y axis
    particles.rotation.y = elapsed * 0.015 + mouse.x * 0.15;
    particles.rotation.x = mouse.y * 0.08;

    // Scroll: push scene deeper
    camera.position.z = 50 + scrollY * 0.04;

    // Orb gentle float
    orb1.position.y = 10 + Math.sin(elapsed * 0.4) * 3;
    orb2.position.y = -8 + Math.cos(elapsed * 0.3) * 4;
    orb3.position.x = 5 + Math.sin(elapsed * 0.25) * 5;

    renderer.render(scene, camera);
  }

  animate();

  console.log('[EdensCure3D] Particle field initialized — %d particles', PARTICLE_COUNT);
})();
