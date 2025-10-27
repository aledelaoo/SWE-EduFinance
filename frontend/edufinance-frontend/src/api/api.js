import axios from "axios";

// Use env if present, otherwise fall back to localhost:4000.
// This guarantees requests go to the backend instead of 5173.
const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000";

console.log("API base URL =>", BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
