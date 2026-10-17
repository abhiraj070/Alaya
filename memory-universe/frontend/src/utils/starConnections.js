export function getStarConnections(nodes) {
  const edges = new Map();

  nodes.forEach((node, index) => {
    const nearest = [];
    nodes.forEach((other, otherIndex) => {
      if (index === otherIndex) return;
      const distance = (node.x - other.x) ** 2 + (node.y - other.y) ** 2 + (node.z - other.z) ** 2;
      nearest.push({ index: otherIndex, distance });
      nearest.sort((a, b) => a.distance - b.distance);
      if (nearest.length > 2) nearest.pop();
    });

    nearest.forEach(({ index: otherIndex }) => {
      const key = `${Math.min(index, otherIndex)}:${Math.max(index, otherIndex)}`;
      edges.set(key, [node, nodes[otherIndex]]);
    });
  });

  return Array.from(edges.values());
}
