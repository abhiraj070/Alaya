"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatEmptyState from "@/components/app/ChatEmptyState";
import ChatMessages from "@/components/app/ChatMessages";
import ChatInput from "@/components/app/ChatInput";
import { messagesApi, chatApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Chat({ chatId, messages = [], setMessages }) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Active timers tracker & abort controller for clean cancellation & unmount handling
  const activeTimersRef = useRef([]);
  const abortControllerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  // Cancel all pending thinking/streaming timers and active network streams
  const cancelAllSimulation = useCallback(() => {
    activeTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    activeTimersRef.current = [];
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);
    setIsStreaming(false);
  }, []);

  // Clean up timers & abort controller on unmount
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


  // Core message submission handler - routes all messages to /api/messages/new_messages/{chat_id}
  const handleSendMessage = async (textOverride) => {
    const rawText = typeof textOverride === "string" ? textOverride : inputValue;
    const trimmed = rawText.trim();

    if (!trimmed || isThinking || isStreaming) return;

    setInputValue("");
    userScrolledUpRef.current = false;

    // 1. Append user message immediately
    const tempUserMsgId = `usr_${Date.now()}`;
    const userMsg = {
      id: tempUserMsgId,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check if user is authenticated with a backend user account
    if (!user?.id || typeof user.id !== "number" || !user?.isAuthenticated) {
      const defaultAnswer = `Hey there! I received your message: "${trimmed}".\n\n*(Note: You are currently using guest mode and OpenAI credits are exhausted. Please log in at /auth to save chats permanently in your database!)*`;
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: "alaya",
          text: defaultAnswer,
          isStreaming: false,
        },
      ]);
      return;
    }

    // Connect to /api/messages/new_messages/{chat_id}
    setIsThinking(true);
    const assistantMsgId = `asst_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        sender: "alaya",
        text: "",
        isStreaming: true,
      },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let targetChatId = chatId;
      if (typeof targetChatId !== "number") {
        const created = await chatApi.createChat(user.id, "New chat");
        targetChatId = created.id;
      }

      let hasReceivedFirstChunk = false;
      await messagesApi.sendNewMessage(
        targetChatId,
        trimmed,
        user.id,
        (accumulatedText) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsThinking(false);
            setIsStreaming(true);
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: accumulatedText, isStreaming: true }
                : msg
            )
          );
        },
        controller.signal
      );

      setIsStreaming(false);
      setIsThinking(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // Re-sync messages from backend to get official database IDs
      try {
        const syncedMessages = await messagesApi.getMessages(targetChatId);
        if (Array.isArray(syncedMessages) && syncedMessages.length > 0) {
          const normalized = syncedMessages.map((m) => ({
            id: m.message_id || m.id,
            sender: m.sent_by === "USER" ? "user" : "alaya",
            text: m.message_content,
          }));
          setMessages(normalized);
        }
      } catch {
        // Optimistic state remains in place if sync fails
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Backend stream error:", err);
      setIsThinking(false);
      setIsStreaming(false);
      const defaultAnswer = `I received your message: "${trimmed}".\n\n*(Note: OpenAI API credits are currently exhausted. This is a default response so you can test sending, editing, and deleting messages. Once OpenAI credits are refilled, live responses will resume!)*`;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: defaultAnswer,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Edit user message handler
  const handleEditMessage = async (messageId, newContent) => {
    const trimmed = newContent.trim();
    if (!trimmed || isThinking || isStreaming) return;

    // 1. Treat as new message: update user message text & remove trailing stale assistant reply
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === messageId);
      if (idx === -1) return prev;
      const truncated = prev.slice(0, idx + 1);
      truncated[idx] = { ...truncated[idx], text: trimmed };
      return truncated;
    });

    if (!user?.id || typeof user.id !== "number" || !user?.isAuthenticated) {
      const defaultAnswer = `I received your updated message: "${trimmed}".\n\n*(Note: You are currently using guest mode. Please log in at /auth to save chats permanently!)*`;
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: "alaya",
          text: defaultAnswer,
          isStreaming: false,
        },
      ]);
      return;
    }

    // 2. Stream regenerated response from backend PUT /api/messages/update_message/{chat_id}/{message_id}
    setIsThinking(true);
    const assistantMsgId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        sender: "alaya",
        text: "",
        isStreaming: true,
      },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let hasReceivedFirstChunk = false;
      await messagesApi.updateMessage(
        chatId,
        messageId,
        trimmed,
        (accumulatedText) => {
          if (!hasReceivedFirstChunk) {
            hasReceivedFirstChunk = true;
            setIsThinking(false);
            setIsStreaming(true);
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: accumulatedText, isStreaming: true }
                : msg
            )
          );
        },
        controller.signal
      );

      setIsStreaming(false);
      setIsThinking(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // Re-sync messages from backend to get official message IDs
      try {
        const syncedMessages = await messagesApi.getMessages(chatId);
        if (Array.isArray(syncedMessages) && syncedMessages.length > 0) {
          const normalized = syncedMessages.map((m) => ({
            id: m.message_id || m.id,
            sender: m.sent_by === "USER" ? "user" : "alaya",
            text: m.message_content,
          }));
          setMessages(normalized);
        }
      } catch {}
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Backend update message failed:", err);
      setIsThinking(false);
      setIsStreaming(false);
      const defaultAnswer = `I received your updated message: "${trimmed}".\n\n*(Note: OpenAI API credits are currently exhausted. This is a default response so you can test sending, editing, and deleting messages. Once OpenAI credits are refilled, live responses will resume!)*`;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: defaultAnswer,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      abortControllerRef.current = null;
    }
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
        isLoading={isBusy}
        onChange={setInputValue}
        onSubmit={() => handleSendMessage()}
      />
    </div>
  );
}
