const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
test('legacy demo departments migrate once without resetting user data or history', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-migration-'));
  const file = path.join(directory, 'store.json'), previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = file;
  try {
    const { DataStore } = require('../src/common/data-store');
    let db = DataStore.getInstance();
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const user = json.users.find(u => u.email === 'arjun.events@eventflow.com');
    user.employeeType = 'SUPPORT_EXECUTIVE'; user.name = 'Preserved Name'; user.status = 'inactive'; user.password = 'PreservedPassword';
    delete json.workspaceDataVersion; fs.writeFileSync(file, JSON.stringify(json));
    DataStore.instance = undefined; db = DataStore.getInstance();
    const migrated = db.users.find(u => u.userId === user.userId);
    assert.equal(migrated.employeeType, 'REGISTRATION_VERIFICATION');
    assert.equal(migrated.name, 'Preserved Name'); assert.equal(migrated.status, 'inactive'); assert.equal(migrated.password, 'PreservedPassword');
    assert.equal(db.payments.length, json.payments.length); assert.equal(db.registrations.length, json.registrations.length);
    migrated.employeeType = 'SUPPORT_EXECUTIVE'; db.persist();
    DataStore.instance = undefined; db = DataStore.getInstance();
    assert.equal(db.users.find(u => u.userId === user.userId).employeeType, 'SUPPORT_EXECUTIVE');
  } finally {
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    for (const target of [file, `${file}.tmp`]) if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.rmdirSync(directory);
  }
});
