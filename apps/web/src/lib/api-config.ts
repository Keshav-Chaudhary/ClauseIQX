/**
 * Resolves the base URL for ClauseIQX backend API calls.
 * - Respects NEXT_PUBLIC_API_URL if configured.
 * - In local browser development (localhost:3000), falls back to http://localhost:4000 if not proxying.
 * - In deployed cloud environments (e.g. Render, Vercel), uses relative URL paths ('')
 *   so requests route seamlessly through Next.js rewrites or same-origin domain without CORS issues.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    // If the browser is on localhost:3000 during separate local dev servers, default to 4000
    if (window.location.port === '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:4000';
    }
    // In production or unified host, use same-origin relative path
    return '';
  }

  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
}
