import api from '../axios';
import ENDPOINTS from '../endpoints';

class AlertService {
  async getAllAlerts() {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.LIST);
      return response.data.data || response.data.results || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPaginatedAlerts(page = 1, pageSize = 10) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.LIST, {
        params: { page, page_size: pageSize },
      });
      return {
        results: response.data.results || response.data.data || response.data,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAlertById(id) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAlert(alertData) {
    try {
      const payload = {
        name: alertData.name,
        phone: alertData.phone,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
      };
      const response = await api.post(ENDPOINTS.ALERTS.CREATE, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAlertStatus(id, status) {
    try {
      const response = await api.patch(ENDPOINTS.ALERTS.UPDATE(id), {
        status,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAlert(id, alertData) {
    try {
      const response = await api.put(ENDPOINTS.ALERTS.UPDATE(id), alertData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAlert(id) {
    try {
      await api.delete(ENDPOINTS.ALERTS.DELETE(id));
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPendingAlerts() {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.PENDING);
      return response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async filterAlertsByStatus(status) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.LIST, {
        params: { status },
      });
      return response.data.results || response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchAlerts(query) {
    try {
      const response = await api.get(ENDPOINTS.ALERTS.LIST, {
        params: { search: query },
      });
      return response.data.results || response.data.data || response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const { data, status } = error.response;
      if (status === 400 && data) {
        const errors = {};
        Object.keys(data).forEach((key) => {
          errors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        });
        return { status, errors, message: 'Validation failed' };
      }
      return {
        status,
        message: data.detail || data.message || 'An error occurred',
        errors: data,
      };
    }
    return {
      status: 500,
      message: error.message || 'Network error',
      errors: {},
    };
  }
}

export default new AlertService();
