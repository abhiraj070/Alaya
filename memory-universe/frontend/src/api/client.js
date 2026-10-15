/**
 * Alaya Memory Universe — Core API Client
 *
 * Dedicated HTTP client connecting the Memory Universe frontend to the existing FastAPI backend.
 * Uses HTTP-only cookie authentication via `credentials: 'include'`.
 *
 * Constraints:
 * - Does NOT read cookies in JavaScript.
 * - Does NOT store tokens in localStorage / sessionStorage.
 * - Centralizes error handling and network resilience.
 */

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';

/**
 * Structured API Error class representing backend or network failures
 */
export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

/**
 * Perform an authenticated HTTP request to the Alaya backend.
 *
 * @param {string} endpoint - API path (e.g. '/api/universe/nodes')
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    // Strictly include cookies so the browser forwards httpOnly access_token / refresh_token
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      'Unable to connect to the Alaya backend. Ensure the server is running on http://localhost:8000.',
      0,
      networkError.message
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Parse body safely
  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    data = await response.text().catch(() => '');
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    const detail = data?.detail || (typeof data === 'string' ? data : null);
    let message = 'Request failed';

    if (response.status === 401) {
      message = 'Authentication required. Please log into Alaya in your main browser tab to view your Memory Universe.';
    } else if (response.status === 403) {
      message = 'Access denied. You do not have permission to access this resource.';
    } else if (response.status === 404) {
      message = 'The requested resource was not found.';
    } else if (response.status >= 500) {
      message = 'Backend internal server error. Please check server logs.';
    } else if (detail) {
      message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    }

    throw new ApiError(message, response.status, detail);
  }

  return data;
}

export default apiClient;
