"use client";

import { useState, useRef, useEffect } from "react";
import ChatEmptyState from "@/components/app/ChatEmptyState";
import ChatMessages from "@/components/app/ChatMessages";
import ChatInput from "@/components/app/ChatInput";
import DeleteMessageModal from "@/components/app/DeleteMessageModal";
import { messagesApi } from "@/lib/api";
import { normalizeMessages } from "@/lib/chat-data";
import { useAuth } from "@/lib/auth-context";

export default function Chat({ chatId, messages, setMessages, onFirstMessage }) {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const requestRef = useRef(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const scrolledUp = useRef(false);
  const isBusy = phase !== "idle";

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!scrolledUp.current) bottomRef.current?.scrollIntoView({ behavior: phase === "streaming" ? "auto" : "smooth" });
  }, [messages, phase]);

  // Sending and editing share one stream lifecycle and cancellation path.
  const submit = async (content, messageId = null) => {
    const text = content.trim();
    if (!text || requestRef.current) return;
    if (!user || !Number.isInteger(chatId)) { setError("Please sign in and select a chat."); return; }
    if (messageId !== null && !Number.isInteger(messageId)) {
      setError("This message has not been saved yet. Refresh the conversation before editing.");
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const assistantId = `assistant-${crypto.randomUUID()}`;
    setError("");
    setPhase("thinking");
    scrolledUp.current = false;
    if (messageId === null) {
      setInputValue("");
      onFirstMessage?.(text);
      setMessages((previous) => [...previous, { id: `user-${crypto.randomUUID()}`, sender: "user", text }]);
    } else {
      setMessages((previous) => {
        const index = previous.findIndex((message) => message.id === messageId);
        return previous.slice(0, index + 1).map((message) => message.id === messageId ? { ...message, text } : message);
      });
    }
    setMessages((previous) => [...previous, { id: assistantId, sender: "alaya", text: "", isStreaming: true }]);
    const onChunk = (accumulated) => {
      if (controller.signal.aborted) return;
      setPhase("streaming");
      setMessages((previous) => previous.map((message) => message.id === assistantId ? { ...message, text: accumulated } : message));
    };
    try {
      if (messageId === null) await messagesApi.sendNewMessage(chatId, text, user.id, onChunk, controller.signal);
      else await messagesApi.updateMessage(chatId, messageId, text, onChunk, controller.signal);
      if (controller.signal.aborted) return;
      setMessages((previous) => previous.map((message) => message.id === assistantId ? { ...message, isStreaming: false } : message));
      try {
        const saved = await messagesApi.getMessages(chatId, { signal: controller.signal });
        if (!controller.signal.aborted) setMessages(normalizeMessages(saved));
      } catch (syncError) {
        if (!controller.signal.aborted) setError(`Response received, but conversation refresh failed: ${syncError.message}`);
      }
    } catch (streamError) {
      if (!controller.signal.aborted) {
        setError(streamError.message);
        setMessages((previous) => previous.filter((message) => message.id !== assistantId || message.text)
          .map((message) => message.id === assistantId ? { ...message, isStreaming: false } : message));
      }
    } finally {
      if (!controller.signal.aborted) { requestRef.current = null; setPhase("idle"); }
    }
  };

  const deleteMessage = async () => {
    if (!messageToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      if (Number.isInteger(messageToDelete.id)) await messagesApi.deleteMessage(messageToDelete.id);
      setMessages((previous) => previous.filter((message) => message.id !== messageToDelete.id));
      setMessageToDelete(null);
    } catch (deleteFailure) { setDeleteError(deleteFailure.message); }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg-primary">
      <div ref={scrollRef} className="chat-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto select-text"
        onScroll={() => {
          const element = scrollRef.current;
          scrolledUp.current = element.scrollHeight - element.scrollTop - element.clientHeight > 90;
        }}>
        {messages.length === 0 ? <ChatEmptyState /> : <ChatMessages messages={messages} bottomRef={bottomRef}
          onEditMessage={(id, text) => submit(text, id)} onDeleteMessage={(message) => { setDeleteError(""); setMessageToDelete(message); }} />}
      </div>
      {error && <p role="alert" className="px-4 py-2 text-xs text-rose-400">{error}</p>}
      <ChatInput value={inputValue} disabled={isBusy} isLoading={isBusy} onChange={setInputValue} onSubmit={() => submit(inputValue)} />
      {messageToDelete && <DeleteMessageModal message={messageToDelete} error={deleteError}
        isDeleting={isDeleting} onClose={() => setMessageToDelete(null)} onConfirm={deleteMessage} />}
    </div>
  );
}
