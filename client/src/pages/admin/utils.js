export const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

export const getAdminToken = () => localStorage.getItem('accessToken');

export const getAdminPayload = () => {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};
