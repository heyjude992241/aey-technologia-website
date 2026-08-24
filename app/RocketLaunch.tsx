import { useEffect, useRef } from "react";
import * as THREE from "three";
import { assetPath } from "./assetPath";

function latLonToVector3(latitude: number, longitude: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function makeStarField(count: number) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 34;
    positions[i3 + 1] = (Math.random() - 0.5) * 21;
    positions[i3 + 2] = -Math.random() * 30 - 1;
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.45 + Math.random() * 1.35;
    sizes[i] = 1.4 + Math.random() * 2.6;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  return new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uStreak: { value: 0 },
      },
      vertexShader: `
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uStreak;
        varying float vGlow;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.56 + 0.44 * sin(uTime * aSpeed + aPhase);
          vGlow = pulse;
          gl_PointSize = aSize * uPixelRatio * (0.72 + pulse * 0.5) * (1.0 + uStreak * 4.5);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        varying float vGlow;
        uniform float uStreak;

        void main() {
          vec2 point = gl_PointCoord - vec2(0.5);
          float angle = 0.62;
          mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          point = rotation * point;
          point.x *= 1.0 + uStreak * 9.0;
          float distanceToCenter = length(point);
          float softPoint = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);
          vec3 starColor = mix(vec3(0.56, 0.72, 1.0), vec3(1.0), vGlow);
          gl_FragColor = vec4(starColor, softPoint * (0.18 + vGlow * 0.72 + uStreak * 0.16));
        }
      `,
    }),
  );
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 255, 236, 1)");
  glow.addColorStop(0.16, "rgba(255, 189, 82, 0.95)");
  glow.addColorStop(0.46, "rgba(255, 91, 36, 0.42)");
  glow.addColorStop(1, "rgba(255, 55, 18, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeMarkerGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.16, "rgba(255, 80, 72, 0.96)");
  glow.addColorStop(0.48, "rgba(238, 35, 45, 0.42)");
  glow.addColorStop(1, "rgba(210, 20, 30, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeRocket() {
  const rocket = new THREE.Group();

  const white = new THREE.MeshStandardMaterial({
    color: "#f7f6ef",
    roughness: 0.34,
    metalness: 0.28,
  });
  const graphite = new THREE.MeshStandardMaterial({
    color: "#202635",
    roughness: 0.38,
    metalness: 0.52,
  });
  const red = new THREE.MeshStandardMaterial({
    color: "#e33a35",
    roughness: 0.45,
    metalness: 0.18,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: "#56c7ff",
    emissive: "#0d5f89",
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.35, 36), white);
  body.castShadow = true;
  rocket.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 36), red);
  nose.position.y = 0.885;
  nose.castShadow = true;
  rocket.add(nose);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.17, 0.08, 36), graphite);
  band.position.y = 0.36;
  rocket.add(band);

  const window = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 16), glass);
  window.position.set(0, 0.44, 0.153);
  window.scale.set(1, 1, 0.28);
  rocket.add(window);

  const finGeometry = new THREE.BoxGeometry(0.08, 0.34, 0.035);
  for (let i = 0; i < 3; i += 1) {
    const fin = new THREE.Mesh(finGeometry, red);
    const angle = (i / 3) * Math.PI * 2;
    fin.position.set(Math.cos(angle) * 0.19, -0.56, Math.sin(angle) * 0.19);
    fin.rotation.y = -angle;
    fin.rotation.z = 0.42;
    fin.castShadow = true;
    rocket.add(fin);
  }

  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.75, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: "#ff4a18",
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  outerFlame.name = "outerFlame";
  outerFlame.position.y = -1.52;
  outerFlame.rotation.x = Math.PI;
  rocket.add(outerFlame);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 1.4, 30, 1, true),
    new THREE.MeshBasicMaterial({
      color: "#ffad35",
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  flame.name = "flame";
  flame.position.y = -1.36;
  flame.rotation.x = Math.PI;
  rocket.add(flame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.92, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: "#f8f4d8",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  innerFlame.name = "innerFlame";
  innerFlame.position.y = -1.14;
  innerFlame.rotation.x = Math.PI;
  rocket.add(innerFlame);

  rocket.scale.setScalar(0.78);
  return rocket;
}

export default function RocketLaunch() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#02030a");
    scene.fog = new THREE.FogExp2("#02030a", 0.018);

    const camera = new THREE.PerspectiveCamera(
      48,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      80,
    );
    camera.position.set(0, 0.35, 8);
    camera.lookAt(0, -0.3, -8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#c5d7ff", 0.42);
    const sun = new THREE.DirectionalLight("#fff1cf", 4.2);
    sun.position.set(4, 5, 6);
    sun.castShadow = true;
    const rim = new THREE.PointLight("#6cd9ff", 2.4, 18);
    rim.position.set(-5, 3.2, 2);
    scene.add(ambient, sun, rim);

    const stars = makeStarField(260);
    scene.add(stars);

    const earthTexture = new THREE.TextureLoader().load(assetPath("earth-blue-marble.jpg"));
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    earthTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const earth = new THREE.Group();
    earth.position.set(-7.2, -4.45, -13.2);
    earth.rotation.z = -0.22;
    const earthBaseRotationY = THREE.MathUtils.degToRad(168);
    const earthSurface = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 96, 96),
      new THREE.MeshStandardMaterial({
        map: earthTexture,
        color: "#ffffff",
        roughness: 0.78,
        metalness: 0,
        emissive: "#020817",
        emissiveIntensity: 0.12,
      }),
    );
    earthSurface.receiveShadow = true;
    earth.add(earthSurface);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.61, 96, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDirection;

          void main() {
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDirection = normalize(-viewPosition.xyz);
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vViewDirection;

          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.35);
            vec3 atmosphereColor = mix(vec3(0.08, 0.42, 1.0), vec3(0.38, 0.9, 1.0), fresnel);
            gl_FragColor = vec4(atmosphereColor, fresnel * 0.72);
          }
        `,
      }),
    );
    earth.add(atmosphere);

    const malaysiaPosition = latLonToVector3(4.2105, 101.9758, 1.535);
    const malaysiaMarker = new THREE.Group();
    malaysiaMarker.position.copy(malaysiaPosition);
    malaysiaMarker.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      malaysiaPosition.clone().normalize(),
    );

    const markerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 20, 20),
      new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    );
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.075, 0.11, 32),
      new THREE.MeshBasicMaterial({
        color: "#ff3545",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    markerRing.position.z = 0.008;

    const malaysiaGlowTexture = makeMarkerGlowTexture();
    const markerGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: malaysiaGlowTexture ?? undefined,
        color: "#ff4a58",
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    markerGlow.scale.setScalar(0.42);
    markerGlow.position.z = 0.012;
    malaysiaMarker.add(markerGlow, markerRing, markerCore);
    earth.add(malaysiaMarker);
    scene.add(earth);

    const rocket = makeRocket();
    scene.add(rocket);

    const launchStart = new THREE.Vector3(-6.65, -3.1, -12);
    const flightControl = new THREE.Vector3(-2.2, -0.15, -3.1);
    const flybyEnd = new THREE.Vector3(1.65, 1.2, 12.5);
    const flightPath = new THREE.QuadraticBezierCurve3(launchStart, flightControl, flybyEnd);
    const flightDirection = new THREE.Vector3();
    const aimDirection = new THREE.Vector3();
    const orientationDirection = new THREE.Vector3();
    const flybyAimTarget = new THREE.Vector3(1.85, 0.95, 10.8);
    const rocketUp = new THREE.Vector3(0, 1, 0);

    const ignitionTexture = makeGlowTexture();
    const ignitionGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: ignitionTexture ?? undefined,
        color: "#ffb057",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(ignitionGlow);

    const ignitionLight = new THREE.PointLight("#ff7738", 0, 8);
    scene.add(ignitionLight);

    const smokeGeometry = new THREE.BufferGeometry();
    const smokeCount = 54;
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeSeeds = new Float32Array(smokeCount);
    for (let i = 0; i < smokeCount; i += 1) {
      smokeSeeds[i] = Math.random();
    }
    smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
    const smoke = new THREE.Points(
      smokeGeometry,
      new THREE.PointsMaterial({
        color: "#c8d7ef",
        size: 0.075,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
    );
    scene.add(smoke);

    const clock = new THREE.Clock();
    let frameId = 0;

    const setSize = () => {
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const isPortrait = camera.aspect < 0.8;
      earth.position.x = isPortrait ? -2.35 : -7.2;
      earth.scale.setScalar(isPortrait ? 0.78 : 1);
      launchStart.set(
        earth.position.x + (isPortrait ? 0.42 : 0.55),
        earth.position.y + (isPortrait ? 1.05 : 1.35),
        -12,
      );
      flightControl.x = isPortrait ? -1.1 : -2.2;
      flybyEnd.x = isPortrait ? 0.95 : 1.65;
      ignitionGlow.position.copy(launchStart);
      ignitionLight.position.copy(launchStart);
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(mount);

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const cycle = (elapsed % 18) / 18;
      const flight = THREE.MathUtils.clamp((cycle - 0.055) / 0.89, 0, 1);
      const ease = flight * flight * (3 - 2 * flight);
      const drift = Math.sin(elapsed * 1.1) * 0.025 * flight;
      const ignition = Math.sin(THREE.MathUtils.clamp((cycle - 0.018) / 0.09, 0, 1) * Math.PI);
      const flybyImpact = Math.exp(-Math.pow((ease - 0.845) / 0.052, 2));

      earth.rotation.y = earthBaseRotationY + Math.sin(elapsed * 0.12) * 0.055;
      const markerPulse = 0.92 + Math.sin(elapsed * 3.1) * 0.12;
      malaysiaMarker.scale.setScalar(markerPulse);
      markerRing.scale.setScalar(1 + (markerPulse - 0.92) * 1.8);
      (markerRing.material as THREE.MeshBasicMaterial).opacity = 0.72 + markerPulse * 0.15;
      stars.rotation.y = elapsed * 0.0015;
      const starMaterial = stars.material as THREE.ShaderMaterial;
      starMaterial.uniforms.uTime.value = elapsed;
      starMaterial.uniforms.uStreak.value = flybyImpact;

      flightPath.getPoint(ease, rocket.position);
      rocket.position.y += drift;
      flightPath.getTangent(ease, flightDirection);
      aimDirection.copy(flybyAimTarget).sub(rocket.position).normalize();
      const aimWeight =
        THREE.MathUtils.smoothstep(ease, 0.18, 0.7) *
        (1 - THREE.MathUtils.smoothstep(ease, 0.84, 0.94));
      orientationDirection.copy(flightDirection).lerp(aimDirection, aimWeight * 0.42).normalize();
      rocket.quaternion.setFromUnitVectors(rocketUp, orientationDirection);
      const flybyRoll =
        THREE.MathUtils.smoothstep(ease, 0.42, 0.9) * 0.18 + Math.sin(elapsed * 0.55) * 0.025;
      rocket.rotateY(flybyRoll);
      rocket.visible = cycle < 0.965;

      const ignitionFlicker = 0.86 + Math.sin(elapsed * 37) * 0.14;
      ignitionGlow.scale.setScalar(0.45 + ignition * ignitionFlicker * 1.55);
      (ignitionGlow.material as THREE.SpriteMaterial).opacity = ignition * ignitionFlicker * 0.62;
      ignitionLight.intensity = ignition * ignitionFlicker * 5.5;

      const outerFlame = rocket.getObjectByName("outerFlame");
      const flame = rocket.getObjectByName("flame");
      const innerFlame = rocket.getObjectByName("innerFlame");
      if (outerFlame) {
        outerFlame.scale.set(
          1 + Math.sin(elapsed * 24) * 0.16,
          0.92 + Math.sin(elapsed * 19) * 0.28,
          1 + Math.cos(elapsed * 27) * 0.12,
        );
      }
      if (flame) {
        flame.scale.set(1 + Math.sin(elapsed * 33) * 0.13, 1 + Math.sin(elapsed * 26) * 0.26, 1);
      }
      if (innerFlame) {
        innerFlame.scale.set(1 + Math.cos(elapsed * 31) * 0.1, 1 + Math.sin(elapsed * 29) * 0.22, 1);
      }

      const smokeArray = smokeGeometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < smokeCount; i += 1) {
        const seed = smokeSeeds[i];
        const phase = (elapsed * 0.34 + seed) % 1;
        const spread = 0.12 + phase * 0.72;
        const i3 = i * 3;
        smokeArray.array[i3] = launchStart.x + Math.cos(seed * Math.PI * 2) * spread * 0.38;
        smokeArray.array[i3 + 1] = launchStart.y - 0.42 + phase * 0.92;
        smokeArray.array[i3 + 2] = launchStart.z + Math.sin(seed * Math.PI * 2) * spread * 0.3;
      }
      smokeArray.needsUpdate = true;
      smoke.material.opacity = 0.26 * Math.max(0, 1 - ease * 3.2);

      const shakeX = Math.sin(elapsed * 71) * 0.025 * flybyImpact;
      const shakeY = Math.cos(elapsed * 83) * 0.018 * flybyImpact;
      camera.position.set(shakeX, 0.35 + shakeY, 8);
      camera.lookAt(shakeX * 0.3, -0.3 + shakeY * 0.3, -8);
      mount.style.setProperty("--flyby-impact", flybyImpact.toFixed(3));

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    setSize();
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.style.removeProperty("--flyby-impact");
      mount.removeChild(renderer.domElement);
      earthTexture.dispose();
      malaysiaGlowTexture?.dispose();
      ignitionTexture?.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Line ||
          object instanceof THREE.Sprite
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return (
    <div ref={mountRef} className="launch-scene" aria-label="AEY-Technologia rocket launch animation">
      <header className="launch-copy">
        <h1 className="brand-name">
          <span>AEY</span> <span className="brand-tech">Technologia</span>
        </h1>
        <div className="signal-line" aria-hidden="true">
          <span />
        </div>
        <p className="brand-origin">
          <span className="malaysia-signal" aria-hidden="true" />
          Made in Malaysia
        </p>
        <p className="brand-mission">
          We are moving to <strong>Mars</strong>
        </p>
      </header>
      <a className="journey-cue" href="#what-we-do" aria-label="Continue to What we do">
        <span aria-hidden="true" />
      </a>
    </div>
  );
}
