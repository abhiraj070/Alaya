import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Faint Celestial Coordinate Guides
 *
 * Provides orientation in 3D space:
 * - Equatorial boundary ring at radius 40
 * - Faint longitudinal/latitudinal guide circles
 * - Center origin cross
 */
export function CelestialGrid({ radius = 40, visible = true }) {
  // Generate circular line coordinates
  const circlePoints = useMemo(() => {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return points;
  }, [radius]);

  const circleGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(circlePoints);
  }, [circlePoints]);

  useEffect(() => () => circleGeometry.dispose(), [circleGeometry]);

  return (
    <group visible={visible} raycast={() => null}>
      {/* Equatorial Plane Ring (Y = 0) */}
      <lineLoop geometry={circleGeometry}>
        <lineBasicMaterial color="#38BDF8" transparent opacity={0.12} />
      </lineLoop>

      {/* Meridian Plane Ring (X = 0) */}
      <lineLoop geometry={circleGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color="#A1AAB5" transparent opacity={0.05} />
      </lineLoop>

      {/* Prime Meridian Plane Ring (Z = 0) */}
      <lineLoop geometry={circleGeometry} rotation={[0, 0, Math.PI / 2]}>
        <lineBasicMaterial color="#A1AAB5" transparent opacity={0.05} />
      </lineLoop>

      {/* Origin Cross Markers */}
      <axesHelper args={[4]} />
    </group>
  );
}
