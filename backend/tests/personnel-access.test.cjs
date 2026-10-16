const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('Support Executives cannot change employee or admin accounts through the API', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-personnel-access-'));
  const previousCwd = process.cwd(), previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.chdir(directory); process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const db = DataStore.getInstance(), agent = db.users.find(user => user.email === 'employee@example.com');
  const other = db.users.find(user => user.email === 'marcus.ops@eventflow.com');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(async () => {
    await app.close(); DataStore.instance = undefined; process.chdir(previousCwd);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-personnel-access-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function call(token, method, route, body, expected = 200, extraHeaders = {}) {
    const response = await fetch(base + route, { method, headers: { ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }
  const login = async (email, password) => (await call(null, 'POST', '/auth/login', { email, password })).token;
  const token = await login(agent.email, 'Employee@123'), admin = await login('superadmin@example.com', 'Admin@123');

  await t.test('current and legacy support executive types cannot edit, suspend, or delete personnel', async () => {
    for (const type of ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS']) {
      agent.employeeType = type;
      const before = JSON.stringify([db.users, db.staffProfiles, db.superAdmins]);
      for (const target of ['usr-admin-001', other.userId, 'usr-staff-001']) {
        await call(token, 'PATCH', `/users/${target}`, { name: 'Unauthorized name' }, 403);
        await call(token, 'PATCH', `/users/${target}/status`, { status: 'suspended' }, 403);
        await call(token, 'DELETE', `/users/${target}`, null, 403);
      }
      const profile = db.staffProfiles.find(item => item.userId === 'usr-staff-001');
      await call(token, 'PUT', `/staff/${profile.staffId}`, { name: 'Unauthorized', status: 'unavailable' }, 403);
      await call(token, 'DELETE', `/staff/${profile.staffId}`, null, 403);
      assert.equal(JSON.stringify([db.users, db.staffProfiles, db.superAdmins]), before);
    }
  });

  await t.test('forged role headers and privilege fields cannot bypass the restrictions', async () => {
    const before = JSON.stringify([db.users, db.staffProfiles]);
    await call(token, 'PATCH', `/users/${other.userId}`, { name: 'Forged admin edit' }, 403,
      { 'x-role': 'super_admin', 'x-user-id': 'usr-admin-001' });
    for (const body of [{ userRole: 'super_admin' }, { employeeType: 'FINANCE_EXECUTIVE' }]) {
      await call(token, 'PATCH', `/users/${agent.userId}`, body, 400);
    }
    assert.equal(JSON.stringify([db.users, db.staffProfiles]), before);
  });

  await t.test('support analytics contain operational data without staff assignments, ratings or availability', async () => {
    const before = JSON.stringify(db.staffProfiles);
    const count = db.users.filter(user => user.userRole !== 'event_staff' && !user.employeeType).length;
    for (const type of ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS']) {
      agent.employeeType = type;
      const dashboard = await call(token, 'GET', '/analytics/staff-dashboard');
      assert.equal(dashboard.totalUsers, count);
      assert.equal(dashboard.totalEvents, db.events.length);
      for (const field of ['totalAssignments', 'pendingAssignments', 'acceptedAssignments', 'myRating', 'availableDates', 'totalReportsSubmitted']) {
        assert.equal(dashboard[field], undefined, field);
      }
    }
    assert.equal(JSON.stringify(db.staffProfiles), before);
    const staffToken = await login('staff@example.com', 'Staff@123');
    const staffDashboard = await call(staffToken, 'GET', '/analytics/staff-dashboard');
    assert.equal(typeof staffDashboard.totalAssignments, 'number');
    assert.ok(Array.isArray(staffDashboard.availableDates));
    const adminDashboard = await call(admin, 'GET', '/analytics/dashboard');
    assert.equal(adminDashboard.users.byRole.event_staff, db.users.filter(user => user.userRole === 'event_staff').length);
  });

  await t.test('support can update its own profile and admin retains employee management', async () => {
    const own = await call(token, 'PATCH', `/users/${agent.userId}`, { name: 'Updated own profile' });
    assert.equal(own.name, 'Updated own profile');
    assert.equal(own.userRole, 'event_staff');
    const updated = await call(admin, 'PATCH', `/users/${other.userId}`, { name: 'Admin updated employee' });
    assert.equal(updated.name, 'Admin updated employee');
    assert.equal(db.findUserById('usr-admin-001').name, 'Alex Johnson');
  });
});
