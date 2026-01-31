const ENDPOINTS = {
  ALERTS: {
    LIST: "/emergency/alerts/",
    CREATE: "/emergency/alert/",
    DETAIL: (id) => `/emergency/alerts/${id}/`,
    UPDATE_STATUS: (id) => `/emergency/alerts/${id}/status/`,
    DELETE: (id) => `/api/alerts/${id}/`,
    PENDING: "/api/alerts/pending/",
  },
  AUTH: {
    LOGIN: "/auth/login/",
    LOGOUT: "/api/auth/logout/",
    REGISTER: "/register/",
    REQUEST_OTP: "/auth/request-otp/",
    SEND_OTP: "/auth/send-otp/",
    VERIFY_OTP: "/auth/verify-otp/",
    REFRESH: "/api/auth/refresh/",
    USER: "/api/auth/user/",
  },
  PROFILE: "/profile/me/",
  USERS: {
    LIST: "/api/users/",
  },
  EMERGENCY_CONTACTS: {
    LIST: "/api/emergency-contacts/",
  },
};

export default ENDPOINTS;
