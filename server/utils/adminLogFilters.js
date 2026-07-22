const mongoose = require('mongoose');

async function resolveLogUserIds(search, findUsers) {
  const value = String(search || '').trim();
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) return [value];

  const users = await findUsers(value);
  return users.map((user) => user._id.toString());
}

module.exports = { resolveLogUserIds };
