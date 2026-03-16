/**
 * Escapes HTML-significant characters to prevent XSS in raw HTML contexts
 * (e.g., Leaflet popup/tooltip template literals).
 *
 * @param str - Value to escape. Non-strings are coerced via String().
 * @returns HTML-safe string with &, <, >, ", ' escaped.
 */
export function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
