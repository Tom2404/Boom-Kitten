// Socket Handler: Quest progress and daily reward claiming
const Quest = require('../../models/Quest');
const UserQuestProgress = require('../../models/UserQuestProgress');

function registerQuestHandlers(io, socket, helpers) {
  const { getUserId, safeSocketHandler } = helpers;

  socket.on('quest:claim', safeSocketHandler(socket, async ({ questId }, callback) => {
    try {
      const userId = getUserId(socket);
      const quest = await Quest.findById(questId);
      if (!quest || !quest.isActive) {
        throw new Error('Nhiệm vụ không tồn tại hoặc đã hết hạn.');
      }

      const progress = await UserQuestProgress.findOne({ userId, questId });
      if (!progress || progress.status !== 'completed') {
        throw new Error('Nhiệm vụ chưa hoàn thành.');
      }

      progress.status = 'claimed';
      await progress.save();

      if (typeof callback === 'function') {
        callback({ ok: true, rewardCoins: quest.rewardCoins });
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback({ ok: false, error: error.message });
      }
    }
  }));
}

module.exports = registerQuestHandlers;
