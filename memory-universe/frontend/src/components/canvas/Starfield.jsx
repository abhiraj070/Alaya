import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { getStarColor, getStarScale } from '../../utils/celestialColors.js';

// Reusable scratch object for instance matrix calculations
const tempObject = new THREE.Object3D();
const DIMMED_COLOR = new THREE.Color('#1E293B');

/**
 * High-Performance Instanced Starfield
 *
 * Renders actual knowledge chunks as individual 3D stars in a single GPU draw call.
 * Binds each instance index 1:1 to its originating Knowledge Node ID.
 * Supports non-destructive visual filtering via instance scale and color dimming.
 */
export function Starfield({
  nodes = [],
  selectedStarId = null,
  hoveredStarId = null,
  filteredNodeIds = null, // Set<number> | null
  onPointerOver = null,
  onPointerMove = null,
  onPointerOut = null,
  onClick = null,
}) {
  const meshRef = useRef(null);

  // Filter and sanitize nodes with valid 3D coordinates
  const validNodes = useMemo(() => {
    return nodes.filter(
      (node) =>
        node &&
        typeof node.id === 'number' &&
        Number.isFinite(node.x) &&
        Number.isFinite(node.y) &&
        Number.isFinite(node.z)
    );
  }, [nodes]);

  const count = validNodes.length;

  // Update instance transformations and colors whenever nodes, selection, or filters change
  useEffect(() => {
    if (!meshRef.current || count === 0) return;

    const mesh = meshRef.current;
    const hasFilter = filteredNodeIds instanceof Set;

    for (let i = 0; i < count; i++) {
      const node = validNodes[i];
      const isSelected = selectedStarId === node.id;
      const isHovered = hoveredStarId === node.id;
      const isVisible = !hasFilter || filteredNodeIds.has(node.id);

      // Position from actual persisted UMAP coordinates
      tempObject.position.set(node.x, node.y, node.z);

      // Scale: if filtered out, shrink to faint pinpoint
      let scale = getStarScale(node, isSelected, isHovered);
      if (!isVisible && !isSelected) {
        scale *= 0.2;
      }

      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);

      // Color: if filtered out, dim to faint cool grey
      if (!isVisible && !isSelected) {
        mesh.setColorAt(i, DIMMED_COLOR);
      } else {
        const color = getStarColor(node, isSelected, isHovered);
        mesh.setColorAt(i, color);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [validNodes, count, selectedStarId, hoveredStarId, filteredNodeIds]);

  if (count === 0) {
    return null;
  }

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      onPointerOver={(e) => {
        if (typeof onPointerOver === 'function' && e.instanceId !== undefined) {
          e.stopPropagation();
          const node = validNodes[e.instanceId];
          if (node) onPointerOver(node, e);
        }
      }}
      onPointerMove={(e) => {
        if (typeof onPointerMove === 'function' && e.instanceId !== undefined) {
          e.stopPropagation();
          const node = validNodes[e.instanceId];
          if (node) onPointerMove(node, e);
        }
      }}
      onPointerOut={(e) => {
        if (typeof onPointerOut === 'function') {
          e.stopPropagation();
          onPointerOut(e);
        }
      }}
      onClick={(e) => {
        if (typeof onClick === 'function' && e.instanceId !== undefined) {
          e.stopPropagation();
          const node = validNodes[e.instanceId];
          if (node) onClick(node, e);
        }
      }}
    >
      <sphereGeometry args={[0.5, 14, 14]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
