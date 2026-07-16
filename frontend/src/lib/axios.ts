import axios from "axios"

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
    ? `http://${host}:5000/api`
    : "/api",
  withCredentials: true,
});