import React, { useMemo, useState, useCallback } from 'react';
import { HeaderHUD } from './components/navigation/HeaderHUD.jsx';
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

export function UniverseView({ universe, detailState }) {
  const {
    nodes,
    totalStars,
    unprojectedCount,
    loading,
    error,
    recomputing,
    selectedStarId,
    navigationTarget,
    filters,
    selectStar,
    clearSelection,
    setFacetFilter,
    clearAllFilters,
    navigateToStar,
    refresh,
    recompute,
    isDemo,
    showDisclaimer,
    demoNotice,
    exploreDemo,
    enterDemoMode,
    exitDemoMode,
    dismissDisclaimer,
  } = universe;

  const [hoverState, setHoverState] = useState(null);
  const [demoDocViewer, setDemoDocViewer] = useState(null);
  const hoveredNode = hoverState && nodes.find((node) => node.id === hoverState.node.id);

  const {
    chunkDetail,
    loading: detailLoading,
    error: detailError,
    retry: retryDetail,
  } = detailState;

  const selectedNode = useMemo(() => {
    if (selectedStarId === null) return null;
    return nodes.find((n) => n.id === selectedStarId) || null;
  }, [nodes, selectedStarId]);

  const filteredNodes = useMemo(() => {
    return filterUniverseNodes(nodes, filters);
  }, [nodes, filters]);

  const filteredNodeIds = useMemo(() => {
    const hasFilter =
      filters.source !== 'all' || filters.cluster !== 'all' || filters.knowledgeType !== 'all';
    if (!hasFilter) return null;
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes, filters]);

  const handleStarClick = useCallback(
    (node) => { selectStar(node.id); setHoverState(null); },
    [selectStar]
  );

  const handleStarHover = useCallback((node, position) => {
    setHoverState({ node, position });
  }, []);

  const handleStarUnhover = useCallback(() => { setHoverState(null); }, []);

  const handleBackgroundClick = useCallback(() => {
    setHoverState(null);
    if (selectedStarId !== null) clearSelection();
  }, [selectedStarId, clearSelection]);

  const handleNavigateToStar = useCallback(
    (targetNode) => { setHoverState(null); navigateToStar(targetNode); },
    [navigateToStar]
  );

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#050505] text-[#F5F7FA]">
      <HeaderHUD
        nodes={nodes}
        loading={loading}
        connected={!loading && !error}
        recomputing={recomputing}
        isDemo={isDemo}
        onExitDemo={exitDemoMode}
        onRefresh={refresh}
        onSelectSearchResult={handleNavigateToStar}
      />

      <main className="w-full h-full relative">
        <UniverseCanvas
          nodes={nodes}
          selectedStarId={selectedStarId}
          hoveredStarId={hoveredNode?.id ?? null}
          filteredNodeIds={filteredNodeIds}
          navigationTarget={navigationTarget}
          onStarClick={handleStarClick}
          onStarHover={handleStarHover}
          onStarUnhover={handleStarUnhover}
          onBackgroundClick={handleBackgroundClick}
        />

        {hoveredNode && hoveredNode.id !== selectedStarId && (
          <StarHoverCard node={hoveredNode} position={hoverState.position} />
        )}

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
            onViewDemoSource={(sourceName, pageNumber) => setDemoDocViewer({ sourceName, pageNumber: pageNumber || 1 })}
            sourceViewerOpen={Boolean(demoDocViewer)}
          />
        )}

        {loading && nodes.length === 0 && (
          <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm flex items-center justify-center z-50">
            <Spinner size="lg" label="Initializing celestial coordinate space..." />
          </div>
        )}

        {error && !isDemo && (
          <ErrorState error={error} onRetry={refresh} retrying={loading} onExploreDemo={exploreDemo} />
        )}

        {!loading && !error && !isDemo && totalStars === 0 && (
          <EmptyState onExploreDemo={exploreDemo} />
        )}

        {!error && !isDemo && <StatusBanner
          unprojectedCount={unprojectedCount}
          recomputing={recomputing}
          onRecompute={recompute}
        />}

        {isDemo && demoNotice && (
          <div role="status" className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] p-3 bg-[#0D1014]/95 border border-[#F59E0B]/30 rounded-md text-xs text-[#F59E0B] text-center ">
            {demoNotice}
          </div>
        )}
      </main>

      {showDisclaimer && (
        <DemoDisclaimerModal onContinueToDemo={enterDemoMode} onNotNow={dismissDisclaimer} />
      )}
      {isDemo && demoDocViewer && (
        <DemoSourceViewerModal {...demoDocViewer} onClose={() => setDemoDocViewer(null)} />
      )}
    </div>
  );
}
