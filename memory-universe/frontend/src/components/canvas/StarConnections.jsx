import React, { useMemo } from 'react';
import { getStarConnections } from '../../utils/starConnections.js';

export function StarConnections({ nodes, filteredNodeIds, selectedStarId }) {
  const positions = useMemo(() => {
    const visibleNodes = nodes.filter((node) =>
      node && typeof node.id === 'number'
      && Number.isFinite(node.x) && Number.isFinite(node.y) && Number.isFinite(node.z)
      && (!(filteredNodeIds instanceof Set) || filteredNodeIds.has(node.id) || node.id === selectedStarId)
    );
    return new Float32Array(getStarConnections(visibleNodes).flatMap(([a, b]) =>
      [a.x, a.y, a.z, b.x, b.y, b.z]
    ));
  }, [nodes, filteredNodeIds, selectedStarId]);

  if (!positions.length) return null;

  return (
    <lineSegments raycast={() => null} frustumCulled={false}>
      <bufferGeometry key={positions.length}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#38BDF8" transparent opacity={0.28} depthWrite={false} toneMapped={false} />
    </lineSegments>
  );
}
