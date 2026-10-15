import React from 'react';
import { useUniverseData } from './hooks/useUniverseData.js';
import { useChunkDetail } from './hooks/useChunkDetail.js';
import { UniverseView } from './UniverseView.jsx';

export default function App() {
  const universe = useUniverseData();
  const detailState = useChunkDetail(universe.selectedStarId, universe.isDemo);
  return <UniverseView key={universe.isDemo ? 'demo' : 'real'} universe={universe} detailState={detailState} />;
}
