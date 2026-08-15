"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const services = [
  {
    id: "digital-products",
    number: "01",
    title: "Digital Products",
    description: "Web, mobile and cloud platforms engineered to scale with ambitious ideas.",
    color: "#8fd6ff",
  },
  {
    id: "ai-automation",
    number: "02",
    title: "AI & Automation",
    description: "Intelligent workflows that remove friction, sharpen decisions and accelerate teams.",
    color: "#ffffff",
  },
  {
    id: "emerging-technology",
    number: "03",
    title: "Emerging Technology",
    description: "Data, IoT and immersive systems that turn tomorrow's possibilities into working products.",
    color: "#ff694a",
  },
] as const;

function makeOrbitalGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.14, "rgba(158, 220, 255, 0.9)");
  glow.addColorStop(0.42, "rgba(73, 151, 255, 0.3)");
  glow.addColorStop(1, "rgba(34, 92, 190, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeOrbitingModule(color: string, glowTexture: THREE.Texture | null) {
  const module = new THREE.Group();
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: "#dbe9f5",
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.72,
    roughness: 0.24,
  });
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: "#172a44",
    emissive: color,
    emissiveIntensity: 0.24,
    metalness: 0.58,
    roughness: 0.3,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.105, 0), coreMaterial);
  const panelGeometry = new THREE.BoxGeometry(0.27, 0.035, 0.12);
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.x = -0.21;
  rightPanel.position.x = 0.21;

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      color,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(0.7);
  module.add(glow, core, leftPanel, rightPanel);
  module.userData.coreMaterial = coreMaterial;
  module.userData.glow = glow;
  return module;
}

export default function WhatWeDo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const activeServiceRef = useRef(0);
  const visibleRef = useRef(false);
  const [activeService, setActiveService] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    activeServiceRef.current = activeService;
  }, [activeService]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.28 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveService((current) => (current + 1) % services.length);
    }, 4600);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#b9d8ff", 0.36);
    const keyLight = new THREE.DirectionalLight("#ffd5b7", 4.8);
    keyLight.position.set(-3.5, 4.2, 5.5);
    const rimLight = new THREE.PointLight("#ff4e2f", 8, 18);
    rimLight.position.set(5, -2.5, 2.5);
    scene.add(ambient, keyLight, rimLight);

    const planet = new THREE.Group();
    scene.add(planet);

    const marsTexture = new THREE.TextureLoader().load("/mars-texture.webp");
    marsTexture.colorSpace = THREE.SRGBColorSpace;
    marsTexture.wrapS = THREE.RepeatWrapping;
    marsTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, 128, 128),
      new THREE.MeshStandardMaterial({
        map: marsTexture,
        bumpMap: marsTexture,
        bumpScale: 0.035,
        color: "#e4a181",
        roughness: 0.94,
        metalness: 0,
      }),
    );
    mars.rotation.z = -0.12;
    planet.add(mars);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 96, 96),
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
            float fresnel = pow(1.0 - abs(dot(vNormal, vViewDirection)), 2.6);
            vec3 atmosphereColor = mix(vec3(0.72, 0.12, 0.05), vec3(1.0, 0.38, 0.16), fresnel);
            gl_FragColor = vec4(atmosphereColor, fresnel * 0.72);
          }
        `,
      }),
    );
    planet.add(atmosphere);

    const glowTexture = makeOrbitalGlowTexture();
    const orbitRadii = [2.75, 3.15, 3.55];
    const orbitTilts = [0.32, -0.5, 0.68];
    const orbitRoots: THREE.Group[] = [];
    const modules: THREE.Group[] = [];

    services.forEach((service, index) => {
      const root = new THREE.Group();
      root.rotation.x = orbitTilts[index];
      root.rotation.z = (index - 1) * 0.2;

      const points = Array.from({ length: 160 }, (_, pointIndex) => {
        const angle = (pointIndex / 160) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * orbitRadii[index], 0, Math.sin(angle) * orbitRadii[index]);
      });
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: service.color,
          transparent: true,
          opacity: index === 0 ? 0.22 : 0.1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const module = makeOrbitingModule(service.color, glowTexture);
      root.add(ring, module);
      planet.add(root);
      orbitRoots.push(root);
      modules.push(module);
    });

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 320;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.45 + Math.random() * 1.8;
      const i3 = index * 3;
      dustPositions[i3] = Math.cos(angle) * radius;
      dustPositions[i3 + 1] = (Math.random() - 0.5) * 0.38;
      dustPositions[i3 + 2] = Math.sin(angle) * radius;
    }
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: "#ff9a70",
        size: 0.018,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    dust.rotation.x = 0.45;
    planet.add(dust);

    const clock = new THREE.Clock();
    let frameId = 0;

    const setSize = () => {
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const isPortrait = camera.aspect < 0.8;
      planet.position.set(isPortrait ? 0 : 2.25, isPortrait ? 1.05 : -0.15, isPortrait ? -1.25 : 0);
      planet.scale.setScalar(isPortrait ? 0.68 : 1);
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(mount);

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const visibilitySpeed = visibleRef.current ? 1 : 0.16;
      mars.rotation.y += 0.0012 * visibilitySpeed;
      dust.rotation.y -= 0.00055 * visibilitySpeed;

      modules.forEach((module, index) => {
        const angle = elapsed * (0.18 + index * 0.025) + index * 2.15;
        const radius = orbitRadii[index];
        module.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        module.rotation.y = -angle + Math.PI / 2;

        const active = activeServiceRef.current === index;
        const pulse = 1 + Math.sin(elapsed * 3.2 + index) * 0.06;
        module.scale.lerp(new THREE.Vector3(active ? 1.34 * pulse : 0.82, active ? 1.34 * pulse : 0.82, active ? 1.34 * pulse : 0.82), 0.06);
        (module.userData.coreMaterial as THREE.MeshStandardMaterial).emissiveIntensity = active ? 1.7 : 0.35;
        ((module.userData.glow as THREE.Sprite).material as THREE.SpriteMaterial).opacity = active ? 0.95 : 0.24;

        const ring = orbitRoots[index].children[0] as THREE.LineLoop;
        (ring.material as THREE.LineBasicMaterial).opacity = active ? 0.34 : 0.07;
      });

      planet.rotation.y = Math.sin(elapsed * 0.16) * 0.025;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    setSize();
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeChild(renderer.domElement);
      marsTexture.dispose();
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

  const selectedService = services[activeService];

  return (
    <section
      id="what-we-do"
      ref={sectionRef}
      className={`what-we-do${isVisible ? " is-visible" : ""}`}
      aria-labelledby="what-title"
    >
      <div ref={mountRef} className="mars-scene" aria-hidden="true" />
      <div className="what-content">
        <p className="what-eyebrow">What we do</p>
        <h2 id="what-title">We build technology for ideas that refuse to stay on Earth.</h2>

        <div className="service-interface">
          <div className="service-tabs" role="tablist" aria-label="AEY Technologia services">
            {services.map((service, index) => (
              <button
                key={service.id}
                type="button"
                role="tab"
                aria-selected={activeService === index}
                aria-controls="service-detail"
                className={activeService === index ? "is-active" : undefined}
                onClick={() => setActiveService(index)}
              >
                <span>{service.number}</span>
                {service.title}
              </button>
            ))}
          </div>

          <div id="service-detail" className="service-detail" role="tabpanel" aria-live="polite">
            <p className="service-number">Mission module {selectedService.number}</p>
            <h3 key={`${selectedService.id}-title`}>{selectedService.title}</h3>
            <p key={`${selectedService.id}-description`}>{selectedService.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
