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

export const CONTENT_TYPE_COLORS = {
  docs: '#EF4444', // Documents: Red
  img: '#3B82F6',  // Images: Blue
  text: '#FACC15', // Text: Yellow
};

export const NEUTRAL_FALLBACK_COLOR = '#94A3B8'; // Neutral Slate/Grey fallback

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
 * Determine the authoritative content type of a node: 'docs' | 'img' | 'text' | null
 *
 * Checks authoritative source metadata (source_type, content_type, or UploadedData data_type).
 * For records without an UploadedData source (has_source === false or no source metadata),
 * ingestion semantics represent direct text knowledge ('text').
 * Unknown/unsupported types return null so they receive the neutral fallback.
 *
 * @param {object} node
 * @returns {'docs' | 'img' | 'text' | null}
 */
export function getContentType(node) {
  if (!node || typeof node !== 'object') return null;

  // Prefer authoritative backend metadata: source_type, content_type, or node.source?.data_type
  const rawType =
    node.source_type ??
    node.content_type ??
    node.source?.data_type ??
    node.uploaded_data?.data_type;

  if (typeof rawType === 'string') {
    const normalized = rawType.trim().toLowerCase();
    if (normalized === 'docs' || normalized === 'document' || normalized === 'documents') {
      return 'docs';
    }
    if (normalized === 'img' || normalized === 'image' || normalized === 'images') {
      return 'img';
    }
    if (normalized === 'text') {
      return 'text';
    }
    // Unsupported or unrecognized string type - do not silently misclassify
    return null;
  }

  // If no source metadata is present at all, check ingestion semantics:
  // Knowledge records without an UploadedData source (has_source: false or null source) represent direct text knowledge.
  if (node.has_source === false || (!node.source && !node.uploaded_data)) {
    return 'text';
  }

  return null;
}

/**
 * Determine the visual color of a star based on content type and interaction state
 *
 * - Documents: Red (#EF4444)
 * - Images: Blue (#3B82F6)
 * - Text: Yellow (#FACC15)
 * - Unknown/unsupported: Neutral fallback (#94A3B8)
 * - Selected: Bright Sky Blue (#7DD3FC)
 * - Hovered: Bright White (#FFFFFF)
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

  const contentType = getContentType(node);
  if (contentType && CONTENT_TYPE_COLORS[contentType]) {
    return getCachedColor(CONTENT_TYPE_COLORS[contentType]);
  }

  // Neutral fallback for unknown or unsupported types
  return getCachedColor(NEUTRAL_FALLBACK_COLOR);
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
