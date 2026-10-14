"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatEmptyState from "@/components/app/ChatEmptyState";
import ChatMessages from "@/components/app/ChatMessages";
import ChatInput from "@/components/app/ChatInput";
import { findMockResponse } from "@/mock/chat";
import { messagesApi } from "@/lib/api";

export default function Chat({ chatId, messages = [], setMessages }) {
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Active timers tracker for clean cancellation & unmount handling
  const activeTimersRef = useRef([]);
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  // Cancel all pending thinking/streaming timers
  const cancelAllSimulation = useCallback(() => {
    activeTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    activeTimersRef.current = [];
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      cancelAllSimulation();
    };
  }, [cancelAllSimulation]);

  // Track if user manually scrolled upward
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    userScrolledUpRef.current = distanceFromBottom > 90;
  };

  // Auto-scroll to newest message if user is near bottom
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isThinking, isStreaming]);

  // Generates and progressively streams assistant response for a given prompt
  const triggerAssistantResponse = useCallback((promptText) => {
    const matched = findMockResponse(promptText);

    setIsThinking(true);

    const thinkTimer = setTimeout(() => {
      setIsThinking(false);

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        const assistantMsg = {
          id: `asst_${Date.now()}`,
          sender: "alaya",
          text: matched.text,
          source: matched.source,
          isStreaming: false,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      setIsStreaming(true);
      const assistantMsgId = `asst_${Date.now()}`;
      const words = matched.text.split(" ");
      let currentWordIndex = 0;
      const batchSize = 3;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: "alaya",
          text: "",
          source: matched.source,
          isStreaming: true,
        },
      ]);

      const streamTimer = setInterval(() => {
        currentWordIndex = Math.min(currentWordIndex + batchSize, words.length);
        const currentChunk = words.slice(0, currentWordIndex).join(" ");

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  text: currentChunk,
                  isStreaming: currentWordIndex < words.length,
                }
              : msg
          )
        );

        if (currentWordIndex >= words.length) {
          clearInterval(streamTimer);
          setIsStreaming(false);
        }
      }, 45);

      activeTimersRef.current.push(streamTimer);
    }, 700);

    activeTimersRef.current.push(thinkTimer);
  }, [setMessages]);

  // Core message submission handler
  const handleSendMessage = (textOverride) => {
    const rawText = typeof textOverride === "string" ? textOverride : inputValue;
    const trimmed = rawText.trim();

    if (!trimmed || isThinking || isStreaming) return;

    setInputValue("");
    userScrolledUpRef.current = false;

    // 1. Append user message immediately
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    triggerAssistantResponse(trimmed);
  };

  // Edit user message handler
  const handleEditMessage = async (messageId, newContent) => {
    const trimmed = newContent.trim();
    if (!trimmed || isThinking || isStreaming) return;

    // 1. Persist update to backend if this is a stored message in a backend chat
    if (typeof messageId === "number" && typeof chatId === "number") {
      try {
        await messagesApi.updateMessage(chatId, messageId, trimmed);
      } catch (err) {
        console.error("Failed to update message in backend:", err);
      }
    }

    // 2. Treat as new message: update user message text & remove trailing stale assistant reply
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === messageId);
      if (idx === -1) return prev;
      const truncated = prev.slice(0, idx + 1);
      truncated[idx] = { ...truncated[idx], text: trimmed };
      return truncated;
    });

    // 3. Trigger new assistant response for the updated prompt
    triggerAssistantResponse(trimmed);
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId) => {
    if (typeof messageId === "number") {
      try {
        await messagesApi.deleteMessage(messageId);
      } catch (err) {
        console.error("Failed to delete message in backend:", err);
      }
    }

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const isBusy = isThinking || isStreaming;

  return (
    <div
      className="relative flex flex-col h-full w-full overflow-hidden bg-bg-primary"
      onWheel={(e) => {
        if (scrollContainerRef.current && !scrollContainerRef.current.contains(e.target)) {
          scrollContainerRef.current.scrollTop += e.deltaY;
        }
      }}
    >
      {/* Main Conversation Scrollable Region with ChatGPT-style autohiding scrollbar */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto chat-scrollbar flex flex-col justify-between select-text"
        style={{ touchAction: "pan-y" }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ChatMessages
            messages={messages}
            isThinking={isThinking}
            bottomRef={bottomRef}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        )}
      </div>

      {/* Message Composer Anchored at Bottom */}
      <ChatInput
        value={inputValue}
        disabled={isBusy}
        onChange={setInputValue}
        onSubmit={() => handleSendMessage()}
      />
    </div>
  );
}
