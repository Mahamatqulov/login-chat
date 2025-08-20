import axios from "axios";
import { cookies } from "./cookies";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const API = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = cookies.get("access_token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});
