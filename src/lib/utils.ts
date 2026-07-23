import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBustUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('/uploads/')) {
    const separator = url.includes('?') ? '&' : '?';
    // Bypasses proxy/Varnish/browser cache for recent uploads (changes every 10 seconds)
    const version = Math.floor(Date.now() / 10000);
    return `${url}${separator}cb=${version}`;
  }
  return url;
}
