"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "@/components/app/ChatHeader";
import ChatEmptyState from "@/components/app/ChatEmptyState";
import ChatMessages from "@/components/app/ChatMessages";
import ChatInput from "@/components/app/ChatInput";
import { findMockResponse, mockConversation } from "@/mock/chat";

export default function Chat({ messages = [], setMessages }) {
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

  // Core message submission handler
  const handleSendMessage = (textOverride) => {
    const rawText = typeof textOverride === "string" ? textOverride : inputValue;
    const trimmed = rawText.trim();

    // Guard against empty input or concurrent submission while processing
    if (!trimmed || isThinking || isStreaming) return;

    // Clear input
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

    // 2. Select response from local mock knowledge engine
    const matched = findMockResponse(trimmed);

    // 3. Initiate simulated thinking state
    setIsThinking(true);

    const thinkTimer = setTimeout(() => {
      setIsThinking(false);

      // Check prefers-reduced-motion
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        // Immediate response without progressive animation for reduced motion
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

      // 4. Batched simulated streaming
      setIsStreaming(true);
      const assistantMsgId = `asst_${Date.now()}`;
      const words = matched.text.split(" ");
      let currentWordIndex = 0;
      const batchSize = 3; // 3 words per tick (~45ms) for smooth, non-laggy progressive reveal

      // Add assistant placeholder message
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
  };

  const handleResetConversation = () => {
    cancelAllSimulation();
    setMessages([]);
  };

  const handleLoadSampleConversation = () => {
    cancelAllSimulation();
    setMessages(mockConversation);
  };

  const isBusy = isThinking || isStreaming;

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-bg-primary">
      {/* Conversation Header Bar */}
      <ChatHeader
        onResetConversation={handleResetConversation}
        hasMessages={messages.length > 0}
      />

      {/* Main Conversation Scrollable Region */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col justify-between select-text"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center">
            <ChatEmptyState
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              disabled={isBusy}
            />
            {/* Quick action to restore sample conversation */}
            <div className="pb-4 text-center">
              <button
                type="button"
                onClick={handleLoadSampleConversation}
                className="text-xs text-text-muted hover:text-accent-sky underline cursor-pointer transition-colors"
              >
                Load sample research conversation
              </button>
            </div>
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isThinking={isThinking}
            bottomRef={bottomRef}
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
