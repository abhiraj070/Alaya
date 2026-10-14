"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";

export default function ChatItem({
  chat,
  isCurrent = false,
  onSelect,
  onUpdateTitle,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title || "New chat");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
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

  // Close dropdown menu on click outside or escape
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

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 120);
    }
    setIsMenuOpen((prev) => !prev);
  };

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
        className="flex items-center gap-1.5 w-full h-9 px-2 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn"
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
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-800 dark:text-slate-100 px-1 py-0.5 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
          className="h-6 w-6 flex items-center justify-center rounded-[6px] text-accent-sky hover:bg-accent-sky/15 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isUpdating}
          title="Cancel"
          aria-label="Cancel"
          className="h-6 w-6 flex items-center justify-center rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // Standard chat item view with 3-dots action menu
  return (
    <div
      className={`group relative flex items-center justify-between w-full h-9 px-2 rounded-[10px] transition-colors duration-150 ${
        isCurrent
          ? "bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
      }`}
      style={{ touchAction: "pan-y" }}
    >
      {/* Clickable Title Area to Select Chat */}
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 text-left text-xs py-1.5 px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 rounded-md truncate"
        title={chat.title || "New chat"}
      >
        <span className="truncate block">{chat.title || "New chat"}</span>
      </button>

      {/* 3-dots Actions Menu Trigger */}
      <div className="relative shrink-0 pl-1">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={handleToggleMenu}
          title="Chat options"
          aria-label="Chat options"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className={`h-7 w-7 flex items-center justify-center rounded-[8px] transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 ${
            isMenuOpen || isCurrent
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 md:opacity-0 focus-visible:opacity-100 max-md:opacity-100"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Floating 3-dots Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className={`absolute right-0 z-50 min-w-[148px] rounded-xl border border-slate-200/90 dark:border-border-strong bg-white/95 dark:bg-surface-primary/95 backdrop-blur-md p-1.5 shadow-lg shadow-black/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] space-y-1 animate-fadeIn ${
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
            role="menu"
            aria-orientation="vertical"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Edit / Rename Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              className="group/btn flex w-full h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-slate-700 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary bg-transparent hover:bg-slate-100 dark:hover:bg-surface-secondary border border-transparent hover:border-slate-200/60 dark:hover:border-border-subtle transition-all duration-150 cursor-pointer text-left select-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-slate-400 dark:focus-visible:ring-accent-sky/50"
              role="menuitem"
            >
              <Pencil
                className="h-4 w-4 text-slate-500 dark:text-text-muted group-hover/btn:text-slate-800 dark:group-hover/btn:text-text-primary transition-colors shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Rename</span>
            </button>

            {/* Subtle Separator */}
            <div className="border-t border-slate-100 dark:border-border-subtle/80 my-0.5" role="separator" />

            {/* 2. Delete Chat Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="group/btn flex w-full h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200/70 dark:hover:border-rose-500/20 transition-all duration-150 cursor-pointer text-left select-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-rose-400"
              role="menuitem"
            >
              <Trash2
                className="h-4 w-4 text-rose-500 dark:text-rose-400 group-hover/btn:text-rose-600 dark:group-hover/btn:text-rose-300 transition-colors shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
