import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRocketModel } from "./rocketModel.js";
import { getRocketOrbitPose, smoothTarget } from "./rocketOrbit.js";

const MAX_PIXEL_RATIO = 1.5;
const TRAIL_COUNT = 15;

export function OrbitalRocket({ targetRef, targetKey, hovered = false, reducedMotion = false, selectionPulse = 0 }) {
  const layerRef = useRef(null);
  const hoveredRef = useRef(hovered);
  const pulseRef = useRef(selectionPulse);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);
  useEffect(() => { pulseRef.current = selectionPulse; }, [selectionPulse]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      layer.dataset.webgl = "unavailable";
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(layer.clientWidth || 1, layer.clientHeight || 1, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute("aria-hidden", "true");
    layer.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.z = 240;
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xe7f8ff, 0x73211e, 2.15));
    const keyLight = new THREE.DirectionalLight(0xfff2d5, 3.3);
    keyLight.position.set(-4, 7, 12);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x55caff, 13, 24);
    scene.add(rimLight);

    const rocket = createRocketModel();
    scene.add(rocket);
    const flame = rocket.getObjectByName("flame");

    const trail = Array.from({ length: TRAIL_COUNT }, (_, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: index < 5 ? 0xffb34b : 0x9eeaff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 6), material);
      particle.renderOrder = -1;
      scene.add(particle);
      return particle;
    });

    let width = 1;
    let height = 1;
    let rafId = null;
    let running = true;
    let elapsed = 0;
    let lastTime = null;
    let lastPulse = pulseRef.current;
    let pulseStartedAt = -1;
    let target = null;
    let sampledAt = 0;
    let history = [];

    const resize = () => {
      width = layer.clientWidth || 1;
      height = layer.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      updatePose(0);
    };

    const sampleTarget = () => {
      const targetElement = targetRef?.current;
      if (!targetElement?.isConnected) return null;
      const rect = targetElement.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - layerRect.left,
        y: rect.top + rect.height / 2 - layerRect.top,
        width: rect.width,
        height: rect.height,
      };
    };

    const render = () => renderer.render(scene, camera);

    const updatePose = (deltaSeconds) => {
      const nextTarget = sampleTarget();
      if (!nextTarget) {
        rocket.visible = false;
        trail.forEach((particle) => { particle.visible = false; });
        render();
        return;
      }

      rocket.visible = true;
      trail.forEach((particle) => { particle.visible = true; });
      if (!target || reducedMotion) target = { x: nextTarget.x, y: nextTarget.y };
      else target = smoothTarget(target, nextTarget, deltaSeconds, 4.2);

      if (pulseRef.current !== lastPulse) {
        lastPulse = pulseRef.current;
        pulseStartedAt = elapsed;
      }
      const pulseAge = pulseStartedAt < 0 ? Infinity : elapsed - pulseStartedAt;
      const pulse = pulseAge < 0.9 ? Math.sin((pulseAge / 0.9) * Math.PI) : 0;
      const approach = 1 - pulse * 0.56;
      const pose = getRocketOrbitPose(elapsed, target, {
        radiusX: Math.max(28, nextTarget.width * 0.88) * approach,
        radiusY: Math.max(18, nextTarget.height * 0.78) * approach,
        reducedMotion,
      });
      const worldX = pose.x - width / 2;
      const worldY = height / 2 - pose.y;
      const worldDepth = pose.depth * 23;
      const modelSize = Math.max(10, Math.min(nextTarget.width, nextTarget.height) * 0.2) * (1 + pulse * 0.3);

      rocket.position.set(worldX, worldY, worldDepth);
      rocket.quaternion.set(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w);
      rocket.scale.setScalar(modelSize * pose.scale);
      rimLight.position.set(worldX - 4, worldY + 7, worldDepth + 7);
      if (layer) layer.style.zIndex = pose.depth < -0.08 ? "2" : "4";

      if (flame) {
        const flutter = 1 + Math.sin(elapsed * 17) * 0.11 + Math.sin(elapsed * 29) * 0.055;
        flame.scale.set(0.88 + Math.sin(elapsed * 21) * 0.06, flutter, 0.88 + Math.sin(elapsed * 17 + 1) * 0.06);
        rimLight.intensity = 11 + flutter * 3.5;
      }

      if (!reducedMotion) {
        sampledAt += deltaSeconds;
        if (sampledAt >= 0.045) {
          sampledAt = 0;
          history.unshift({ x: worldX, y: worldY, z: worldDepth });
          history = history.slice(0, TRAIL_COUNT);
        }
      }
      trail.forEach((particle, index) => {
        const point = history[index];
        if (!point || reducedMotion) {
          particle.material.opacity = 0;
          return;
        }
        particle.position.set(point.x, point.y, point.z - 0.15);
        particle.scale.setScalar(Math.max(0.18, 0.85 - index / (TRAIL_COUNT * 1.05)));
        particle.material.opacity = (1 - index / TRAIL_COUNT) * 0.36;
      });
      render();
    };

    const animate = (timestamp) => {
      if (!running) return;
      const delta = lastTime === null ? 0 : Math.min(Math.max((timestamp - lastTime) / 1000, 0), 0.05);
      lastTime = timestamp;
      const speed = hoveredRef.current ? 0.86 : 1;
      elapsed += delta * speed;
      updatePose(delta);
      if (!reducedMotion) rafId = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(layer);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        rafId = null;
        return;
      }
      if (running && !reducedMotion && rafId === null) {
        lastTime = null;
        rafId = window.requestAnimationFrame(animate);
      }
    });
    intersectionObserver.observe(layer);

    resize();
    updatePose(0);
    if (!reducedMotion) rafId = window.requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [targetRef, targetKey, reducedMotion]);

  return <div ref={layerRef} className="orbital-rocket-layer" aria-hidden="true" />;
}
