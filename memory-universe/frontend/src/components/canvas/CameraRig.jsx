import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 25, 75);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

// Scratch vectors for camera math
const desiredCameraPos = new THREE.Vector3();
const targetStarPos = new THREE.Vector3();

/**
 * Camera Controller with Damping, Smooth Reset, Initial Glide, and Target Star Flight
 */
export function CameraRig({ resetSignal = 0, navigationTarget = null, onControlsReady = null }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [isResetting, setIsResetting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [initialEntrance, setInitialEntrance] = useState(!prefersReducedMotion);

  const lastNavTimestampRef = useRef(0);

  // Notify parent of controls instance
  useEffect(() => {
    if (controlsRef.current && typeof onControlsReady === 'function') {
      onControlsReady(controlsRef.current);
    }
  }, [onControlsReady]);

  // Initial camera entrance animation setup
  useEffect(() => {
    if (!prefersReducedMotion && initialEntrance) {
      camera.position.set(0, 45, 110);
      camera.lookAt(0, 0, 0);
    }
  }, [camera, prefersReducedMotion, initialEntrance]);

  // Handle external reset trigger
  useEffect(() => {
    if (resetSignal > 0) {
      setIsNavigating(false);
      if (prefersReducedMotion) {
        camera.position.copy(DEFAULT_CAMERA_POS);
        if (controlsRef.current) {
          controlsRef.current.target.copy(DEFAULT_TARGET);
          controlsRef.current.update();
        }
      } else {
        setIsResetting(true);
      }
    }
  }, [resetSignal, camera, prefersReducedMotion]);

  // Handle star navigation target changes
  useEffect(() => {
    if (navigationTarget && navigationTarget.timestamp !== lastNavTimestampRef.current) {
      lastNavTimestampRef.current = navigationTarget.timestamp;
      setIsResetting(false);
      setInitialEntrance(false);

      const { x, y, z } = navigationTarget;
      targetStarPos.set(x, y, z);

      // Compute optimal viewing position: ~14 units offset along line from origin through star
      const dir = targetStarPos.clone();
      if (dir.lengthSq() < 0.1) {
        dir.set(0, 0.4, 1.0);
      }
      dir.normalize();

      desiredCameraPos.copy(targetStarPos).addScaledVector(dir, 14.0);
      desiredCameraPos.y += 2.5; // Slight elevation for better perspective

      if (prefersReducedMotion) {
        camera.position.copy(desiredCameraPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetStarPos);
          controlsRef.current.update();
        }
      } else {
        setIsNavigating(true);
      }
    }
  }, [navigationTarget, camera, prefersReducedMotion]);

  // Smooth lerping during reset, flight, or initial glide
  useFrame((_, delta) => {
    // 1. Initial entrance glide
    if (initialEntrance) {
      camera.position.lerp(DEFAULT_CAMERA_POS, delta * 2.0);
      if (camera.position.distanceTo(DEFAULT_CAMERA_POS) < 0.2) {
        camera.position.copy(DEFAULT_CAMERA_POS);
        setInitialEntrance(false);
      }
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      return;
    }

    // 2. Camera reset animation
    if (isResetting && controlsRef.current) {
      camera.position.lerp(DEFAULT_CAMERA_POS, delta * 4.0);
      controlsRef.current.target.lerp(DEFAULT_TARGET, delta * 4.0);

      const posDist = camera.position.distanceTo(DEFAULT_CAMERA_POS);
      const targetDist = controlsRef.current.target.distanceTo(DEFAULT_TARGET);

      if (posDist < 0.1 && targetDist < 0.05) {
        camera.position.copy(DEFAULT_CAMERA_POS);
        controlsRef.current.target.copy(DEFAULT_TARGET);
        setIsResetting(false);
      }
      controlsRef.current.update();
      return;
    }

    // 3. Navigate to selected star
    if (isNavigating && controlsRef.current) {
      camera.position.lerp(desiredCameraPos, delta * 4.0);
      controlsRef.current.target.lerp(targetStarPos, delta * 4.5);

      const posDist = camera.position.distanceTo(desiredCameraPos);
      const targetDist = controlsRef.current.target.distanceTo(targetStarPos);

      if (posDist < 0.2 && targetDist < 0.1) {
        camera.position.copy(desiredCameraPos);
        controlsRef.current.target.copy(targetStarPos);
        setIsNavigating(false);
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={true}
      dampingFactor={0.06}
      minDistance={5}
      maxDistance={220}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
      enablePan={true}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      onChange={() => {
        // Cancel automated lerps immediately if user initiates interaction
        if (isResetting) setIsResetting(false);
        if (isNavigating) setIsNavigating(false);
        if (initialEntrance) setInitialEntrance(false);
      }}
    />
  );
}

export default CameraRig;
