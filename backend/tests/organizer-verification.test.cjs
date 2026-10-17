const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { DataStore } = require(path.join(__dirname, '../dist/common/data-store'));
const { AuthService } = require(path.join(__dirname, '../dist/modules/auth/auth.service'));
const { EventsService } = require(path.join(__dirname, '../dist/modules/events/events.service'));
const { EventRequestsService } = require(path.join(__dirname, '../dist/modules/event-requests/event-requests.service'));
const { UserRole } = require(path.join(__dirname, '../dist/common/constants'));

const runId = Date.now();
const testEmail = `robert.${runId}@apexevents.com`;
let testRefNumber = '';

test('Backend: Organizer Application Submission & Status Tracking', () => {
  const ds = DataStore.getInstance();
  const authService = new AuthService({ sign: () => 'mock-jwt-token' });

  // 1. Submit Registered Company application
  const companyAppPayload = {
    fullName: 'Robert Taylor',
    email: testEmail,
    mobileNumber: '9876543299',
    password: 'Password@123',
    emailVerified: true,
    mobileVerified: true,
    organizerType: 'Registered Company / Event Agency',
    companyDetails: {
      legalCompanyName: 'Apex Global Events Private Limited',
      businessStructure: 'Private Limited Company',
      registrationNumber: 'U74999MH2021PTC123456',
      gstin: '27AABCT1234F1Z5',
      address: 'Floor 5, Apex Towers, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
      authorizedRepresentativeName: 'Robert Taylor',
      representativeDesignation: 'Managing Director',
      websiteUrl: 'https://apexevents.com',
      registrationCertificateDoc: { name: 'apex-incorporation.pdf', size: 102400, type: 'application/pdf' },
      proofOfAuthorizationDoc: { name: 'board-resolution.pdf', size: 51200, type: 'application/pdf' },
    },
    declarationAccepted: true,
  };

  const res = authService.submitOrganizerApplication(companyAppPayload);
  assert.equal(res.success, true);
  assert.match(res.referenceNumber, /^ORG-APP-2026-\d{4}$/);
  assert.equal(res.status, 'Pending Verification');
  assert.equal(res.message, 'Your Organizer Application Has Been Submitted Successfully!');
  testRefNumber = res.referenceNumber;

  // Verify user is created with pending status
  const user = ds.users.find(u => u.email === testEmail);
  assert.ok(user);
  assert.equal(user.status, 'pending');
  assert.equal(user.userRole, UserRole.EVENT_ORGANIZER);

  // 2. Reject duplicate email application
  assert.throws(() => {
    authService.submitOrganizerApplication(companyAppPayload);
  }, /already/i);

  // 3. Track application status
  const statusRes = authService.getOrganizerApplicationStatus(res.referenceNumber);
  assert.equal(statusRes.success, true);
  assert.equal(statusRes.status, 'Pending Verification');
  assert.equal(statusRes.canPublishEvents, false);
  assert.equal(statusRes.canAcceptBookings, false);
  assert.equal(statusRes.fullName, 'Robert Taylor');
});

