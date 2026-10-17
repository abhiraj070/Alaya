import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { Starfield } from './Starfield.jsx';
import { StarConnections } from './StarConnections.jsx';
import { CosmicDust } from './CosmicDust.jsx';
import { CelestialGrid } from './CelestialGrid.jsx';
import { CameraRig } from './CameraRig.jsx';
import { Effects } from './Effects.jsx';
import { CanvasControlsOverlay } from './CanvasControlsOverlay.jsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * Top-level WebGL Error Boundary
 * Displays a clean fallback if the browser or hardware fails to initialize WebGL context
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[UniverseCanvas] WebGL context initialization failure:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#050505] text-[#F5F7FA]">
          <div className="w-12 h-12 rounded-full bg-[#11161B] border border-[#EF4444]/40 flex items-center justify-center mb-4 text-[#EF4444]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold mb-2 text-[#F5F7FA]">
            WebGL Initialization Failed
          </h3>
          <p className="text-xs text-[#A1AAB5] max-w-sm mb-5 leading-relaxed">
            Your browser or graphics hardware could not create a 3D WebGL context. Please verify hardware acceleration is enabled.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            icon={RefreshCw}
          >
            Retry WebGL Context
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Primary 3D Universe Canvas
 *
 * Implements camera drag suppression, precise star hover tracking,
 * smooth target flight navigation, and non-destructive star filtering.
 */
export function UniverseCanvas({
  nodes = [],
  selectedStarId = null,
  hoveredStarId = null,
  filteredNodeIds = null,
  navigationTarget = null,
  onStarClick = null,
  onStarHover = null,
  onStarUnhover = null,
  onBackgroundClick = null,
}) {
  const [resetSignal, setResetSignal] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [bloomEnabled, setBloomEnabled] = useState(true);

  // Track pointer drag distance to prevent camera rotation from triggering accidental star selection
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const wasDraggingRef = useRef(false);
  const rafHoverRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafHoverRef.current), []);

  const handlePointerDown = useCallback((e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    wasDraggingRef.current = false;
    const canvas = e.currentTarget?.querySelector('canvas') || (e.target?.tagName === 'CANVAS' ? e.target : null);
    if (canvas) {
      canvas.style.cursor = 'grabbing';
    }
  }, []);

  const handlePointerUp = useCallback((e) => {
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const distSq = dx * dx + dy * dy;
    // If pointer moved more than 10px (100px squared), treat as a camera drag, not an intentional star click
    wasDraggingRef.current = distSq > 100;
    const canvas = e.currentTarget?.querySelector('canvas') || (e.target?.tagName === 'CANVAS' ? e.target : null);
    if (canvas) {
      canvas.style.cursor = hoveredStarId !== null ? 'pointer' : 'grab';
    }
  }, [hoveredStarId]);

  const handleStarClick = useCallback(
    (node, e) => {
      if (wasDraggingRef.current) return;
      if (typeof onStarClick === 'function') {
        onStarClick(node, e);
      }
    },
    [onStarClick]
  );

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = hoveredStarId !== null ? 'pointer' : 'grab';
    }
  }, [hoveredStarId]);

  const handleStarHover = useCallback(
    (node, e) => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.cursor = 'pointer';
      }
      const clientX = e?.clientX ?? e?.nativeEvent?.clientX ?? 0;
      const clientY = e?.clientY ?? e?.nativeEvent?.clientY ?? 0;
      if (typeof onStarHover === 'function') {
        if (rafHoverRef.current) cancelAnimationFrame(rafHoverRef.current);
        rafHoverRef.current = requestAnimationFrame(() => {
          onStarHover(node, { x: clientX, y: clientY });
        });
      }
    },
    [onStarHover]
  );

  const handleStarOut = useCallback(
    (e) => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.cursor = 'grab';
      }
      if (rafHoverRef.current) cancelAnimationFrame(rafHoverRef.current);
      if (typeof onStarUnhover === 'function') {
        onStarUnhover(e);
      }
    },
    [onStarUnhover]
  );

  const handlePointerMissed = useCallback(
    (e) => {
      if (wasDraggingRef.current) return;
      if (typeof onBackgroundClick === 'function') {
        onBackgroundClick(e);
      }
    },
    [onBackgroundClick]
  );

  const handleResetCamera = useCallback(() => {
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridVisible((prev) => !prev);
  }, []);

  const handleToggleBloom = useCallback(() => {
    setBloomEnabled((prev) => !prev);
  }, []);

  return (
    <WebGLErrorBoundary>
      <div
        className="w-full h-full relative overflow-hidden bg-[#050505] select-none cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <Canvas
          camera={{
            position: [0, 25, 75],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            alpha: false,
            depth: true,
          }}
          dpr={[1, 2]} // Crisp rendering across HiDPI / Retina displays
          className="w-full h-full"
          onPointerMissed={handlePointerMissed}
        >
          {/* Deep space background clear color */}
          <color attach="background" args={['#050505']} />

          {/* Camera controls with smooth damping, view reset, and star flight */}
          <CameraRig resetSignal={resetSignal} navigationTarget={navigationTarget} />

          {/* Faint coordinate guidance rings and origin axes */}
          <CelestialGrid radius={40} visible={gridVisible} />

          {/* Sparse decorative cosmic dust in distant sphere */}
          <CosmicDust count={2500} radiusMin={75} radiusMax={230} />

          <StarConnections nodes={nodes} filteredNodeIds={filteredNodeIds} selectedStarId={selectedStarId} />

          {/* Core Knowledge Stars (InstancedMesh) */}
          <Starfield
            nodes={nodes}
            selectedStarId={selectedStarId}
            hoveredStarId={hoveredStarId}
            filteredNodeIds={filteredNodeIds}
            onClick={handleStarClick}
            onPointerOver={handleStarHover}
            onPointerMove={handleStarHover}
            onPointerOut={handleStarOut}
          />

          {/* Selective post-processing bloom */}
          <Effects enabled={bloomEnabled} />
        </Canvas>

        {/* Floating on-screen view controls (Camera Reset, Grid, Bloom) */}
        <CanvasControlsOverlay
          onResetCamera={handleResetCamera}
          gridVisible={gridVisible}
          onToggleGrid={handleToggleGrid}
          bloomEnabled={bloomEnabled}
          onToggleBloom={handleToggleBloom}
        />
      </div>
    </WebGLErrorBoundary>
  );
}
