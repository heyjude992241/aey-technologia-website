import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { assetPath } from "./assetPath";

function makeSignalGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.13, "rgba(132, 218, 255, 0.98)");
  glow.addColorStop(0.4, "rgba(56, 157, 255, 0.38)");
  glow.addColorStop(1, "rgba(36, 105, 224, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeContactStars(count: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const i3 = index * 3;
    positions[i3] = (Math.random() - 0.5) * 24;
    positions[i3 + 1] = (Math.random() - 0.5) * 14;
    positions[i3 + 2] = -Math.random() * 15 - 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: "#d8ebff",
      size: 0.025,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
}

function makeBeacon(glowTexture: THREE.Texture | null) {
  const beacon = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: "#d9e6ef",
    metalness: 0.78,
    roughness: 0.24,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: "#202b38",
    metalness: 0.7,
    roughness: 0.34,
  });
  const signalMaterial = new THREE.MeshBasicMaterial({
    color: "#96ddff",
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.18, 28), darkMetal);
  base.position.y = 0.09;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 1.05, 20), metal);
  mast.position.y = 0.66;
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), darkMetal);
  joint.position.y = 1.2;

  const dish = new THREE.Group();
  dish.name = "dish";
  dish.position.y = 1.2;
  const dishFace = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), signalMaterial);
  const dishRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 12, 48), metal);
  const receiver = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), metal);
  receiver.position.z = 0.22;

  const emitter = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      color: "#a9e7ff",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  emitter.name = "emitter";
  emitter.position.z = 0.24;
  emitter.scale.setScalar(0.5);

  for (let index = 0; index < 3; index += 1) {
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.47, 48), signalMaterial.clone());
    wave.name = `signalWave${index}`;
    wave.position.z = 0.03;
    dish.add(wave);
  }

  dish.add(dishFace, dishRim, receiver, emitter);
  beacon.add(base, mast, joint, dish);
  return beacon;
}

