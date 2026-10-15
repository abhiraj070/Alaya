import { useEffect, useSyncExternalStore, useCallback, useRef, useState } from 'react';
import { universeApi } from '../api/universeApi.js';
import { getStoredToken } from '../api/client.js';
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

  const refresh = useCallback(async (allowDemo = true) => {
    nodesRequest.current?.abort();
    const controller = new AbortController();
    nodesRequest.current = controller;
    setLoading(true);
    setError(null);
    setDemoNotice(null);
    setShowDisclaimer(false);
    try {
      const uploads = await universeApi.getUploads({ signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Array.isArray(uploads)) throw new Error('Invalid upload response from the Alaya backend.');
      if (uploads.length > 0) {
        setUploadedData(uploads);
      } else if (allowDemo !== false || getState().isDemo) {
        applyUniverseSnapshot(demoUniverse.getNodes(), { isDemo: true });
        setDemoNotice('Your real universe is still empty. You are exploring sample data.');
        if (!disclaimerOffered.current) {
          disclaimerOffered.current = true;
          setShowDisclaimer(true);
        }
      } else {
        setUploadedData([]);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        // Authentication and network errors never count as an empty database.
        resetStore();
        setError(err);
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
    disclaimerOffered.current = true;
    // Recheck: an upload may have arrived while the introduction was open.
    return refresh(true);
  }, [refresh]);

  const exitDemoMode = useCallback(() => {
    resetStore();
    setShowDisclaimer(false);
    refresh(false);
  }, [refresh]);

  const exploreDemo = useCallback(() => {
    disclaimerOffered.current = false;
    return refresh();
  }, [refresh]);
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
        const token = getStoredToken();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const defaultWsUrl = `${protocol}//${window.location.hostname}:8000/ws?client=universe${token ? `&token=${encodeURIComponent(token)}` : ''}`;
        const envUrl = import.meta.env?.VITE_WS_URL;
        let wsUrl;
        if (envUrl) {
          const parsed = new URL(envUrl, window.location.origin);
          parsed.searchParams.set('client', 'universe');
          if (token) parsed.searchParams.set('token', token);
          wsUrl = parsed.toString();
        } else {
          wsUrl = defaultWsUrl;
        }

        socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const message = JSON.parse(event.data);
            // Treat socket events as invalidations. REST is the sole snapshot writer,
            // so socket timing and old payloads cannot overwrite a fresh DB result.
            if (message.type === 'uploaded_data' || message.uploaded_data) refresh();
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
  }, [refresh]);

  return {
    ...snapshot, loading, error, recomputing, refresh, recompute,
    showDisclaimer, demoNotice, exploreDemo, enterDemoMode, exitDemoMode, dismissDisclaimer,
    selectStar, clearSelection, setFacetFilter, clearAllFilters, navigateToStar,
  };
}
