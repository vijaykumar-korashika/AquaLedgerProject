/** Normalize product image URLs for Vite proxy / nginx. */
export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith("/media/")) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith("/media/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }
  return url;
}
