import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export function registerCustomer(phone) {
  return api.post('/api/customers/register', { phone });
}

export function checkinCustomer(phone, lat, lng) {
  return api.post('/api/customers/checkin', { phone, lat, lng });
}

export function claimReward(phone) {
  return api.post('/api/customers/claim', { phone });
}

export function getCustomer(phone) {
  return api.get(`/api/customers/${phone}`);
}

export function getConfig() {
  return api.get('/api/config');
}

export function adminLogin(phone) {
  return api.post('/api/admin/login', { phone });
}

export function getAdminStats(token) {
  return api.get('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAdminCustomers(token) {
  return api.get('/api/admin/customers', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateReward(token, icon, name) {
  return api.post(
    '/api/admin/reward',
    { icon, name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export function getAdminShopInfo(token) {
  return api.get('/api/admin/shop-info', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
