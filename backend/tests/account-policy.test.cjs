const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('account creation and profile changes enforce one account per email', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-account-policy-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  const { UserRole } = require('../src/common/constants');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const { UsersService } = require('../src/modules/users/users.service');
  const { StaffService } = require('../src/modules/staff/staff.service');
  const { AttendeesService } = require('../src/modules/attendees/attendees.service');
  const users = new UsersService(), staff = new StaffService(), attendees = new AttendeesService();
  t.after(() => {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-account-policy-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await t.test('all registration paths reject existing emails regardless of case or surrounding spaces', () => {
    const before = JSON.stringify([db.users, db.staffProfiles, db.attendees]);
    const details = { name: 'Another account', email: '  ATTENDEE@EXAMPLE.COM  ', password: 'Test@123' };
    assert.throws(() => users.create({ ...details, userRole: UserRole.CLIENT }, UserRole.SUPER_ADMIN), /Email already registered/);
    assert.throws(() => staff.create(details, UserRole.SUPER_ADMIN), /Email already registered/);
    assert.throws(() => attendees.create(details, UserRole.SUPER_ADMIN), /Email already registered/);
    assert.equal(JSON.stringify([db.users, db.staffProfiles, db.attendees]), before);
    const original = db.findUserByEmail('attendee@example.com');
    original.status = 'inactive';
    assert.throws(() => users.create({ ...details, userRole: UserRole.CLIENT }, UserRole.SUPER_ADMIN), /Email already registered/);
    original.status = 'active';
  });

  await t.test('profile edits cannot take another account email or partially change a rejected profile', () => {
    const attendee = db.attendees.find(item => item.userId === 'usr-attendee-001');
    const employee = db.staffProfiles.find(item => item.userId === 'usr-staff-001');
    const before = JSON.stringify([db.users, db.staffProfiles, db.attendees]);
    assert.throws(() => users.update(attendee.userId, { email: ' CLIENT@EXAMPLE.COM ', name: 'Changed' }, UserRole.ATTENDEE, attendee.userId), /Email already registered/);
    assert.throws(() => staff.update(employee.staffId, { email: ' CLIENT@EXAMPLE.COM ', availableDates: ['2099-01-01'], status: 'busy' }, UserRole.EVENT_STAFF, employee.userId), /Email already registered/);
    assert.throws(() => attendees.update(attendee.attendeeId, { email: ' CLIENT@EXAMPLE.COM ', name: 'Changed' }, UserRole.ATTENDEE, attendee.userId), /Email already registered/);
    assert.equal(JSON.stringify([db.users, db.staffProfiles, db.attendees]), before);
    users.update(attendee.userId, { email: ' ATTENDEE@EXAMPLE.COM ' }, UserRole.ATTENDEE, attendee.userId);
    staff.update(employee.staffId, { email: ' STAFF@EXAMPLE.COM ' }, UserRole.EVENT_STAFF, employee.userId);
    attendees.update(attendee.attendeeId, { email: ' ATTENDEE@EXAMPLE.COM ' }, UserRole.ATTENDEE, attendee.userId);
    assert.equal(db.findUserById(attendee.userId).email, 'attendee@example.com');
  });

  await t.test('new email addresses are normalized, protected across roles, and persist', () => {
    const result = users.create({ name: 'New user', email: ' New.User@Example.com ', password: 'Test@123', userRole: UserRole.CLIENT }, UserRole.SUPER_ADMIN);
    assert.equal(result.data.email, 'new.user@example.com');
    assert.throws(() => attendees.create({ name: 'Other', email: 'NEW.USER@example.com' }, UserRole.SUPER_ADMIN), /Email already registered/);
    users.update('usr-admin-001', { email: ' NEW.ADMIN@EXAMPLE.COM ' }, UserRole.SUPER_ADMIN, 'usr-admin-001');
    assert.equal(db.superAdmins.find(item => item.userId === 'usr-admin-001').email, 'new.admin@example.com');
    const sample = { reportId: 'SER-legacy', submittedBy: 'usr-emp-001', sourceReference: 'legacy:RVR-002',
      title: 'Duplicate Account Detection & Resolution Summary — Q2 2026',
      summary: 'Duplicate Account Detection & Resolution Summary — Q2 2026',
      category: 'Registration & User Management', scope: 'Platform Wide', period: 'Q2 2026', status: 'submitted', createdAt: new Date(), updatedAt: new Date() };
    db.supportExecutiveReports.push(sample, { ...sample, reportId: 'SER-authored', sourceReference: 'form:custom' });
    db.persist();
    DataStore.instance = undefined;
    const restored = DataStore.getInstance();
    assert.equal(restored.findUserByEmail('  NEW.USER@EXAMPLE.COM ').userId, result.data.userId);
    assert.equal(restored.supportExecutiveReports.find(report => report.reportId === 'SER-legacy').title, 'Account Access & Verification Summary — Q2 2026');
    assert.equal(restored.supportExecutiveReports.find(report => report.reportId === 'SER-authored').title, sample.title, 'User-authored reports must be preserved');
  });
});