test('Backend: Unapproved organizer cannot publish events or accept bookings', () => {
  const ds = DataStore.getInstance();
  const eventsService = new EventsService();
  const requestsService = new EventRequestsService();

  // Find the pending organizer
  const pendingUser = ds.users.find(u => u.email === testEmail);
  assert.ok(pendingUser);
  assert.equal(pendingUser.status, 'pending');

  let org = ds.organizers.find(o => o.userId === pendingUser.userId);
  if (!org) {
    org = {
      organizerId: ds.generateId('org'),
      userId: pendingUser.userId,
      businessName: 'Apex Global Events',
      rating: 5,
      createdAt: new Date(),
    };
    ds.organizers.push(org);
  }

  // Attempting to publish an event as an unapproved organizer should throw ForbiddenException
  assert.throws(() => {
    eventsService.create({
      name: 'Unauthorized Concert',
      date: '2026-11-20',
      time: '18:10',
      location: 'Stadium',
      capacity: 500,
      ticketPrice: 50,
      status: 'published',
    }, UserRole.EVENT_ORGANIZER, pendingUser.userId);
  }, /Only approved organizers can publish events/);

  // Organizer can create as draft, but cannot update to published
  const draftEvent = eventsService.create({
    name: 'Draft Event',
    date: '2026-11-20',
    time: '18:20',
    location: 'Stadium',
    capacity: 500,
    ticketPrice: 50,
    status: 'draft',
  }, UserRole.EVENT_ORGANIZER, pendingUser.userId);
  assert.equal(draftEvent.status, 'draft');

  assert.throws(() => {
    eventsService.update(draftEvent.eventId, { status: 'published' }, UserRole.EVENT_ORGANIZER, pendingUser.userId);
  }, /Only approved organizers can publish events/);

  // Attempting to accept an event booking/request should throw ForbiddenException
  const dummyRequestId = ds.generateId('req');
  ds.eventRequests.push({
    requestId: dummyRequestId,
    clientId: 'cli-001',
    organizerId: org.organizerId,
    eventName: 'Corporate Gala',
    eventType: 'corporate',
    eventDate: '2026-12-01',
    eventTime: '19:00',
    status: 'submitted',
    capacity: 200,
    budget: 50000,
    requirements: 'Stage, sound, lights',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.throws(() => {
    requestsService.acceptRequest(dummyRequestId, UserRole.EVENT_ORGANIZER, pendingUser.userId, { policyAccepted: true, acceptedPolicyVersion: '2026-10-17.1' });
  }, /Only approved organizers can accept event bookings or requests/);
});

test('Backend: Reviewer workflow (Under Review, Additional Info, Approved, Rejected) & activation', () => {
  const ds = DataStore.getInstance();
  const authService = new AuthService({ sign: () => 'mock-jwt-token' });
  const eventsService = new EventsService();
  const requestsService = new EventRequestsService();

  const user = ds.users.find(u => u.email === testEmail);
  const app = ds.organizerApplications.find(a => a.email === testEmail);
  assert.ok(app);

  // 1. Move to Under Review
  const underReviewRes = authService.reviewOrganizerApplication(
    app.referenceNumber,
    { status: 'Under Review', comments: 'Review started by admin team.' },
    'usr-admin-001',
    UserRole.SUPER_ADMIN,
  );
  assert.equal(underReviewRes.status, 'Under Review');

  // 2. Request Additional Info
  const addInfoRes = authService.reviewOrganizerApplication(
    app.referenceNumber,
    { status: 'Additional Information Required', additionalInfoRequest: 'Please provide the latest audited financial statement.' },
    'usr-admin-001',
    UserRole.SUPER_ADMIN,
  );
  assert.equal(addInfoRes.status, 'Additional Information Required');

  // 3. Approve application
  const approveRes = authService.reviewOrganizerApplication(
    app.referenceNumber,
    { status: 'Approved', comments: 'All corporate documents verified.' },
    'usr-admin-001',
    UserRole.SUPER_ADMIN,
  );
  assert.equal(approveRes.status, 'Approved');
  assert.equal(user.status, 'active', 'User account is activated upon approval');
  assert.equal(approveRes.emailDelivery.configured, false, 'Correctly reports email delivery limitation');

  // 4. Now that organizer is approved, publishing events and accepting bookings succeed!
  const uniqueTime = '16:' + String(Math.floor(Math.random() * 50) + 10);
  const publishedEvent = eventsService.create({
    name: 'Approved Festival',
    date: '2026-11-28',
    time: uniqueTime,
    location: 'Open Grounds',
    capacity: 1000,
    ticketPrice: 100,
    status: 'published',
  }, UserRole.EVENT_ORGANIZER, user.userId);
  assert.equal(publishedEvent.status, 'published');

  const req = ds.eventRequests.find(r => r.organizerId === ds.organizers.find(o => o.userId === user.userId)?.organizerId);
  if (req) {
    const accepted = requestsService.acceptRequest(req.requestId, UserRole.EVENT_ORGANIZER, user.userId, { policyAccepted: true, acceptedPolicyVersion: '2026-10-17.1' });
    assert.equal(accepted.success, true);
  }
});
