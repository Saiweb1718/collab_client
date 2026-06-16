import axios from 'axios';

export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
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
