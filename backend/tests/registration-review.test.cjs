const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { RegistrationsService } = require('../src/modules/registrations/registrations.service');
const { PaymentsService } = require('../src/modules/payments/payments.service');
const { QrCodeService } = require('../src/common/utils/qr-code.service');
const { ReviewRegistrationDto } = require('../src/modules/registrations/dto/registration.dto');

const reason = 'This workshop requires prior training that was not included in your application.';

function fixture(t, status = 'registered') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-registration-review-'));
  const dataFile = path.join(directory, 'store.json');
  const previousDataFile = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = dataFile;
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const now = new Date();
  const event = { eventId: 'evt-review-test', organizerId: 'org-001', name: 'Review Workshop', category: 'Workshop', date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), time: '10:00', location: 'Workshop Hall', capacity: 1, ticketPrice: 0, status: 'published', createdAt: now, updatedAt: now };
  const registration = { registrationId: 'reg-review-test', attendeeId: 'att-001', eventId: event.eventId, registrationDate: now.toISOString().slice(0, 10), status, ticketType: 'General Admission', verificationId: 'old-ticket', qrCode: 'old-qr', createdAt: now, updatedAt: now };
  db.events.push(event);
  db.registrations.push(registration);
  db.notifications = [];
  t.after(() => {
    DataStore.instance = undefined;
    if (previousDataFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousDataFile;
    fs.unlinkSync(dataFile);
    fs.rmdirSync(directory);
  });
  return { db, event, registration, service: new RegistrationsService() };
}

