require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { getMigratedAdminRole } = require('../services/admin/roleMigrationService');

async function main() {
  const apply = process.argv.includes('--apply');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.collection.find(
    { role: { $in: ['admin', 'super_admin', 'operator', 'moderator', 'analyst'] } },
    { projection: { username: 1, email: 1, role: 1, isBanned: 1 } },
  ).toArray();
  const changes = users
    .map((user) => ({ id: String(user._id), username: user.username, from: user.role, to: getMigratedAdminRole(user.role) }))
    .filter((change) => change.from !== change.to);
  const activeSuperAdmins = users.filter((user) => !user.isBanned && getMigratedAdminRole(user.role) === 'super_admin').length;

  if (activeSuperAdmins === 0) throw new Error('Refusing migration: no active super_admin would remain');
  if (apply) {
    for (const change of changes) {
      await User.collection.updateOne({ _id: new mongoose.Types.ObjectId(change.id), role: change.from }, { $set: { role: change.to } });
    }
  }
  process.stdout.write(`${JSON.stringify({ mode: apply ? 'apply' : 'dry-run', activeSuperAdmins, changes }, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
