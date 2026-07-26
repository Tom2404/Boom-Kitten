const Quest = require('../../models/Quest');
const { ApiError } = require('../../utils/apiResponse');
const { createAdminAudit } = require('./auditService');

const QUEST_ACTION_TYPES = [
  'play_game',
  'win_game',
  'draw_card',
  'buy_item',
  'nope_card',
  'defuse_kitten',
  'steal_card',
];

function toPlain(value) {
  return value?.toObject ? value.toObject() : value;
}

function selectQuestFields(input, { defaults = false } = {}) {
  const payload = {};
  for (const field of ['title', 'description', 'actionType', 'targetCount', 'reward', 'isActive']) {
    if (input[field] !== undefined) payload[field] = input[field];
  }
  if (defaults) {
    if (payload.targetCount === undefined) payload.targetCount = 1;
    if (payload.reward === undefined) payload.reward = { coins: 0 };
    if (payload.isActive === undefined) payload.isActive = true;
  }
  if (payload.reward !== undefined) payload.reward = { coins: Number(payload.reward?.coins) || 0 };
  return payload;
}

function validateQuestInput(input) {
  const fields = {};
  if (!input.title?.trim()) fields.title = 'Bắt buộc';
  if (!input.description?.trim()) fields.description = 'Bắt buộc';
  if (!QUEST_ACTION_TYPES.includes(input.actionType)) fields.actionType = 'Không hợp lệ';
  if (input.targetCount !== undefined && (!Number.isFinite(Number(input.targetCount)) || Number(input.targetCount) < 1)) fields.targetCount = 'Phải từ 1 trở lên';
  const coins = input.reward?.coins;
  if (coins !== undefined && (!Number.isFinite(Number(coins)) || Number(coins) < 0)) fields['reward.coins'] = 'Không được âm';
  if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Thông tin nhiệm vụ không hợp lệ.', { fields });
}

async function createQuest({ QuestModel = Quest, audit = createAdminAudit, actor, input, mutation, request = {} }) {
  validateQuestInput(input);
  const quest = await QuestModel.create(selectQuestFields(input, { defaults: true }));
  await audit({
    actor,
    action: 'QUEST_CREATED',
    target: { type: 'quest', id: String(quest._id) },
    after: toPlain(quest),
    reason: mutation.reason || 'Created daily quest',
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return quest;
}

async function updateQuest({ QuestModel = Quest, audit = createAdminAudit, actor, questId, input, mutation, request = {} }) {
  validateQuestInput(input);
  const before = await QuestModel.findById(questId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy nhiệm vụ.');
  const quest = await QuestModel.findOneAndUpdate(
    { _id: questId, __v: before.__v },
    { $set: selectQuestFields(input), $inc: { __v: 1 } },
    { new: true, runValidators: true },
  );
  if (!quest) throw new ApiError(409, 'STATE_CONFLICT', 'Nhiệm vụ đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'QUEST_UPDATED',
    target: { type: 'quest', id: String(quest._id) },
    before: toPlain(before),
    after: toPlain(quest),
    reason: mutation.reason || 'Updated daily quest',
    request: { ...request, operationRequestId: mutation.requestId },
  });
  return quest;
}

async function deleteQuest({ QuestModel = Quest, audit = createAdminAudit, actor, questId, mutation, request = {} }) {
  const before = await QuestModel.findById(questId);
  if (!before) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy nhiệm vụ.');
  const result = await QuestModel.deleteOne({ _id: questId, __v: before.__v });
  if (result.deletedCount !== 1) throw new ApiError(409, 'STATE_CONFLICT', 'Nhiệm vụ đã thay đổi. Hãy tải lại.');
  await audit({
    actor,
    action: 'QUEST_DELETED',
    target: { type: 'quest', id: String(before._id) },
    before: toPlain(before),
    reason: mutation.reason,
    request: { ...request, operationRequestId: mutation.requestId },
  });
}

module.exports = {
  QUEST_ACTION_TYPES,
  createQuest,
  deleteQuest,
  selectQuestFields,
  updateQuest,
};
