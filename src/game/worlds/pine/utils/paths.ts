/**
 * Pine World - Path utilities
 */

function isAbsoluteUrl(url: string) {
  return /^(https?:)?\/\/|^data:|^blob:/i.test(url);
}

export function withBase(url: string) {
  const base = import.meta.env.BASE_URL ?? '/';
  if (isAbsoluteUrl(url) || url.startsWith('/')) return url;
  const baseNorm = base.endsWith('/') ? base : `${base}/`;
  const urlNorm = url.replace(/^\.?\//, '');
  return `${baseNorm}${urlNorm}`;
}
