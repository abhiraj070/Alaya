import { useEffect, useSyncExternalStore, useCallback, useRef, useState } from 'react';
import { universeApi } from '../api/universeApi.js';
import { demoUniverse } from '../data/demoUniverse.js';
import {
  getState, subscribe, applyUniverseSnapshot,
  selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar, resetStore,
  setUploadedData,
} from '../store/universeStore.js';

// REST lifecycle lives here; the store and 3D components have no network dependency.
export function useUniverseData() {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recomputing, setRecomputing] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);
  const disclaimerOffered = useRef(false);
  const nodesRequest = useRef(null);
  const projectionRequest = useRef(null);

  const refresh = useCallback(async () => {
    nodesRequest.current?.abort();
    const controller = new AbortController();
    nodesRequest.current = controller;
    setLoading(true);
    setError(null);
    setDemoNotice(null);
    try {
      const data = await universeApi.getNodes({ signal: controller.signal });
      if (controller.signal.aborted) return;
      if (getState().isDemo && data.total_stars === 0) {
        setDemoNotice('Your real universe is still empty. You are exploring sample data.');
      } else {
        applyUniverseSnapshot(data);
        setShowDisclaimer(false);
        if (data.total_stars === 0 && !disclaimerOffered.current) {
          disclaimerOffered.current = true;
          setShowDisclaimer(true);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        if (getState().isDemo) setDemoNotice('Could not reach your real universe. The local demo is still available.');
        else setError(err);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const recompute = useCallback(async () => {
    if (getState().isDemo || projectionRequest.current) return;
    const controller = new AbortController();
    projectionRequest.current = controller;
    setRecomputing(true);
    setError(null);
    try {
      await universeApi.recomputeCoordinates({ signal: controller.signal });
      // The endpoint returns after committing coordinates; no timer or polling needed.
      if (!controller.signal.aborted) await refresh();
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (projectionRequest.current === controller) projectionRequest.current = null;
      if (!controller.signal.aborted) setRecomputing(false);
    }
  }, [refresh]);

  const enterDemoMode = useCallback(() => {
    nodesRequest.current?.abort();
    projectionRequest.current?.abort();
    projectionRequest.current = null;
    disclaimerOffered.current = true;
    setShowDisclaimer(false);
    setDemoNotice(null);
    setError(null);
    setLoading(false);
    setRecomputing(false);
    applyUniverseSnapshot(demoUniverse.getNodes(), { isDemo: true });
  }, []);

  const exitDemoMode = useCallback(() => {
    resetStore();
    setShowDisclaimer(false);
    refresh();
  }, [refresh]);

  const exploreDemo = useCallback(() => setShowDisclaimer(true), []);
  const dismissDisclaimer = useCallback(() => setShowDisclaimer(false), []);

  useEffect(() => {
    refresh();
    return () => {
      nodesRequest.current?.abort();
      projectionRequest.current?.abort();
      projectionRequest.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    let socket = null;
    let isMounted = true;
    let reconnectTimeout = null;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const defaultWsUrl = `${protocol}//${window.location.hostname}:8000/ws?client=universe`;
        const envUrl = import.meta.env?.VITE_WS_URL;
        let wsUrl;
        if (envUrl) {
          const parsed = new URL(envUrl, window.location.origin);
          parsed.searchParams.set('client', 'universe');
          wsUrl = parsed.toString();
        } else {
          wsUrl = defaultWsUrl;
        }

        socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'uploaded_data' || message.uploaded_data) {
              const data = message.data || message.uploaded_data || [];
              setUploadedData(data);
            }
          } catch {
            // Ignore non-json
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connectWs, 3000);
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, []);

  return {
    ...snapshot, loading, error, recomputing, refresh, recompute,
    showDisclaimer, demoNotice, exploreDemo, enterDemoMode, exitDemoMode, dismissDisclaimer,
    selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar,
  };
}
