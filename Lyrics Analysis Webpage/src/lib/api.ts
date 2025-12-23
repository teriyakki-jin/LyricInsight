const DEFAULT_API_BASE = 'http://localhost:8080';

export const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  DEFAULT_API_BASE;

export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
