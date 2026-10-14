import React, { useMemo, useState, useCallback } from 'react';
import { useUniverseData } from './hooks/useUniverseData.js';
import { useChunkDetail } from './hooks/useChunkDetail.js';
import { HeaderHUD } from './components/navigation/HeaderHUD.jsx';
import { UniverseFilterBar } from './components/navigation/UniverseFilterBar.jsx';
import { UniverseCanvas } from './components/canvas/UniverseCanvas.jsx';
import { StarHoverCard } from './components/universe/StarHoverCard.jsx';
import { ChunkDetailDrawer } from './components/universe/ChunkDetailDrawer.jsx';
import { StatusBanner } from './components/universe/StatusBanner.jsx';
import { EmptyState } from './components/universe/EmptyState.jsx';
import { ErrorState } from './components/universe/ErrorState.jsx';
import { DemoDisclaimerModal } from './components/universe/DemoDisclaimerModal.jsx';
import { DemoSourceViewerModal } from './components/universe/DemoSourceViewerModal.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { filterUniverseNodes } from './utils/searchFilter.js';

export function App() {
  const {
    nodes,
    totalStars,
    isProjected,
    unprojectedCount,
    loading,
    error,
    recomputing,
    recomputeStatus,
    selectedStarId,
    navigationTarget,
    filters,
    isDemo,
    showDisclaimer,
    selectStar,
    clearSelection,
    setFacetFilter,
    clearAllFilters,
    navigateToStar,
    refresh,
    recompute,
    enterDemoMode,
    exitDemoMode,
    dismissDisclaimer,
  } = useUniverseData({ autoFetch: true });

  // Hover state (node and pointer screen coordinates)
  const [hoverState, setHoverState] = useState(null); // { node, position: { x, y } } | null

  // Demo source document inspection modal state
  const [demoDocViewer, setDemoDocViewer] = useState(null); // { sourceName, pageNumber } | null

  // Fetch full details for the currently selected star
  const {
    chunkDetail,
    loading: detailLoading,
    error: detailError,
    retry: retryDetail,
  } = useChunkDetail(selectedStarId);

  // Locate node metadata for the selected star
  const selectedNode = useMemo(() => {
    if (selectedStarId === null) return null;
    return nodes.find((n) => n.id === selectedStarId) || null;
  }, [nodes, selectedStarId]);

  // Compute filtered subset of nodes
  const filteredNodes = useMemo(() => {
    return filterUniverseNodes(nodes, filters);
  }, [nodes, filters]);

  // Set of visible node IDs for non-destructive InstancedMesh dimming
  const filteredNodeIds = useMemo(() => {
    const hasFilter =
      filters.source !== 'all' || filters.cluster !== 'all' || filters.knowledgeType !== 'all';
    if (!hasFilter) return null;
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes, filters]);

  // Extract unique cluster sectors from nodes
  const clusters = useMemo(() => {
    const clusterMap = new Map();
    nodes.forEach((n) => {
      if (n.cluster_id !== null && n.cluster_id !== undefined) {
        if (!clusterMap.has(n.cluster_id)) {
          clusterMap.set(n.cluster_id, {
            id: n.cluster_id,
            name: n.cluster_name || `Sector ${n.cluster_id}`,
          });
        }
      }
    });
    return Array.from(clusterMap.values());
  }, [nodes]);

  // Pointer interaction callbacks
  const handleStarClick = useCallback(
    (node) => {
      selectStar(node.id);
      setHoverState(null);
    },
    [selectStar]
  );

  const handleStarHover = useCallback((node, position) => {
    setHoverState({ node, position });
  }, []);

  const handleStarUnhover = useCallback(() => {
    setHoverState(null);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setHoverState(null);
    if (selectedStarId !== null) {
      clearSelection();
    }
  }, [selectedStarId, clearSelection]);

  // Search & Related star navigation trigger
  const handleNavigateToStar = useCallback(
    (targetNode) => {
      setHoverState(null);
      navigateToStar(targetNode);
    },
    [navigateToStar]
  );

  // Demo source document inspection
  const handleViewDemoSource = useCallback((sourceName, pageNumber) => {
    setDemoDocViewer({ sourceName, pageNumber: pageNumber || 1 });
  }, []);

  const handleCloseDemoSource = useCallback(() => {
    setDemoDocViewer(null);
  }, []);

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#050505] text-[#F5F7FA]">
      {/* Top Floating HUD with Search */}
      <HeaderHUD
        nodes={nodes}
        totalStars={totalStars}
        projectedCount={nodes.length}
        clusterCount={clusters.length}
        loading={loading}
        recomputing={recomputing}
        isDemo={isDemo}
        onRefresh={refresh}
        onRecompute={recompute}
        onExitDemo={exitDemoMode}
        onSelectSearchResult={handleNavigateToStar}
      />

      {/* Multifaceted Filter Bar (under Header HUD) */}
      {nodes.length > 0 && (
        <UniverseFilterBar
          nodes={nodes}
          filteredCount={filteredNodes.length}
          filters={filters}
          onSetFilter={setFacetFilter}
          onClearFilters={clearAllFilters}
        />
      )}

      {/* Main 3D Canvas Space */}
      <main className="w-full h-full relative">
        <UniverseCanvas
          nodes={nodes}
          selectedStarId={selectedStarId}
          hoveredStarId={hoverState?.node?.id ?? null}
          filteredNodeIds={filteredNodeIds}
          navigationTarget={navigationTarget}
          onStarClick={handleStarClick}
          onStarHover={handleStarHover}
          onStarUnhover={handleStarUnhover}
          onBackgroundClick={handleBackgroundClick}
        />

        {/* Compact Star Hover Preview Tooltip */}
        {hoverState && hoverState.node.id !== selectedStarId && (
          <StarHoverCard
            node={hoverState.node}
            position={hoverState.position}
          />
        )}

        {/* Slide-Out Chunk Detail Drawer */}
        {selectedNode && (
          <ChunkDetailDrawer
            node={selectedNode}
            detail={chunkDetail}
            allNodes={nodes}
            loading={detailLoading}
            error={detailError}
            onClose={clearSelection}
            onRetry={retryDetail}
            onSelectRelatedStar={handleNavigateToStar}
            onViewDemoSource={handleViewDemoSource}
          />
        )}

        {/* Loading Overlay (only shown during initial zero-state load) */}
        {loading && nodes.length === 0 && (
          <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center z-50">
            <Spinner size="lg" label="Initializing Celestial Coordinate Space..." />
          </div>
        )}

        {/* Error Overlay */}
        {error && nodes.length === 0 && (
          <ErrorState error={error} onRetry={refresh} retrying={loading} />
        )}

        {/* Empty Knowledge Base Overlay */}
        {!loading && !error && !isDemo && totalStars === 0 && (
          <EmptyState onExploreDemo={enterDemoMode} />
        )}

        {/* Status / Recomputation Warning Banner (real mode only) */}
        {!isDemo && (
          <StatusBanner
            isProjected={isProjected}
            unprojectedCount={unprojectedCount}
            recomputing={recomputing}
            recomputeStatus={recomputeStatus}
            onRecompute={recompute}
          />
        )}
      </main>

      {/* Demo Disclaimer Modal (shown when authenticated user has no knowledge) */}
      {showDisclaimer && (
        <DemoDisclaimerModal
          onContinueToDemo={enterDemoMode}
          onNotNow={dismissDisclaimer}
        />
      )}

      {/* Demo Source Document Viewer Modal */}
      {demoDocViewer && (
        <DemoSourceViewerModal
          sourceName={demoDocViewer.sourceName}
          pageNumber={demoDocViewer.pageNumber}
          onClose={handleCloseDemoSource}
        />
      )}
    </div>
  );
}

export default App;
