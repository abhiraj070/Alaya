import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, Sparkles, Compass, CornerDownLeft } from 'lucide-react';
import { searchUniverseNodes } from '../../utils/searchFilter.js';
import { Badge } from '../ui/Badge.jsx';

/**
 * Compact Celestial Search Control
 *
 * Fast, scored search across all knowledge nodes with direct 3D star navigation.
 */
export function SearchControl({ nodes = [], onSelectResult }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global keyboard shortcut to focus search ('/' or 'Ctrl+K')
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to dismiss search results
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchUniverseNodes(nodes, query).slice(0, 8); // Top 8 matches
  }, [nodes, query]);

  // Handle arrow key navigation in results list
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleSelect = (node) => {
    setIsOpen(false);
    if (typeof onSelectResult === 'function') {
      onSelectResult(node);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#737D89] absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search knowledge..."
          className="bg-[#0D1014]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)] focus:border-[#38BDF8]/50 text-[#F5F7FA] placeholder-[#737D89] text-xs font-mono pl-8 pr-16 py-1.5 rounded-sm outline-none w-44 sm:w-60 focus:w-72 transition-all duration-200 shadow-sm"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#737D89] hover:text-[#F5F7FA] p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-[#737D89] bg-[#11161B] border border-[rgba(255,255,255,0.06)] px-1 rounded pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Popover Panel */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-96 top-full mt-2 bg-[#0D1014]/95 backdrop-blur-2xl border border-[rgba(56,189,248,0.25)] rounded-md shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
          <div className="p-2 border-b border-[rgba(255,255,255,0.06)] bg-[#080A0C]/80 flex items-center justify-between font-mono text-[10px] text-[#737D89]">
            <span>{results.length} {results.length === 1 ? 'MATCH FOUND' : 'MATCHES FOUND'}</span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-2.5 h-2.5" /> SELECT
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
            {results.length > 0 ? (
              results.map((node, idx) => (
                <div
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 cursor-pointer transition-colors duration-100 flex flex-col gap-1 ${
                    idx === selectedIndex
                      ? 'bg-[#161C23] text-[#F5F7FA]'
                      : 'hover:bg-[#11161B] text-[#A1AAB5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-[#F5F7FA] truncate">
                      {node.title}
                    </span>
                    <Badge variant="sky" size="xs">
                      {node.cluster_name || `Sector ${node.cluster_id}`}
                    </Badge>
                  </div>

                  <p className="text-[11px] font-sans text-[#737D89] line-clamp-2 leading-relaxed">
                    {node.preview}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] font-mono text-[#737D89]">
                    <div className="flex items-center gap-1.5 truncate">
                      {node.has_source ? (
                        <FileText className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      )}
                      <span className="truncate">
                        {node.source_name || 'Direct Entry'}
                      </span>
                    </div>

                    <span className="text-[#38BDF8] flex items-center gap-1 shrink-0 font-medium">
                      <Compass className="w-3 h-3" /> Fly to star
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Search className="w-5 h-5 text-[#737D89] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono text-[#737D89]">
                  No knowledge matching "{query}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchControl;
