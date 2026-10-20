"use client";

import { formatItemDate, getExtBadgeStyle, getCategoryBadgeStyle } from "@/lib/knowledge-presentation";

export default function KnowledgeCard({ item, onDelete, onOpen }) {
            // ==========================================
            // 1. DOCUMENT ITEM CARD (Equal Size Box)
            // ==========================================
            if (item.type === "document") {
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-subtle bg-surface-primary p-4 hover:border-accent-sky/40 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  {/* Header: Type Badge, Date & Delete Button */}
                  <div className="flex items-center justify-between shrink-0">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border ${getExtBadgeStyle(
                        item.fileType
                      )}`}
                    >
                      Document · {item.fileType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                        {formatItemDate(item.createdAt)}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent-sky p-1 transition-colors"
                          title="Open document in new tab"
                          aria-label={`Open ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete item"
                        aria-label={`Delete ${item.title}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="flex items-center gap-3 my-auto min-h-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface-secondary text-xs font-bold uppercase text-accent-sky font-mono">
                      {item.fileType}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-text-primary hover:text-accent-sky line-clamp-2 leading-snug transition-colors inline-block"
                          title={`Open ${item.title}`}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug" title={item.title}>
                          {item.title}
                        </h3>
                      )}
                      <p className="text-[11px] text-text-muted mt-1 font-mono">
                        {item.fileSize} • {item.meta}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Metadata Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                    <span>{item.fileSize}</span>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-sky hover:underline inline-flex items-center gap-1 font-sans font-medium"
                      >
                        <span>Open file</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span className="uppercase">{item.fileType} file</span>
                    )}
                  </div>
                </div>
              );
            }

            // ==========================================
            // 2. IMAGE ITEM CARD (Equal Size Box)
            // ==========================================
            if (item.type === "image") {
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-subtle bg-surface-primary p-4 hover:border-accent-sky/40 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  {/* Header: Type Badge, Date & Delete Button */}
                  <div className="flex items-center justify-between shrink-0">
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      Image · {item.fileType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                        {formatItemDate(item.createdAt)}
                      </span>
                      {(item.url || item.previewUrl) && (
                        <a
                          href={item.url || item.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent-sky p-1 transition-colors"
                          title="Open image in new tab"
                          aria-label={`Open ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete item"
                        aria-label={`Delete ${item.title}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Middle Thumbnail Preview */}
                  {item.previewUrl || item.url ? (
                    <a
                      href={item.url || item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-24 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-secondary my-auto shrink-0 block cursor-pointer group/thumb"
                      title="Click to view full image in new tab"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl || item.url}
                        alt={item.title}
                        className="h-full w-full object-cover object-center group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ) : (
                    <div className="relative h-24 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-secondary my-auto shrink-0 flex items-center justify-center text-text-muted text-xs font-mono">
                      Image
                    </div>
                  )}

                  {/* Bottom Details Bar */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                    <span className="truncate min-w-0 flex-1 font-medium text-text-primary" title={item.title}>
                      {item.title}
                    </span>
                    {(item.url || item.previewUrl) ? (
                      <a
                        href={item.url || item.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-sky hover:underline inline-flex items-center gap-1 font-sans font-medium shrink-0"
                      >
                        <span>Open image</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span className="shrink-0">{item.fileSize}</span>
                    )}
                  </div>
                </div>
              );
            }

            // ==========================================
            // 3. WRITTEN MEMORY CARD (Equal Size Box)
            // ==========================================
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-strong bg-surface-secondary/80 p-4 hover:border-accent-sky/50 transition-all duration-200 shadow-sm overflow-hidden"
              >
                {/* Header: Category Badge, Date & Delete Button */}
                <div className="flex items-center justify-between shrink-0">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border ${getCategoryBadgeStyle(
                      item.category
                    )}`}
                  >
                    {item.category || "Memory"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                      {formatItemDate(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete item"
                      aria-label={`Delete ${item.title}`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Middle Content: Quoted Text with Line Clamping */}
                <button type="button" onClick={() => onOpen(item)} aria-label={`Open ${item.title}`}
                  className="my-auto min-h-0 border-l-2 border-accent-sky/60 pl-3 overflow-hidden text-left cursor-pointer rounded-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky">
                  <h3 className="text-xs font-semibold text-accent-sky font-mono truncate mb-1">
                    {item.title}
                  </h3>
                  <p
                    className="text-xs text-text-primary/90 leading-relaxed italic line-clamp-3 overflow-hidden"
                    title={item.content}
                  >
                    &ldquo;{item.content}&rdquo;
                  </p>
                </button>

                {/* Bottom Details Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                  <span>{item.category || "Personal"}</span>
                  <button type="button" onClick={() => onOpen(item)} className="text-accent-sky hover:underline cursor-pointer">Open text</button>
                </div>
              </div>
            );
          }