test('declines require a trimmed, clear reason in both DTO validation and the service', t => {
  const { service, registration, db } = fixture(t);
  for (const invalid of [undefined, null, '          ', 'Too short', 'a'.repeat(1001)]) {
    const dto = plainToInstance(ReviewRegistrationDto, { decision: 'rejected', reason: invalid });
    assert.ok(validateSync(dto).length);
    assert.throws(() => service.review(registration.registrationId, dto, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /10 to 1000/);
  }
  assert.equal(registration.status, 'registered');
  assert.equal(db.notifications.length, 0);
  const dto = plainToInstance(ReviewRegistrationDto, { decision: 'rejected', reason: `  ${reason}  ` });
  assert.equal(dto.reason, reason);
  assert.equal(validateSync(dto).length, 0);
});

test('only the event organizer can review; other roles and other organizers cannot mutate it', t => {
  const { service, registration } = fixture(t);
  for (const role of [UserRole.ATTENDEE, UserRole.CLIENT, UserRole.EVENT_STAFF]) {
    assert.throws(() => service.review(registration.registrationId, { decision: 'rejected', reason }, role, 'usr-attendee-001'), /Only the event organizer/);
  }
  assert.throws(() => service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-emp-001'), /your own events/);
  assert.equal(registration.status, 'registered');
});

test('the attendee keeps the declined registration, reason and notification after a data reload', t => {
  let { service, db, registration } = fixture(t);
  const total = db.registrations.length;
  service.review(registration.registrationId, { decision: 'rejected', reason: ` ${reason} ` }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert.equal(db.registrations.length, total);
  assert.equal(registration.status, 'rejected');
  assert.equal(registration.verificationId, undefined);
  assert.equal(registration.qrCode, undefined);
  assert.equal(registration.reservationExpiresAt, undefined);
  assert.equal(db.notifications[0].type, 'registration_rejected');
  assert.equal(db.notifications[0].userId, 'usr-attendee-001');
  assert.ok(db.notifications[0].message.includes(reason));
  db.persist();
  DataStore.instance = undefined;
  service = new RegistrationsService();
  const result = service.findAll(UserRole.ATTENDEE, 'usr-attendee-001').find(item => item.registrationId === registration.registrationId);
  assert.equal(result.status, 'rejected');
  assert.equal(result.rejectionReason, reason);
  assert.ok(result.reviewedAt instanceof Date);
  assert.throws(() => service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /no longer pending/);
  assert.throws(() => service.cancel(registration.registrationId, 'Cancel', UserRole.ATTENDEE, 'usr-attendee-001'), /declined registration/);
  assert.throws(() => service.updateDetails(registration.registrationId, {}, UserRole.ATTENDEE, 'usr-attendee-001'), /Historical/);
});

test('only the owning attendee can view a decline, and the first view stays saved after reload', t => {
  let { service, db, registration } = fixture(t);
  assert.throws(() => service.markDeclineViewed(registration.registrationId, UserRole.ATTENDEE, 'usr-attendee-001'), /not been declined/);
  service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert.equal(registration.declineViewedAt, undefined);
  assert.throws(() => service.markDeclineViewed(registration.registrationId, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /Only the attendee/);
  assert.throws(() => service.markDeclineViewed(registration.registrationId, UserRole.ATTENDEE, 'usr-attendee-002'), /your own registration/);
  const firstView = service.markDeclineViewed(registration.registrationId, UserRole.ATTENDEE, 'usr-attendee-001').data.declineViewedAt;
  assert.ok(firstView instanceof Date);
  assert.equal(service.markDeclineViewed(registration.registrationId, UserRole.ATTENDEE, 'usr-attendee-001').data.declineViewedAt, firstView);
  db.persist();
  DataStore.instance = undefined;
  service = new RegistrationsService();
  const restored = service.findOne(registration.registrationId, UserRole.ATTENDEE, 'usr-attendee-001');
  assert.equal(restored.declineViewedAt.toISOString(), firstView.toISOString());
  assert.equal(restored.status, 'rejected');
  assert.equal(restored.rejectionReason, reason);
});

test('declining a paid registration starts one full refund and releases the seat to the waitlist', t => {
  const { service, db, registration, event } = fixture(t);
  event.ticketPrice = 250;
  event.cancellationDeadline = '2000-01-01';
  db.payments.push({ paymentId: 'pay-review-test', registrationId: registration.registrationId, amount: 250, status: 'completed', paymentDate: registration.registrationDate, paymentMethod: 'DEMO_PROVIDER', createdAt: new Date(), updatedAt: new Date() });
  const waitlisted = { ...registration, registrationId: 'reg-review-waitlist', attendeeId: 'att-002', status: 'waitlisted', verificationId: undefined, qrCode: undefined };
  db.registrations.push(waitlisted);
  service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  const refunds = db.refunds.filter(refund => refund.registrationId === registration.registrationId);
  assert.equal(refunds.length, 1);
  assert.equal(refunds[0].amount, 250);
  assert.equal(refunds[0].status, 'pending');
  assert.ok(waitlisted.offerExpiresAt > new Date());
  assert.equal(db.notifications.filter(notification => notification.type === 'waitlist_offer').length, 1);
});

test('approving preserves payment and waitlist requirements and historical registrations cannot be reviewed', t => {
  const { service, registration, event } = fixture(t, 'pending_payment');
  service.review(registration.registrationId, { decision: 'approved' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert.equal(registration.status, 'pending_payment');
  assert.equal(registration.reviewStatus, 'approved');
  delete registration.reviewStatus;
  registration.status = 'attended';
  assert.throws(() => service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /no longer pending/);
  registration.status = 'registered';
  event.status = 'completed';
  assert.throws(() => service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /past or closed/);
});

test('a payment already in flight cannot reactivate a registration declined while generating its ticket', async t => {
  const { service, db, registration, event } = fixture(t, 'pending_payment');
  event.ticketPrice = 250;
  let finishQr;
  const generate = QrCodeService.generateQRCode;
  QrCodeService.generateQRCode = () => new Promise(resolve => { finishQr = resolve; });
  t.after(() => { QrCodeService.generateQRCode = generate; });
  const payment = new PaymentsService().create({ registrationId: registration.registrationId, amount: 250, paymentDate: registration.registrationDate, paymentMethod: 'DEMO_PROVIDER' }, UserRole.ATTENDEE, 'usr-attendee-001');
  service.review(registration.registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  finishQr('new-qr');
  await assert.rejects(payment, /no longer awaiting payment/);
  assert.equal(registration.status, 'rejected');
  assert.equal(registration.verificationId, undefined);
  assert.equal(db.payments.filter(item => item.registrationId === registration.registrationId).length, 0);
});

test('HTTP organizer decline validates the reason and delivers it to the attendee registration and notifications', async t => {
  const { registration } = fixture(t);
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function login(email, password) {
    const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200);
    return (await response.json()).data.token;
  }
  const organizerToken = await login('organizer@example.com', 'Organizer@123');
  const attendeeToken = await login('attendee@example.com', 'Attendee@123');
  const reviewUrl = `${base}/registrations/${registration.registrationId}/review`;
  const options = body => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` }, body: JSON.stringify(body) });
  assert.equal((await fetch(reviewUrl, options({ decision: 'rejected' }))).status, 400);
  assert.equal((await fetch(reviewUrl, options({ decision: 'rejected', reason: '             ' }))).status, 400);
  const declined = await fetch(reviewUrl, options({ decision: 'rejected', reason }));
  assert.equal(declined.status, 200);
  assert.equal((await declined.json()).data.rejectionReason, reason);
  const headers = { Authorization: `Bearer ${attendeeToken}` };
  const registrations = await (await fetch(`${base}/registrations`, { headers })).json();
  const own = registrations.find(item => item.registrationId === registration.registrationId);
  assert.equal(own.status, 'rejected');
  assert.equal(own.rejectionReason, reason);
  assert.equal(own.declineViewedAt, undefined);
  const viewed = await fetch(`${base}/registrations/${registration.registrationId}/decline-viewed`, { method: 'PATCH', headers });
  assert.equal(viewed.status, 200);
  const viewedAt = (await viewed.json()).data.declineViewedAt;
  assert.ok(viewedAt);
  const refreshed = await (await fetch(`${base}/registrations/${registration.registrationId}`, { headers })).json();
  assert.equal(refreshed.declineViewedAt, viewedAt);
  const notifications = await (await fetch(`${base}/notifications`, { headers })).json();
  assert.ok(notifications.some(notification => notification.registrationId === registration.registrationId && notification.type === 'registration_rejected' && notification.message.includes(reason)));
});
