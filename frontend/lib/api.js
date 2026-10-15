const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function fetchResponse(endpoint, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: "include" });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("Unable to connect to the Alaya backend.", 0, error.message);
  }
  if (!response.ok) {
    const data = await readResponse(response);
    const detail = data?.detail || data;
    throw new ApiError(
      typeof detail === "string" ? detail : `Request failed (${response.status})`,
      response.status,
      detail,
    );
  }
  return response;
}

function readResponse(response) {
  if (response.status === 204) return null;
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response.text();
}

async function request(endpoint, options) {
  return readResponse(await fetchResponse(endpoint, options));
}

async function streamRequest(endpoint, options, onChunk) {
  const response = await fetchResponse(endpoint, options);
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      const chunk = decoder.decode(value, { stream: !done });
      text += chunk;
      if (chunk) onChunk?.(text, chunk);
      if (done) return text;
    }
  } finally {
    reader.releaseLock();
  }
}

const json = (method, body, signal) => ({ method, body: JSON.stringify(body), signal });
const usernameValue = (username) => username.trim().replace(/^@/, "");

export const authApi = {
  register: ({ name, username, password }) => request("/api/user/register", json("POST", {
    name: name.trim(), username: usernameValue(username), password,
  })),
  login: ({ username, password }) => request("/api/user/login", json("POST", {
    username: usernameValue(username), password,
  })),
  getUser: (id) => request(`/api/user/get_user/${id}`),
  updateUser: (id, updates) => request(`/api/user/update_user/${id}`, json("PUT", updates)),
  logout: (id) => request(`/api/user/logout/${id}`, { method: "PUT" }),
  deleteUser: (id) => request(`/api/user/delete_user/${id}`, { method: "DELETE" }),
};

export const chatApi = {
  createChat: (userId, title = "New chat") => request("/api/chat/create_chat", json("POST", {
    user_id: userId, chat_title: title,
  })),
  getChats: (id, options) => request(`/api/chat/get_chats/${id}`, options),
  updateChatTitle: (id, title) => request(`/api/chat/update_chat/${id}`, json("PUT", {
    chat_title: title, first_chat: null,
  })),
  deleteChat: (id) => request(`/api/chat/delete_chat/${id}`, { method: "DELETE" }),
};

function upload(endpoint, file, options) {
  const body = new FormData();
  body.append("file", file);
  return request(endpoint, { ...options, method: "POST", body });
}

export const messagesApi = {
  getMessages: (id, options) => request(`/api/messages/get_messages/${id}`, options),
  sendNewMessage: (id, content, userId, onChunk, signal) => streamRequest(
    `/api/messages/new_messages/${id}`,
    json("POST", { message_content: content, user_id: userId }, signal), onChunk,
  ),
  updateMessage: (chatId, messageId, content, onChunk, signal) => streamRequest(
    `/api/messages/update_message/${chatId}/${messageId}`,
    json("PUT", { message_content: content }, signal), onChunk,
  ),
  deleteMessage: (id) => request(`/api/messages/delete_message/${id}`, { method: "DELETE" }),
  feedKnowledge: ({ textContent, tag }, options) => {
    const params = new URLSearchParams({ text_content: textContent });
    if (tag) params.set("tag", tag);
    return request(`/api/messages/feed_knowledge?${params}`, { ...options, method: "POST" });
  },
  uploadImage: (file, options) => upload("/api/messages/image_upload", file, options),
  uploadFile: (file, options) => upload("/api/messages/file_upload", file, options),
};

export const uploadedDataApi = {
  getUploads: (id, options) => request(`/api/uploaded_data/get_uploads/${id}`, options),
  deleteUpload: (id) => request(`/api/uploaded_data/delete_upload/${id}`, { method: "DELETE" }),
};
