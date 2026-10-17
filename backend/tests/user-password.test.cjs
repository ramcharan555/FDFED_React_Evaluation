const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { DataStore } = require('../src/common/data-store');
const { UsersService } = require('../src/modules/users/users.service');
const { verifyPassword } = require('../src/common/password');

test('account password change verifies the current password and persists a hash', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-password-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const db = DataStore.getInstance();
  const user = db.users.find(item => item.email === 'superadmin@example.com');
  assert.ok(user);
  const service = new UsersService();
  assert.throws(() => service.changePassword(user.userId, { currentPassword: 'wrong', newPassword: 'NewPassword@123' }), /Current password/);
  const oldPassword = 'Admin@123';
  assert.equal(verifyPassword(oldPassword, user.password), true);
  service.changePassword(user.userId, { currentPassword: oldPassword, newPassword: 'NewPassword@123' });
  assert.notEqual(user.password, 'NewPassword@123');
  assert.equal(verifyPassword('NewPassword@123', user.password), true);
  assert.equal(verifyPassword(oldPassword, user.password), false);
  db.persist();
  DataStore.instance = undefined;
  const reloaded = DataStore.getInstance().users.find(item => item.userId === user.userId);
  assert.equal(verifyPassword('NewPassword@123', reloaded.password), true);
});
