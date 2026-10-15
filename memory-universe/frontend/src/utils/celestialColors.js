import * as THREE from 'three';

/**
 * Alaya Memory Universe — Celestial Color & Palette Utility
 *
 * Restrained, scientific aesthetic matching Alaya's brand tokens:
 * - High-luminance white/silver star cores
 * - Restrained spectral accents for distinct semantic clusters
 * - High-contrast selection highlights
 */

export const CLUSTER_SPECTRAL_PALETTE = [
  '#38BDF8', // Sector 0: Sky Blue (Alaya primary)
  '#A78BFA', // Sector 1: Soft Violet
  '#2DD4BF', // Sector 2: Pale Cyan
  '#FBBF24', // Sector 3: Amber Gold
  '#34D399', // Sector 4: Mint Emerald
  '#FB7185', // Sector 5: Soft Rose
  '#818CF8', // Sector 6: Indigo Blue
  '#E2E8F0', // Sector 7: Pearl White
];

// Pre-allocated THREE.Color instances to avoid GC allocations during render passes
const colorCache = new Map();

/**
 * Retrieve or create a cached THREE.Color instance
 * @param {string} hex
 * @returns {THREE.Color}
 */
export function getCachedColor(hex) {
  if (!colorCache.has(hex)) {
    colorCache.set(hex, new THREE.Color(hex));
  }
  return colorCache.get(hex);
}

/**
 * Determine the visual color of a star based on cluster metadata and state
 *
 * @param {object} node - Universe node
 * @param {boolean} isSelected - Whether star is currently selected
 * @param {boolean} isHovered - Whether star is currently hovered
 * @returns {THREE.Color}
 */
export function getStarColor(node, isSelected = false, isHovered = false) {
  if (isSelected) {
    // Ultra-bright sky blue core for selected star
    return getCachedColor('#7DD3FC');
  }

  if (isHovered) {
    // Bright white highlight on hover
    return getCachedColor('#FFFFFF');
  }

  // If node has a cluster_id, apply restrained spectral tint
  if (node.cluster_id !== null && node.cluster_id !== undefined) {
    const paletteIndex = Math.abs(node.cluster_id) % CLUSTER_SPECTRAL_PALETTE.length;
    return getCachedColor(CLUSTER_SPECTRAL_PALETTE[paletteIndex]);
  }

  // Default knowledge star: crisp, bright white/silver
  return getCachedColor('#F1F5F9');
}

/**
 * Calculate appropriate star radius based on content length or state
 *
 * @param {object} node - Universe node
 * @param {boolean} isSelected
 * @param {boolean} isHovered
 * @returns {number} Scale multiplier
 */
export function getStarScale(node, isSelected = false, isHovered = false) {
  let baseScale = 0.55;

  // Slight variance based on content preview length to provide natural cosmic texture
  if (node?.preview) {
    const lengthFactor = Math.min(1.25, Math.max(0.85, node.preview.length / 100));
    baseScale *= lengthFactor;
  }

  if (isSelected) {
    return baseScale * 2.2;
  }

  if (isHovered) {
    return baseScale * 1.6;
  }

  return baseScale;
}
