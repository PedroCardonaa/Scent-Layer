// Web Share API wrapper with a graceful clipboard fallback. Returns
// a short status string so the caller can decide whether to show a
// toast: 'shared' | 'copied' | 'cancelled' | 'error'.
//
// Use over plain navigator.share so we always have a path that works
// on desktop browsers (no native share sheet) and inside Vercel
// previews (where some Share targets reject the call).

export async function shareOrCopy({ title, text, url }) {
  const payload = { title, text, url };
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (e) {
      // AbortError = user cancelled the share sheet, treat as a non-error.
      if (e?.name === 'AbortError') return 'cancelled';
      // Fall through to clipboard on any other error.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'error';
  }
}
