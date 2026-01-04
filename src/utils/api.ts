const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function getApiUrl(path: string) {
  return isDevelopment ? `/api${path}` : `/api/proxy/api${path}`;
}