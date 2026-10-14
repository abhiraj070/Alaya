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
 * Validate and clean a potential token string.
 * Strips 'Bearer ' prefix and rejects invalid placeholder values like 'undefined', 'null', etc.
 */
export function cleanToken(val) {
  if (!val || typeof val !== "string") return null;
  let trimmed = val.trim();
  if (trimmed.startsWith("Bearer ") || trimmed.startsWith("bearer ")) {
    trimmed = trimmed.slice(7).trim();
  }
  if (
    trimmed.length === 0 ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "false" ||
    trimmed === "true" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Retrieve the current access token from localStorage, sessionStorage, alaya_user, or cookies.
 * Checks all common keys to ensure tokens are never lost.
 */
export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    // 1. Check direct token keys in storage
    const directKeys = [
      "access_token",
      "token",
      "accessToken",
      "auth_token",
      "jwt",
      "alaya_access_token",
      "alaya_token",
    ];

    for (const key of directKeys) {
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      const cleaned = cleanToken(val);
      if (cleaned) {
        return cleaned;
      }
    }

    // 2. Check inside alaya_user object in storage
    const rawUser =
      localStorage.getItem("alaya_user") || sessionStorage.getItem("alaya_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        const token =
          parsed?.access_token ||
          parsed?.accessToken ||
          parsed?.token ||
          parsed?.authToken ||
          parsed?.jwt;
        const cleaned = cleanToken(token);
        if (cleaned) {
          return cleaned;
        }
      } catch {}
    }

    // 3. Check document.cookie in case access_token was set non-httpOnly
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)(?:access_token|token)=([^;]*)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        const cleaned = cleanToken(decoded);
        if (cleaned) {
          try {
            localStorage.setItem("access_token", cleaned);
          } catch {}
          return cleaned;
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Completely clear all access tokens, refresh tokens, auth sessions from localStorage, sessionStorage, and cookies.
 */
export function clearAllAuthTokens() {
  if (typeof window === "undefined") return;

  const storageKeys = [
    "access_token",
    "token",
    "accessToken",
    "refresh_token",
    "refreshToken",
    "auth_token",
    "jwt",
    "alaya_access_token",
    "alaya_refresh_token",
    "alaya_token",
    "alaya_user",
    "user",
  ];

  storageKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  });

  if (typeof document !== "undefined") {
    const cookieNames = [
      "access_token",
      "refresh_token",
      "token",
      "accessToken",
      "refreshToken",
      "session",
      "session_id",
      "jwt",
      "auth_token",
      "alaya_access_token",
      "alaya_refresh_token",
    ];

    const hostname = window.location.hostname;
    const domains = [
      "",
      hostname,
      `.${hostname}`,
      hostname.startsWith("www.") ? hostname.replace(/^www\./, "") : `www.${hostname}`,
      "localhost",
      "127.0.0.1",
    ];

    const paths = ["/", "/api", "/auth", "/app", "/profile"];

    cookieNames.forEach((name) => {
      paths.forEach((path) => {
        domains.forEach((domain) => {
          const domainPart = domain ? `; domain=${domain}` : "";
          const pathPart = path ? `; path=${path}` : "; path=/";
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${domainPart}; SameSite=Lax`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${domainPart}; SameSite=Strict`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${domainPart}; SameSite=None; Secure`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${domainPart}`;
          document.cookie = `${name}=; max-age=0${pathPart}${domainPart}`;
        });
      });
    });
  }

  try {
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

/**
 * Core fetch wrapper with JSON handling, cookie forwarding, and Bearer token authorization
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const token = getStoredAccessToken();
  const authHeaders = {};
  if (token && !options.headers?.Authorization && !options.headers?.authorization) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    credentials: "include", // Required for httpOnly JWT access_token and refresh_token cookies
    headers: {
      ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders,
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
    const data = await request("/api/user/login", {
      method: "POST",
      body: JSON.stringify({
        username: username.trim().replace(/^@/, ""),
        password,
      }),
    });

    // If backend returns tokens, store them safely in localStorage so they are never lost
    if (data && typeof window !== "undefined") {
      const token = cleanToken(data.access_token || data.token || data.accessToken);
      if (token) {
        try {
          localStorage.setItem("access_token", token);
          sessionStorage.setItem("access_token", token);
        } catch {}
      }
      const refreshToken = cleanToken(data.refresh_token || data.refreshToken);
      if (refreshToken) {
        try {
          localStorage.setItem("refresh_token", refreshToken);
          sessionStorage.setItem("refresh_token", refreshToken);
        } catch {}
      }
    }

    return data;
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
   * Logout user, clearing backend session, cookies, and local storage tokens
   * PUT /api/user/logout/{user_id}
   * @param {number} [userId]
   * @returns {Promise<{ message: string } | null>}
   */
  async logout(userId) {
    let result = null;
    if (userId && typeof userId === "number") {
      try {
        result = await request(`/api/user/logout/${userId}`, {
          method: "PUT",
        });
      } catch {
        // Backend logout failed or unreachable, continue to clean local tokens
      }
    }
    clearAllAuthTokens();
    return result;
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
   * @param {string|null} [title=null]
   * @param {string|null} [firstChat=null]
   * @returns {Promise<{ id: number, chat_title: string, user_id: number }>}
   */
  async updateChatTitle(chatId, title = null, firstChat = null) {
    return request(`/api/chat/update_chat/${chatId}`, {
      method: "PUT",
      body: JSON.stringify({
        chat_title: title !== undefined ? title : null,
        first_chat: firstChat !== undefined ? firstChat : null,
      }),
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
    const token = getStoredAccessToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
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
    const token = getStoredAccessToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    let response;
    try {
      response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
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

  /**
   * Delete uploaded data record
   * DELETE /api/uploaded_data/delete_upload/{upload_id}
   * @param {number} uploadId
   * @returns {Promise<{ detail: string }>}
   */
  async deleteUpload(uploadId) {
    return request(`/api/uploaded_data/delete_upload/${uploadId}`, {
      method: "DELETE",
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
