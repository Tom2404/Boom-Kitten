const mongoose = require('mongoose');
const Quest = require('../../models/Quest');
const UserQuestProgress = require('../../models/UserQuestProgress');

async function updateQuestProgress(userId, actionType, count = 1) {
  try {
    if (!userId || userId.startsWith('guest-') || !mongoose.Types.ObjectId.isValid(userId)) return;
    const activeQuests = await Quest.find({ actionType, isActive: true });
    if (!activeQuests || activeQuests.length === 0) return;

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    await Promise.all(
      activeQuests.map(async (quest) => {
        // Atomic $inc + upsert: two concurrent socket events must not lose a count.
        const progress = await UserQuestProgress.findOneAndUpdate(
          { userId, questId: quest._id, expiresAt: { $gte: now }, status: { $ne: 'completed' } },
          {
            $inc: { currentCount: count },
            $setOnInsert: { status: 'in_progress', expiresAt: endOfDay },
          },
          { upsert: true, new: true }
        );

        if (progress && progress.currentCount >= quest.targetCount && progress.status !== 'completed') {
          progress.status = 'completed';
          await progress.save();
        }
      })
    );
  } catch (err) {
    console.error('Error updating quest progress:', err);
  }
}

module.exports = { updateQuestProgress };