export default function ContactUs() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const visibleRef = useRef(false);
  const signalActiveRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [signalActive, setSignalActive] = useState(false);

  useEffect(() => {
    signalActiveRef.current = signalActive;
  }, [signalActive]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return undefined;
    }

    const updateVisibility = () => {
      const rect = section.getBoundingClientRect();
      const visible = rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.18;
      visibleRef.current = visible;
      if (visible) {
        setIsVisible(true);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(section);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 50);
    camera.position.set(0, 0.25, 8);
    camera.lookAt(0, -0.6, -2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#c4dcff", 0.28);
    const marsLight = new THREE.DirectionalLight("#ffb07b", 4.4);
    marsLight.position.set(-4, 5, 6);
    const signalLight = new THREE.PointLight("#72ceff", 4.5, 11);
    scene.add(ambient, marsLight, signalLight);

    const stars = makeContactStars(150);
    scene.add(stars);

    const marsTexture = new THREE.TextureLoader().load(assetPath("mars-texture.webp"));
    marsTexture.colorSpace = THREE.SRGBColorSpace;
    marsTexture.wrapS = THREE.RepeatWrapping;
    marsTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(6, 128, 128),
      new THREE.MeshStandardMaterial({
        map: marsTexture,
        bumpMap: marsTexture,
        bumpScale: 0.055,
        color: "#d98761",
        roughness: 0.96,
        metalness: 0,
      }),
    );
    mars.rotation.z = -0.1;
    scene.add(mars);

    const glowTexture = makeSignalGlowTexture();
    const beacon = makeBeacon(glowTexture);
    scene.add(beacon);

    const earthTexture = new THREE.TextureLoader().load(assetPath("earth-blue-marble.jpg"));
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const earth = new THREE.Group();
    const earthSurface = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 48, 48),
      new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 0.7,
        emissive: "#0a1e4c",
        emissiveIntensity: 0.28,
      }),
    );
    const earthGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture ?? undefined,
        color: "#70bdff",
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    earthGlow.scale.setScalar(0.72);
    earth.add(earthGlow, earthSurface);
    scene.add(earth);

    const signalStart = new THREE.Vector3();
    const signalControl = new THREE.Vector3();
    const signalEnd = new THREE.Vector3();
    const signalCurve = new THREE.QuadraticBezierCurve3(signalStart, signalControl, signalEnd);
    const signalGeometry = new THREE.BufferGeometry();
    const signalPositions = new Float32Array(101 * 3);
    signalGeometry.setAttribute("position", new THREE.BufferAttribute(signalPositions, 3));
    const signalLine = new THREE.Line(
      signalGeometry,
      new THREE.LineBasicMaterial({
        color: "#8edcff",
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(signalLine);

    const signalPulses = Array.from({ length: 3 }, () => {
      const pulse = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture ?? undefined,
          color: "#c1efff",
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pulse.scale.setScalar(0.28);
      scene.add(pulse);
      return pulse;
    });

    const updateSignalPath = () => {
      const positionAttribute = signalGeometry.getAttribute("position") as THREE.BufferAttribute;
      for (let index = 0; index <= 100; index += 1) {
        const point = signalCurve.getPoint(index / 100);
        positionAttribute.setXYZ(index, point.x, point.y, point.z);
      }
      positionAttribute.needsUpdate = true;
      signalGeometry.computeBoundingSphere();
    };

    const setSize = () => {
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const isPortrait = camera.aspect < 0.8;
      mars.position.set(isPortrait ? 0.8 : 3.4, isPortrait ? -6.15 : -5.5, isPortrait ? -4.2 : -4.6);
      mars.scale.setScalar(isPortrait ? 0.83 : 1);
      beacon.position.set(isPortrait ? -0.7 : 1.4, isPortrait ? -2.25 : -1.75, isPortrait ? 0.1 : 0.25);
      beacon.scale.setScalar(isPortrait ? 0.72 : 1);
      earth.position.set(isPortrait ? 1.15 : 3.65, isPortrait ? 1.9 : 2.05, isPortrait ? -1.4 : -1.25);

      const dish = beacon.getObjectByName("dish") as THREE.Group;
      dish.lookAt(earth.position);
      beacon.getObjectByName("emitter")?.getWorldPosition(signalStart);
      signalEnd.copy(earth.position);
      signalControl.copy(signalStart).lerp(signalEnd, 0.5);
      signalControl.y += isPortrait ? 1.1 : 1.45;
      signalControl.z -= 0.55;
      signalLight.position.copy(signalStart);
      updateSignalPath();
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(mount);

    const startTime = performance.now();
    let frameId = 0;
    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const speed = visibleRef.current ? 1 : 0.15;
      const boost = signalActiveRef.current ? 1 : 0;

      mars.rotation.y += 0.0005 * speed;
      earthSurface.rotation.y += 0.0018 * speed;
      stars.rotation.y = elapsed * 0.0015;

      const lineMaterial = signalLine.material as THREE.LineBasicMaterial;
      lineMaterial.opacity += ((0.18 + boost * 0.38) - lineMaterial.opacity) * 0.08;
      signalLight.intensity += ((4.5 + boost * 5.5) - signalLight.intensity) * 0.08;

      signalPulses.forEach((pulse, index) => {
        const progress = (elapsed * (0.11 + boost * 0.08) + index / signalPulses.length) % 1;
        pulse.position.copy(signalCurve.getPoint(progress));
        const pulseSize = (0.2 + Math.sin(progress * Math.PI) * 0.18) * (1 + boost * 0.36);
        pulse.scale.setScalar(pulseSize);
      });

      for (let index = 0; index < 3; index += 1) {
        const wave = beacon.getObjectByName(`signalWave${index}`) as THREE.Mesh;
        const phase = (elapsed * (0.38 + boost * 0.22) + index / 3) % 1;
        wave.scale.setScalar(1 + phase * (2.6 + boost));
        (wave.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (0.2 + boost * 0.36);
      }

      const emitter = beacon.getObjectByName("emitter") as THREE.Sprite;
      emitter.scale.setScalar((0.48 + Math.sin(elapsed * 4.2) * 0.06) * (1 + boost * 0.42));
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    setSize();
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeChild(renderer.domElement);
      marsTexture.dispose();
      earthTexture.dispose();
      glowTexture?.dispose();
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
    <footer
      id="contact"
      ref={sectionRef}
      className={`contact-section${isVisible ? " is-visible" : ""}${signalActive ? " signal-active" : ""}`}
      aria-labelledby="contact-title"
    >
      <div ref={mountRef} className="contact-scene" aria-hidden="true" />
      <div className="contact-content">
        <div className="contact-main">
          <p className="contact-eyebrow">Contact / Mission Control</p>
          <h2 id="contact-title">Every mission starts with a signal.</h2>
          <p className="contact-intro">
            Building something ambitious? Send us the coordinates. We help turn early ideas into technology ready
            for the real world.
          </p>
          <a
            className="contact-cta"
            href="mailto:hello@aey-technologia.my"
            onMouseEnter={() => setSignalActive(true)}
            onMouseLeave={() => setSignalActive(false)}
            onFocus={() => setSignalActive(true)}
            onBlur={() => setSignalActive(false)}
          >
            Open a channel
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <address className="contact-meta">
          <div>
            <span>Mission Control</span>
            <p>Cybersouth, Selangor, Malaysia</p>
          </div>
          <div>
            <span>Transmission</span>
            <a href="mailto:hello@aey-technologia.my">hello@aey-technologia.my</a>
          </div>
        </address>

        <p className="contact-signoff">Made in Malaysia. Built for anywhere.</p>
      </div>
    </footer>
  );
}
