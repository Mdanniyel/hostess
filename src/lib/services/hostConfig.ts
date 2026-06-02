/**
 * Utility to retrieve the active Rails API url.
 * Prioritizes localStorage ('iplan_api_host'), falls back to VITE_API_URL.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const savedHost = localStorage.getItem('iplan_api_host');
    if (savedHost) {
      return savedHost;
    }
  }
  return import.meta.env.VITE_API_URL || '';
}

// Expose legacy console helper for developer convenience
if (typeof window !== 'undefined') {
  (window as any).hostessApp = {
    setHost(host: string | null) {
      if (host) {
        const sanitizedHost = host.trim().endsWith('/') ? host.trim().slice(0, -1) : host.trim();
        localStorage.setItem('iplan_api_host', sanitizedHost);
        console.log(`[Hostess PWA] API host set to: ${sanitizedHost}`);
      } else {
        localStorage.removeItem('iplan_api_host');
        console.log('[Hostess PWA] API host reset to default.');
      }
      window.location.reload();
    },
    getHost(): string {
      return getApiUrl();
    }
  };
}
