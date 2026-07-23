import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBustUrl(url: string | null | undefined): string {
  if (!url) return '';
  let resolvedUrl = url;
  
  // Transform /uploads/... relative path to /api/uploads/... so Nginx proxies it to the backend server
  if (resolvedUrl.startsWith('/uploads/')) {
    resolvedUrl = `/api${resolvedUrl}`;
  } else if (resolvedUrl.includes('/uploads/') && !resolvedUrl.includes('/api/uploads/')) {
    resolvedUrl = resolvedUrl.replace('/uploads/', '/api/uploads/');
  }

  if (resolvedUrl.includes('/uploads/')) {
    const separator = resolvedUrl.includes('?') ? '&' : '?';
    // Bypasses proxy/Varnish/browser cache for recent uploads (changes every 10 seconds)
    const version = Math.floor(Date.now() / 10000);
    return `${resolvedUrl}${separator}cb=${version}`;
  }
  return resolvedUrl;
}
