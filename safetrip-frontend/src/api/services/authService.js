import api from '../axios';
import ENDPOINTS from '../endpoints';

const TOKEN_KEY = 'authToken';

class AuthService {
  async login(username, password) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password });
    const { token, user, profile } = response.data;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return { token, user, profile };
  }

  async register(data) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, {
      username: data.username,
      password: data.password,
      email: data.email || '',
      full_name: data.full_name || '',
      phone: data.phone || '',
    });
    const { token, user, profile } = response.data;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return { token, user, profile };
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
    const response = await api.get(ENDPOINTS.AUTH.USER);
    return response.data;
  }

  async getProfile() {
    const response = await api.get(ENDPOINTS.PROFILE);
    return response.data;
  }

  async updateProfile(data) {
    const formData = new FormData();
    if (data.full_name !== undefined) formData.append('full_name', data.full_name);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    if (data.emergency_contact_name !== undefined) formData.append('emergency_contact_name', data.emergency_contact_name);
    if (data.emergency_contact_phone !== undefined) formData.append('emergency_contact_phone', data.emergency_contact_phone);
    if (data.image instanceof File) formData.append('image', data.image);
    const response = await api.patch(ENDPOINTS.PROFILE, formData);
    return response.data;
  }

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}

export default new AuthService();
