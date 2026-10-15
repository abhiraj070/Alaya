import React, { Component } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

/**
 * Error boundary for WebGL post-processing passes.
 * If postprocessing shaders fail to compile or device lacks float textures,
 * catches error and cleanly renders scene without postprocessing.
 */
class PostprocessingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[MemoryUniverse] Postprocessing disabled due to WebGL error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Restrained Cosmic Post-Processing
 *
 * Applies a gentle bloom glow strictly to high-luminance star cores,
 * maintaining true deep-black background space.
 */
export function Effects({ enabled = true }) {
  if (!enabled) return null;

  return (
    <PostprocessingErrorBoundary>
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom
          luminanceThreshold={0.82}
          luminanceSmoothing={0.15}
          intensity={0.65}
          mipmapBlur={true}
        />
      </EffectComposer>
    </PostprocessingErrorBoundary>
  );
}
