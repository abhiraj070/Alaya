"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatItem({
  chat,
  isCurrent = false,
  isDeleting = false,
  onSelect,
  onUpdateTitle,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title || "New chat");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Focus input when starting inline edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close dropdown menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleStartEdit = () => {
    setIsMenuOpen(false);
    setEditTitle(chat.title || "New chat");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(chat.title || "New chat");
  };

  const handleSaveEdit = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      handleCancelEdit();
      return;
    }

    if (trimmed === chat.title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      if (onUpdateTitle) {
        await onUpdateTitle(chat.id, trimmed);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update chat title:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(chat.id);
    }
  };

  // Inline editing mode directly inside chat column
  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1 w-full px-2 py-1 rounded-lg border border-accent-sky/60 bg-surface-secondary shadow-xs animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          disabled={isUpdating}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSaveEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              handleCancelEdit();
            }
          }}
          className="flex-1 min-w-0 bg-transparent text-xs text-text-primary px-1 py-0.5 focus:outline-none placeholder:text-text-muted"
          placeholder="Chat title..."
          maxLength={60}
          aria-label="Edit chat title"
        />

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSaveEdit}
          disabled={isUpdating}
          title="Save title"
          aria-label="Save title"
          className="p-1 rounded text-accent-sky hover:bg-accent-sky/20 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isUpdating ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-sky border-t-transparent" />
          ) : (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isUpdating}
          title="Cancel"
          aria-label="Cancel"
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors cursor-pointer shrink-0"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  // Standard chat item view with 3-dots action menu
  return (
    <div
      className={`group relative flex items-center justify-between w-full rounded-lg transition-all duration-150 ${
        isCurrent
          ? "bg-accent-sky/15 text-accent-sky font-medium border border-accent-sky/30 shadow-xs"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/70 border border-transparent"
      }`}
      style={{ touchAction: "pan-y" }}
    >
      {/* Clickable Title Area to Select Chat */}
      <button
        type="button"
        onClick={onSelect}
        disabled={isDeleting}
        className="flex-1 min-w-0 text-left text-xs px-2.5 py-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky/50 rounded-l-lg truncate disabled:cursor-not-allowed"
        title={chat.title || "New chat"}
      >
        <span className={`truncate block ${isDeleting ? "opacity-50" : ""}`}>
          {chat.title || "New chat"}
        </span>
      </button>

      {/* 3-dots Actions Menu Trigger OR Deleting Buffering Circle */}
      <div className="relative shrink-0 pr-1 flex items-center">
        {isDeleting ? (
          <div
            className="h-6 w-6 flex items-center justify-center text-rose-400"
            title="Deleting chat..."
            aria-label="Deleting chat..."
          >
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
          </div>
        ) : (
          <button
            ref={menuButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="Chat options"
            aria-label="Chat options"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`h-6 w-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${
              isMenuOpen
                ? "opacity-100 bg-surface-secondary text-text-primary"
                : "opacity-0 group-hover:opacity-100 md:opacity-0 focus-visible:opacity-100 text-text-muted hover:text-text-primary hover:bg-surface-secondary max-md:opacity-80"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="18" cy="12" r="1.5" />
            </svg>
          </button>
        )}

        {/* Floating 3-dots Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-xl border border-border-strong bg-surface-secondary p-1 shadow-xl backdrop-blur-md animate-fadeIn"
            role="menu"
            aria-orientation="vertical"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Edit Title Option */}
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              <svg
                className="h-3.5 w-3.5 text-text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Edit title</span>
            </button>

            {/* 2. Delete Chat Option */}
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer text-left"
              role="menuitem"
            >
              <svg
                className="h-3.5 w-3.5 text-rose-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
