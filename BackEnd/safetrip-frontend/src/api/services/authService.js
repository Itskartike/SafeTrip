import api from "../axios";
import ENDPOINTS from "../endpoints";

const TOKEN_KEY = "authToken";

class AuthService {
  async login(username, password) {
    console.log("Login attempt:", { username, endpoint: ENDPOINTS.AUTH.LOGIN });
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
      username,
      password,
    });
    console.log("Login response:", response.data);
    const { token, user, profile } = response.data;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return { token, user, profile };
  }

  async register(data) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, {
      username: data.username,
      password: data.password,
      email: data.email || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      contact_no: data.contact_no || "",
      role: data.role || "USER",
    });
    // Backend returns {message: "..."} on success, not token
    return response.data;
  }

  async requestOTP(email) {
    const response = await api.post(ENDPOINTS.AUTH.REQUEST_OTP, { email });
    return response.data;
  }

  async verifyOTP(email, otp) {
    const response = await api.post(ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
    const { token, user } = response.data;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return { token, user, profile: null };
  }

  async logout() {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
  }

  async getProfile() {
    const response = await api.get(ENDPOINTS.PROFILE);
    return response.data;
  }

  async updateProfile(data) {
    const formData = new FormData();
    if (data.weight !== undefined) formData.append("weight_kg", data.weight);
    if (data.height !== undefined) formData.append("height_cm", data.height);
    if (data.blood_group !== undefined)
      formData.append("blood_group", data.blood_group);
    if (data.emergency_contact_phone !== undefined)
      formData.append("relative_mobile_no", data.emergency_contact_phone);
    if (data.emergency_email !== undefined)
      formData.append("emergency_email", data.emergency_email);
    if (data.image instanceof File) formData.append("image", data.image);
    const response = await api.post(ENDPOINTS.PROFILE, formData);
    return response.data;
  }

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}

export default new AuthService();
