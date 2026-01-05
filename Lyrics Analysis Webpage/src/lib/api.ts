const DEFAULT_API_BASE = 'http://localhost:8080';

export const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  DEFAULT_API_BASE;

export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export async function checkBackendConnection() {
  const response = await fetch(apiUrl('/api/v1/analysis/health'));
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export async function analyzeLyrics(lyrics: string, style = "basic") {
    const res = await fetch("http://localhost:8080/api/v1/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics, style }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}
