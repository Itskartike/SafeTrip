import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://192.168.6.32:8000",
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 Request:", config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Response:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          console.error("❌ Bad Request:", data);
          break;
        case 401:
          console.error("❌ Unauthorized:", data);
          // Only redirect if not on login/register pages
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/signup")
          ) {
            localStorage.removeItem("authToken");
            window.location.href = "/login";
          }
          break;
        case 403:
          console.error("❌ Forbidden:", data);
          break;
        case 404:
          console.error("❌ Not Found:", error.config.url);
          break;
        case 500:
          console.error("❌ Server Error:", data);
          break;
        default:
          console.error("❌ Error:", status, data);
      }
    } else if (error.request) {
      console.error("❌ No response from server:", error.request);
    } else {
      console.error("❌ Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
