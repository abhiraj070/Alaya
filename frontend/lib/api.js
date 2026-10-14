/**
 * Alaya API Client
 * Centralized, resilient HTTP client connecting the frontend to FastAPI backend endpoints.
 * Automatically handles credentials (HTTP-only JWT cookies), JSON serialization,
 * and structured error responses.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Custom API Error class with HTTP status and detail from backend
 */
export class ApiError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Core fetch wrapper with JSON handling and cookie forwarding
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    credentials: "include", // Required for httpOnly JWT access_token and refresh_token cookies
    headers: {
      ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  };

  if (options.isFormData) {
    delete config.isFormData;
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      "Unable to connect to backend server. Please verify the backend is running.",
      0,
      networkError.message
    );
  }

  // Handle No-Content responses
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const detail = data?.detail || (typeof data === "string" ? data : null);
    let message = "Request failed";

    if (detail) {
      message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } else if (response.status === 401) {
      message = "Unauthorized: Invalid or expired session";
    } else if (response.status === 403) {
      message = "Forbidden: Access denied";
    } else if (response.status === 404) {
      message = "Resource not found";
    } else if (response.status >= 500) {
      message = "Internal server error";
    }

    throw new ApiError(message, response.status, detail);
  }

  return data;
}

// ============================================================================
// 1. AUTHENTICATION & USER ENDPOINTS
// ============================================================================
export const authApi = {
  /**
   * Register a new user
   * POST /api/user/register
   * @param {{ name: string, username: string, password: string }} data
   * @returns {Promise<{ id: number, name: string, username: string }>}
   */
  async register({ name, username, password }) {
    return request("/api/user/register", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        username: username.trim().replace(/^@/, ""),
        password,
      }),
    });
  },

  /**
   * Login user and obtain HTTP-only JWT cookies
   * POST /api/user/login
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ id: number, name: string, username: string }>}
   */
  async login({ username, password }) {
    return request("/api/user/login", {
      method: "POST",
      body: JSON.stringify({
        username: username.trim().replace(/^@/, ""),
        password,
      }),
    });
  },

  /**
   * Get user by ID (requires authenticated session)
   * GET /api/user/get_user/{user_id}
   * @param {number} userId
   * @returns {Promise<{ id: number, name: string, username: string }>}
   */
  async getUser(userId) {
    return request(`/api/user/get_user/${userId}`, {
      method: "GET",
    });
  },

  /**
   * List users
   * GET /api/user/get_users
   * @returns {Promise<Array<{ id: number, name: string, username: string }>>}
   */
  async getUsers() {
    return request("/api/user/get_users", {
      method: "GET",
    });
  },

  /**
   * Update user details
   * PUT /api/user/update_user/{user_id}
   * @param {number} userId
   * @param {{ name?: string, username?: string }} updates
   * @returns {Promise<{ id: number, name: string, username: string }>}
   */
  async updateUser(userId, updates) {
    return request(`/api/user/update_user/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  /**
   * Logout user, clearing backend session and HTTP-only cookies
   * PUT /api/user/logout/{user_id}
   * @param {number} userId
   * @returns {Promise<{ message: string }>}
   */
  async logout(userId) {
    return request(`/api/user/logout/${userId}`, {
      method: "PUT",
    });
  },

  /**
   * Delete user account
   * DELETE /api/user/delete_user/{user_id}
   * @param {number} userId
   * @returns {Promise<{ detail: string }>}
   */
  async deleteUser(userId) {
    return request(`/api/user/delete_user/${userId}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// 2. CHAT SESSIONS ENDPOINTS
// ============================================================================
export const chatApi = {
  /**
   * Create a new chat session for user
   * POST /api/chat/create_chat
   * @param {number} userId
   * @param {string} [title="New Chat"]
   * @returns {Promise<{ id: number, chat_title: string, user_id: number }>}
   */
  async createChat(userId, title = "New Chat") {
    return request("/api/chat/create_chat", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        chat_title: title,
      }),
    });
  },

  /**
   * Get all chats for a user
   * GET /api/chat/get_chats/{user_id}
   * @param {number} userId
   * @returns {Promise<Array<{ id: number, chat_title: string, user_id: number }>>}
   */
  async getChats(userId) {
    return request(`/api/chat/get_chats/${userId}`, {
      method: "GET",
    });
  },

  /**
   * Get a single chat by ID
   * GET /api/chat/get_chat/{chat_id}
   * @param {number} chatId
   * @returns {Promise<{ id: number, chat_title: string, user_id: number }>}
   */
  async getChat(chatId) {
    return request(`/api/chat/get_chat/${chatId}`, {
      method: "GET",
    });
  },

  /**
   * Update chat title
   * PUT /api/chat/update_chat/{chat_id}
   * @param {number} chatId
   * @param {string} title
   * @returns {Promise<{ id: number, chat_title: string, user_id: number }>}
   */
  async updateChatTitle(chatId, title) {
    return request(`/api/chat/update_chat/${chatId}`, {
      method: "PUT",
      body: JSON.stringify({ chat_title: title }),
    });
  },

  /**
   * Delete chat
   * DELETE /api/chat/delete_chat/{chat_id}
   * @param {number} chatId
   * @returns {Promise<{ detail: string }>}
   */
  async deleteChat(chatId) {
    return request(`/api/chat/delete_chat/${chatId}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// 3. MESSAGES & KNOWLEDGE INGESTION ENDPOINTS
// ============================================================================
export const messagesApi = {
  /**
   * Get all messages in a chat
   * GET /api/messages/get_messages/{chat_id}
   * @param {number} chatId
   * @returns {Promise<Array<{ id: number, message_content: string, sent_by: string, chat_id: number, user_id: number, created_at: string }>>}
   */
  async getMessages(chatId) {
    return request(`/api/messages/get_messages/${chatId}`, {
      method: "GET",
    });
  },

  /**
   * Send a new message to chat and stream AI response chunks
   * POST /api/messages/new_messages/{chat_id}
   * @param {number} chatId
   * @param {string} content
   * @param {number} userId
   * @param {(accumulated: string, chunk: string) => void} [onChunk]
   * @param {AbortSignal} [signal]
   * @returns {Promise<string>} Full response text
   */
  async sendNewMessage(chatId, content, userId, onChunk, signal) {
    const url = `${API_BASE}/api/messages/new_messages/${chatId}`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_content: content,
          user_id: userId,
        }),
        signal,
      });
    } catch (networkError) {
      throw new ApiError(
        "Unable to connect to backend server. Please verify the backend is running.",
        0,
        networkError.message
      );
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let detail = null;
      if (contentType.includes("application/json")) {
        const json = await response.json().catch(() => ({}));
        detail = json?.detail || (typeof json === "string" ? json : null);
      } else {
        detail = await response.text().catch(() => "");
      }
      throw new ApiError(
        typeof detail === "string" && detail ? detail : `Request failed with status ${response.status}`,
        response.status,
        detail
      );
    }

    if (!response.body) {
      return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      if (typeof onChunk === "function") {
        onChunk(accumulated, chunk);
      }
    }

    return accumulated;
  },

  /**
   * Update message content and trigger AI answer regeneration (with streaming support)
   * PUT /api/messages/update_message/{chat_id}/{message_id}
   * @param {number} chatId
   * @param {number} messageId
   * @param {string} content
   * @param {(accumulated: string, chunk: string) => void} [onChunk]
   * @param {AbortSignal} [signal]
   * @returns {Promise<string>}
   */
  async updateMessage(chatId, messageId, content, onChunk, signal) {
    if (typeof onChunk !== "function") {
      return request(`/api/messages/update_message/${chatId}/${messageId}`, {
        method: "PUT",
        body: JSON.stringify({ message_content: content }),
        signal,
      });
    }

    const url = `${API_BASE}/api/messages/update_message/${chatId}/${messageId}`;
    let response;
    try {
      response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message_content: content }),
        signal,
      });
    } catch (networkError) {
      throw new ApiError(
        "Unable to connect to backend server. Please verify the backend is running.",
        0,
        networkError.message
      );
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let detail = null;
      if (contentType.includes("application/json")) {
        const json = await response.json().catch(() => ({}));
        detail = json?.detail || (typeof json === "string" ? json : null);
      } else {
        detail = await response.text().catch(() => "");
      }
      throw new ApiError(
        typeof detail === "string" && detail ? detail : `Request failed with status ${response.status}`,
        response.status,
        detail
      );
    }

    if (!response.body) {
      return "";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      onChunk(accumulated, chunk);
    }

    return accumulated;
  },

  /**
   * Delete a message by ID
   * DELETE /api/messages/delete_message/{message_id}
   * @param {number} messageId
   * @returns {Promise<{ detail: string }>}
   */
  async deleteMessage(messageId) {
    return request(`/api/messages/delete_message/${messageId}`, {
      method: "DELETE",
    });
  },

  /**
   * Feed raw text knowledge into vector index
   * POST /api/messages/feed_knowledge
   * @param {{ textContent: string, tag?: string }} data
   * @returns {Promise<{ message: string }>}
   */
  async feedKnowledge({ textContent, tag = null }) {
    const params = new URLSearchParams();
    params.set("text_content", textContent);
    if (tag) params.set("tag", tag);

    return request(`/api/messages/feed_knowledge?${params.toString()}`, {
      method: "POST",
    });
  },

  /**
   * Upload an image file to knowledge index
   * POST /api/messages/image_upload
   * @param {File} file
   * @returns {Promise<{ message: string }>}
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/messages/image_upload", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  /**
   * Upload a document file to knowledge index
   * POST /api/messages/file_upload
   * @param {File} file
   * @returns {Promise<{ message: string }>}
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/messages/file_upload", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },
};

// ============================================================================
// 4. UPLOADED DATA HISTORY ENDPOINT
// ============================================================================
export const uploadedDataApi = {
  /**
   * Get uploaded data records for user
   * GET /api/uploaded_data/get_uploads/{user_id}
   * @param {number} userId
   * @returns {Promise<Array<{ id: number, data_type: string, tag: string, data_source: string, user_id: number, created_at: string }>>}
   */
  async getUploads(userId) {
    return request(`/api/uploaded_data/get_uploads/${userId}`, {
      method: "GET",
    });
  },
};

const api = {
  auth: authApi,
  chat: chatApi,
  messages: messagesApi,
  uploadedData: uploadedDataApi,
};

export default api;
