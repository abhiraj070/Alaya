/**
 * Alaya Memory Universe — Search, Filtering & Proximity Utilities
 *
 * Provides scored lexical search, multi-faceted filtering, and 3D semantic proximity discovery.
 */

/**
 * Perform scored search across universe nodes.
 * Matches against title, preview excerpt, source document, knowledge type, and cluster sector.
 *
 * @param {Array<object>} nodes - Universe nodes
 * @param {string} query - Search term
 * @returns {Array<object>} Scored matching nodes sorted by relevance
 */
export function searchUniverseNodes(nodes, query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const queryTerms = cleanQuery.split(/\s+/).filter(Boolean);

  const scoredResults = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let score = 0;

    const titleLower = (node.title || '').toLowerCase();
    const previewLower = (node.preview || '').toLowerCase();
    const sourceLower = (node.source_name || (node.has_source ? 'uploaded document' : 'direct entry')).toLowerCase();
    const typeLower = (node.knowledge_type || '').toLowerCase();
    const clusterLower = (node.cluster_name || '').toLowerCase();

    // Exact matches
    if (titleLower === cleanQuery) score += 100;
    else if (titleLower.includes(cleanQuery)) score += 60;

    if (sourceLower === cleanQuery) score += 50;
    else if (sourceLower.includes(cleanQuery)) score += 35;

    if (typeLower === cleanQuery) score += 40;
    else if (typeLower.includes(cleanQuery)) score += 20;

    if (clusterLower.includes(cleanQuery)) score += 25;

    if (previewLower.includes(cleanQuery)) score += 30;

    // Multi-term matching
    let allTermsMatch = true;
    for (const term of queryTerms) {
      const termMatch =
        titleLower.includes(term) ||
        previewLower.includes(term) ||
        sourceLower.includes(term) ||
        typeLower.includes(term);
      if (termMatch) {
        score += 15;
      } else {
        allTermsMatch = false;
      }
    }

    if (allTermsMatch && queryTerms.length > 1) {
      score += 40;
    }

    if (score > 0) {
      scoredResults.push({
        node,
        score,
      });
    }
  }

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.map((r) => r.node);
}

/**
 * Filter nodes based on active multifaceted filters.
 *
 * @param {Array<object>} nodes - Universe nodes
 * @param {object} filters - Active filter configuration
 * @returns {Array<object>} Matching nodes
 */
export function filterUniverseNodes(nodes, { source = 'all', cluster = 'all', knowledgeType = 'all' } = {}) {
  return nodes.filter((node) => {
    // 1. Source filter
    if (source !== 'all') {
      if (source === '__direct__') {
        if (node.has_source) return false;
      } else {
        if (!node.has_source || node.source_name !== source) return false;
      }
    }

    // 2. Cluster sector filter
    if (cluster !== 'all') {
      if (node.cluster_id !== Number(cluster)) return false;
    }

    // 3. Knowledge type filter
    if (knowledgeType !== 'all') {
      if (node.knowledge_type !== knowledgeType) return false;
    }

    return true;
  });
}

/**
 * Extract distinct source documents with accurate chunk counts
 *
 * @param {Array<object>} nodes
 * @returns {Array<{ id: string, name: string, count: number, isDirect: boolean }>}
 */
export function getDistinctSources(nodes) {
  const counts = new Map();
  let directCount = 0;

  nodes.forEach((n) => {
    if (n.has_source && n.source_name) {
      counts.set(n.source_name, (counts.get(n.source_name) || 0) + 1);
    } else {
      directCount++;
    }
  });

  const sources = Array.from(counts.entries()).map(([name, count]) => ({
    id: name,
    name,
    count,
    isDirect: false,
  }));

  // Sort sources alphabetically
  sources.sort((a, b) => a.name.localeCompare(b.name));

  if (directCount > 0) {
    sources.unshift({
      id: '__direct__',
      name: 'Direct Knowledge Entries',
      count: directCount,
      isDirect: true,
    });
  }

  return sources;
}

/**
 * Extract distinct cluster sectors with chunk counts
 *
 * @param {Array<object>} nodes
 * @returns {Array<{ id: number, name: string, count: number }>}
 */
export function getDistinctClusters(nodes) {
  const clusters = new Map();

  nodes.forEach((n) => {
    if (n.cluster_id !== null && n.cluster_id !== undefined) {
      const existing = clusters.get(n.cluster_id);
      if (existing) {
        existing.count++;
      } else {
        clusters.set(n.cluster_id, {
          id: n.cluster_id,
          name: n.cluster_name || `Sector ${n.cluster_id}`,
          count: 1,
        });
      }
    }
  });

  return Array.from(clusters.values()).sort((a, b) => a.id - b.id);
}

/**
 * Extract distinct knowledge classifications with chunk counts
 *
 * @param {Array<object>} nodes
 * @returns {Array<{ id: string, name: string, count: number }>}
 */
export function getDistinctKnowledgeTypes(nodes) {
  const typeCounts = new Map();

  nodes.forEach((n) => {
    if (n.knowledge_type) {
      typeCounts.set(n.knowledge_type, (typeCounts.get(n.knowledge_type) || 0) + 1);
    }
  });

  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({
      id: type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Find semantically related chunks using 3D UMAP coordinate proximity and cluster affiliation.
 * (In UMAP space, 3D Euclidean distance directly approximates high-dimensional semantic similarity).
 *
 * @param {object} currentNode - The active selected node
 * @param {Array<object>} allNodes - All loaded universe nodes
 * @param {number} [limit=4] - Max related results to return
 * @returns {Array<{ node: object, distance: number, proximityPercent: number, sameCluster: boolean }>}
 */
export function getRelatedChunks(currentNode, allNodes, limit = 4) {
  if (!currentNode || !Array.isArray(allNodes) || allNodes.length <= 1) {
    return [];
  }

  const { id, x, y, z, cluster_id } = currentNode;
  const candidates = [];

  for (let i = 0; i < allNodes.length; i++) {
    const candidate = allNodes[i];
    if (candidate.id === id) continue; // Exclude self

    const dx = candidate.x - x;
    const dy = candidate.y - y;
    const dz = candidate.z - z;
    const euclideanDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const sameCluster = cluster_id !== null && candidate.cluster_id === cluster_id;

    // Weight score: cluster alignment provides an extra affinity boost
    const weightedDist = sameCluster ? euclideanDist * 0.75 : euclideanDist;

    // Approximate semantic similarity percentage (max bounding sphere radius ~ 80 units)
    const proximityPercent = Math.max(10, Math.min(99, Math.round(100 - (euclideanDist / 80) * 100)));

    candidates.push({
      node: candidate,
      distance: Number(euclideanDist.toFixed(2)),
      weightedDist,
      proximityPercent,
      sameCluster,
    });
  }

  // Sort by closest distance first
  candidates.sort((a, b) => a.weightedDist - b.weightedDist);

  return candidates.slice(0, limit);
}
