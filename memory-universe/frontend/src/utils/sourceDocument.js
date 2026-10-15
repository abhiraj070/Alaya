/**
 * Alaya Memory Universe — Source Document Navigation Utility
 *
 * Formats document URLs, handles PDF page fragments, and classifies source types safely.
 */

/**
 * Construct an authenticated/browser-navigable URL to view the original source document.
 * If the document is a PDF and has an active page number, appends the standard '#page=N' fragment.
 *
 * @param {object|null} source - Source metadata object from ChunkDetailResponse
 * @param {number|null} [pageNumber=null] - Page number if chunk originated from a PDF
 * @returns {string|null} Document URL with optional page fragment, or null if direct text
 */
export function getSourceViewUrl(source, pageNumber = null) {
  if (!source || !source.data_source) {
    return null;
  }

  // Direct text entries do not have an external URL
  if (source.data_type === 'text') {
    return null;
  }

  const rawUrl = source.data_source.trim();
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return null;
  }

  // If document is a PDF and page number is provided, append #page=N
  const isPdf =
    source.tag?.toLowerCase() === 'pdf' ||
    rawUrl.toLowerCase().split('?')[0].endsWith('.pdf');

  if (isPdf && typeof pageNumber === 'number' && pageNumber > 0) {
    // Strip existing hash fragments if any
    const cleanUrl = rawUrl.split('#')[0];
    return `${cleanUrl}#page=${pageNumber}`;
  }

  return rawUrl;
}

/**
 * Format human-readable source label
 *
 * @param {string} dataType - 'docs' | 'img' | 'text'
 * @param {string|null} tag - File extension or format tag (e.g. 'pdf', 'docx', 'png')
 * @returns {string}
 */
export function formatSourceLabel(dataType, tag = null) {
  if (dataType === 'text') {
    return 'Direct Knowledge Entry';
  }

  const cleanTag = tag ? tag.toUpperCase().replace('.', '') : '';

  if (dataType === 'docs') {
    return cleanTag ? `${cleanTag} Document` : 'Uploaded Document';
  }

  if (dataType === 'img') {
    return cleanTag ? `${cleanTag} Image` : 'Uploaded Image';
  }

  return 'Knowledge Source';
}

/**
 * Extract human-readable filename from Cloudinary URL or fallback
 *
 * @param {string} url
 * @param {string} [fallback='Uploaded Document']
 * @returns {string}
 */
export function extractFilename(url, fallback = 'Uploaded Document') {
  if (!url) return fallback;
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segment = cleanUrl.replace(/\/+$/, '').split('/').pop();
    if (!segment) return fallback;
    return decodeURIComponent(segment) || fallback;
  } catch {
    return fallback;
  }
}
