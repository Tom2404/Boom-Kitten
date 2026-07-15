const pluralDrawLabel = (count) => `${count} lá`;

export function getGameDisplayState({
  activePlayerId,
  myUserId,
  drawsRequired = 1,
  activePlayerName,
}) {
  if (!activePlayerId) {
    return {
      tone: 'syncing',
      eyebrow: 'Kết nối trận đấu',
      title: 'Đang đồng bộ trận đấu',
      description: 'Dữ liệu bàn chơi sẽ xuất hiện ngay khi máy chủ phản hồi.',
      liveLabel: 'Đang đồng bộ trạng thái trận đấu',
    };
  }

  if (activePlayerId === myUserId) {
    const drawLabel = pluralDrawLabel(drawsRequired);
    return {
      tone: 'turn',
      eyebrow: 'Đến lượt bạn',
      title: `Chọn bài hoặc bốc ${drawLabel}`,
      description: 'Bạn có thể đánh bài trước khi kết thúc lượt bằng cách bốc bài.',
      liveLabel: `Lượt của bạn, cần bốc ${drawLabel}`,
    };
  }

  const playerName = activePlayerName || 'đối thủ';
  return {
    tone: 'waiting',
    eyebrow: 'Lượt đối thủ',
    title: `Đang chờ ${playerName}`,
    description: drawsRequired > 1
      ? `${playerName} đang phải bốc ${pluralDrawLabel(drawsRequired)}.`
      : 'Theo dõi diễn biến và chuẩn bị nước đi tiếp theo.',
    liveLabel: `Đến lượt ${playerName}`,
  };
}
