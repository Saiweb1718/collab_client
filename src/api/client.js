import axios from 'axios';

// Trim + strip trailing slashes — guards against a stray space/slash in the
// VITE_API_URL env var (which otherwise corrupts the socket URL to wss://%20...).
export const SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .trim()
  .replace(/\/+$/, '');

const TOKEN_KEY = 'collab-token';
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const client = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true, // still send the cookie when same-origin (dev)
});

// Attach the bearer token on every request. This is what makes auth work when
// the frontend (Vercel) and backend (Render) are on different domains, where
// browsers block third-party cookies.
client.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Unwrap the standard { statusCode, data, message, success } envelope.
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default client;
