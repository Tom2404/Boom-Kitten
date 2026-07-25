const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createQuest,
  deleteQuest,
  updateQuest,
} = require('../services/admin/questService');

const actor = { id: 'admin-1', username: 'operator-quest', role: 'operator' };
const request = { requestId: 'transport-1', ip: '127.0.0.1', userAgent: 'Admin Browser' };

test('creates a quest and writes a normalized audit record', async () => {
  const created = { _id: 'quest-1', title: 'Play', description: 'Play once', actionType: 'play_game', __v: 0, toObject() { return { ...this }; } };
  const QuestModel = { create: async () => created };
  let auditInput;

  const result = await createQuest({
    QuestModel,
    audit: async (input) => { auditInput = input; },
    actor,
    input: { title: 'Play', description: 'Play once', actionType: 'play_game' },
    mutation: { requestId: 'quest-create-1', reason: '' },
    request,
  });

  assert.equal(result, created);
  assert.equal(auditInput.action, 'QUEST_CREATED');
  assert.equal(auditInput.target.id, 'quest-1');
  assert.equal(auditInput.request.operationRequestId, 'quest-create-1');
});

test('uses optimistic versioning when updating a quest', async () => {
  let updateFilter;
  const before = { _id: 'quest-1', title: 'Old', description: 'Old', actionType: 'play_game', __v: 4, toObject() { return { ...this }; } };
  const after = { _id: 'quest-1', title: 'New', description: 'New', actionType: 'win_game', __v: 5, toObject() { return { ...this }; } };
  const QuestModel = {
    findById: async () => before,
    findOneAndUpdate: async (filter) => { updateFilter = filter; return after; },
  };

  const result = await updateQuest({
    QuestModel,
    audit: async () => {},
    actor,
    questId: 'quest-1',
    input: { title: 'New', description: 'New', actionType: 'win_game' },
    mutation: { requestId: 'quest-update-1', reason: '' },
    request,
  });

  assert.equal(result, after);
  assert.deepEqual(updateFilter, { _id: 'quest-1', __v: 4 });
});

test('deletes a quest with a reason and optimistic version guard', async () => {
  const before = { _id: 'quest-1', title: 'Old', description: 'Old', actionType: 'play_game', __v: 2, toObject() { return { ...this }; } };
  let deleteFilter;
  let auditInput;
  const QuestModel = {
    findById: async () => before,
    deleteOne: async (filter) => { deleteFilter = filter; return { deletedCount: 1 }; },
  };

  await deleteQuest({
    QuestModel,
    audit: async (input) => { auditInput = input; },
    actor,
    questId: 'quest-1',
    mutation: { requestId: 'quest-delete-1', reason: 'Quest is no longer valid' },
    request,
  });

  assert.deepEqual(deleteFilter, { _id: 'quest-1', __v: 2 });
  assert.equal(auditInput.action, 'QUEST_DELETED');
  assert.equal(auditInput.reason, 'Quest is no longer valid');
});
