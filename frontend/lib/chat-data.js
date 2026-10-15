export function normalizeChat(chat) {
  return {
    id: chat.id,
    title: chat.chat_title || "New chat",
    updatedAt: chat.updated_at || chat.created_at,
    messages: [],
  };
}

export function normalizeMessages(messages) {
  return messages.map((message) => ({
    id: message.message_id ?? message.id,
    sender: message.sent_by === "USER" ? "user" : "alaya",
    text: message.message_content,
  }));
}

export function sortChats(chats) {
  return [...chats].sort((a, b) => {
    const difference = (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);
    return difference || b.id - a.id;
  });
}
