/**
 * Alaya Memory Universe — Core API Client
 *
 * HTTP client connecting to the main Alaya FastAPI backend.
 * Uses HTTP-only cookie authentication via `credentials: 'include'`.
 */

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  get isUnauthorized() { return this.status === 401; }
}

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
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
    if (options.signal?.aborted) throw networkError;
    throw new ApiError(
      'Unable to connect to the Alaya backend. Ensure the server is running.',
      0,
      networkError.message
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try { data = await response.json(); } catch { data = {}; }
  } else {
    data = await response.text().catch(() => '');
  }

  if (!response.ok) {
    const detail = data?.detail || (typeof data === 'string' ? data : null);
    let message = 'Request failed';
    if (response.status === 401) message = 'Authentication required. Please log in.';
    else if (response.status === 403) message = 'Access denied.';
    else if (response.status === 404) message = 'Resource not found.';
    else if (response.status >= 500) message = 'Server error. Please check logs.';
    else if (detail) message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new ApiError(message, response.status, detail);
  }

  return data;
}
