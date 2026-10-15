import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Decorative Deep-Space Dust
 *
 * Renders sparse, distant cosmic dust far beyond the celestial knowledge sphere.
 * Distinct in depth, size, and luminance to prevent any confusion with actual knowledge stars.
 * Strictly non-interactive (bypasses raycaster).
 */
export function CosmicDust({ count = 2000, radiusMin = 75, radiusMax = 220 }) {
  const pointsRef = useRef(null);

  // Check user preference for reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Generate spherical point cloud coordinates
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Uniform point distribution on spherical shells
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radiusMin + Math.random() * (radiusMax - radiusMin);

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Restrained dim cool tones (soft slate/grey/blue)
      const brightness = 0.2 + Math.random() * 0.25;
      col[i * 3] = brightness * 0.85; // R
      col[i * 3 + 1] = brightness * 0.95; // G
      col[i * 3 + 2] = brightness; // B
    }

    return { positions: pos, colors: col };
  }, [count, radiusMin, radiusMax]);

  // Gentle, ambient celestial drift
  useFrame((state, delta) => {
    if (!prefersReducedMotion && pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.005;
      pointsRef.current.rotation.x += delta * 0.002;
    }
  });

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default CosmicDust;
