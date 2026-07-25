const User = require('../../models/User');
const Season = require('../../models/Season');
const Transaction = require('../../models/Transaction');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

function getSeasonEndReward(rank) {
  if (rank === 'Legend') return 100;
  if (rank?.startsWith('Diamond')) return 60;
  if (rank?.startsWith('Platinum')) return 45;
  if (rank?.startsWith('Gold')) return 30;
  if (rank?.startsWith('Silver')) return 15;
  return 10;
}

function getTieredResetElo(rank) {
  if (rank === 'Legend') return 1800;
  if (rank?.startsWith('Diamond')) return 1500;
  if (rank?.startsWith('Platinum')) return 1300;
  if (rank?.startsWith('Gold')) return 1200;
  if (rank?.startsWith('Silver')) return 1100;
  return 1000;
}

function calculateResetElo({ strategy, elo, rank, baseElo, ratio }) {
  if (strategy === 'soft_reset_ratio') {
    return Math.round(baseElo + Math.max(0, elo - baseElo) * ratio);
  }
  if (strategy === 'soft_reset_tiered') {
    return Math.round(Math.max(baseElo, Math.min(elo, getTieredResetElo(rank))));
  }
  return Math.round(baseElo);
}

async function performSeasonReset({
  SeasonModel = Season,
  UserModel = User,
  TransactionModel = Transaction,
  audit = createAdminAudit,
  io,
  actor,
  mutation,
  request = {},
  now = () => new Date(),
}) {
  const startedAt = now();
  const season = await SeasonModel.findOneAndUpdate(
    { isResetExecuted: false, status: { $in: ['active', 'ended'] } },
    {
      $set: {
        isResetExecuted: true,
        status: 'ended',
        resetState: 'processing',
        resetRequestId: mutation.requestId,
        resetStartedAt: startedAt,
      },
    },
    { new: false, sort: { seasonNumber: 1 } },
  );
  if (!season) throw new ApiError(409, 'STATE_CONFLICT', 'Không có mùa giải đủ điều kiện để reset.');

  const strategy = season.settings?.resetStrategy || 'soft_reset_ratio';
  const ratio = season.settings?.softResetRatio ?? 0.5;
  const baseElo = season.settings?.resetEloValue ?? 1000;
  const users = await UserModel.find();
  let affectedUsers = 0;
  let totalGemsAwarded = 0;
  const failedUserIds = [];

  for (const user of users) {
    const rank = user.rank || 'Bronze II';
    const reward = getSeasonEndReward(rank);
    const eloBefore = user.eloPoints || 1000;
    const gemsBefore = user.gems || 0;
    const newElo = calculateResetElo({ strategy, elo: eloBefore, rank, baseElo, ratio });

    try {
      user.gems = gemsBefore + reward;
      user.eloPoints = newElo;
      user.seasonHighestElo = newElo;
      user.highestEloReached = newElo;
      await user.save();
      await TransactionModel.create({
        userId: user._id,
        type: 'season_reward',
        amount: reward,
        currency: 'gem',
        balanceBefore: gemsBefore,
        balanceAfter: user.gems,
        source: 'season_reset',
        createdBy: actor.username,
        description: `Season ${season.seasonNumber} reward for rank ${rank}`,
      });
      affectedUsers += 1;
      totalGemsAwarded += reward;
    } catch (_error) {
      failedUserIds.push(String(user._id));
    }
  }

  const failedUsers = failedUserIds.length;
  const resetState = failedUsers > 0 ? 'failed' : 'completed';
  await SeasonModel.findByIdAndUpdate(season._id, {
    $set: { resetState, resetCompletedAt: now(), resetFailureCount: failedUsers },
  });

  const summary = { affectedUsers, failedUsers, totalGemsAwarded, strategy, seasonNumber: season.seasonNumber };
  await audit({
    actor,
    action: failedUsers > 0 ? 'SEASON_RESET_PARTIAL_FAILURE' : 'SEASON_RESET_COMPLETED',
    target: { type: 'season', id: String(season._id) },
    before: { isResetExecuted: false, status: season.status, resetState: season.resetState || 'pending' },
    after: summary,
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });

  if (failedUsers > 0) {
    throw new ApiError(409, 'PARTIAL_FAILURE', 'Reset mùa giải chỉ hoàn tất một phần và cần điều tra.', {
      affectedUsers,
      failedUsers,
    });
  }

  if (io) {
    const message = `Mùa giải ${season.name || ''} đã khép lại. ELO và phần thưởng mùa giải đã được cập nhật.`;
    io.emit('announcement:broadcast', {
      title: 'Reset Mùa Giải!',
      message,
      type: 'event',
      durationSeconds: 60,
      createdAt: now(),
      sender: 'Hệ Thống',
    });
    io.emit('server_announcement', { text: message, sentAt: now().toISOString(), sender: 'Hệ Thống' });
  }

  return { affectedUsers, failedUsers, strategy, totalGemsAwarded };
}

module.exports = {
  calculateResetElo,
  getSeasonEndReward,
  getTieredResetElo,
  performSeasonReset,
};
