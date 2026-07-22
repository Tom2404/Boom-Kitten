export const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

export const formatResetStrategy = (strategy) => {
  if (strategy === 'soft_reset_ratio') return 'Nén ELO theo tỉ lệ';
  if (strategy === 'soft_reset_tiered') return 'Reset theo mốc rank';
  if (strategy === 'hard_reset') return 'Reset trắng';
  return strategy || '-';
};

export const formatSeasonStatus = (status) => {
  if (status === 'scheduled') return 'Đã lập lịch';
  if (status === 'active') return 'Đang diễn ra';
  if (status === 'ended') return 'Đã kết thúc';
  return status || '-';
};

export const formatCountdown = (targetDate, now = new Date()) => {
  const diff = new Date(targetDate) - now;
  if (!targetDate || Number.isNaN(diff) || diff <= 0) return 'Đã đến hạn';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${days > 0 ? `${days} ngày ` : ''}${hours} giờ ${minutes} phút`;
};

export const getEloResetPreview = (strategy, ratio, baseElo, currentElo) => {
  const base = Number(baseElo) || 1000;
  if (strategy === 'hard_reset') return base;
  if (strategy === 'soft_reset_tiered') {
    if (currentElo >= 2800) return 1800;
    if (currentElo >= 2200) return 1500;
    if (currentElo >= 1800) return 1300;
    if (currentElo >= 1500) return 1200;
    if (currentElo >= 1200) return 1100;
    return base;
  }
  const r = Number(ratio) || 0.5;
  return Math.max(base, Math.round(base + Math.max(0, currentElo - base) * r));
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
