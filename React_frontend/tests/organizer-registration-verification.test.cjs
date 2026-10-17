const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const regSource = fs.readFileSync(path.join(__dirname, '../src/shared/utils/organizer-registration.js'), 'utf8');

function setupHarness() {
  const elements = new Map();
  let modalTitle = '';
  let modalHtml = '';
  let modalActions = [];
  const toasts = [];

  const dom = {
    window: {},
    document: {
      querySelectorAll: (sel) => {
        if (sel.includes('.org-spec-checkbox')) {
          return elements.get('checkboxes') || [];
        }
        return [];
      },
    },
    DB: {
      users: [
        { id: 'usr-org-001', name: 'Existing Org', email: 'existing.org@example.com', role: 'organizer', status: 'active' },
      ],
      organizerApplications: [],
      _nextId: { users: 100 },
    },
    g: (id) => elements.get(id) || null,
    v: (id) => {
      const el = elements.get(id);
      return el ? (el.value != null ? el.value : '') : '';
    },
    openModal: (title, html, actions = []) => {
      modalTitle = title;
      modalHtml = html;
      modalActions = actions;
    },
    closeModal: () => {
      modalTitle = '';
      modalHtml = '';
      modalActions = [];
    },
    toast: (msg, type) => {
      toasts.push({ msg, type });
    },
    today: () => '2026-10-17',
    EventFlowAccountPolicy: {
      isEmailInUse: (users, email) => users.some(u => u.email.toLowerCase() === email.toLowerCase()),
    },
    fetch: async (url) => ({
      ok: true,
      json: async () => ({
        success: true,
        referenceNumber: 'ORG-APP-2026-9999',
        organizerType: 'Independent Event Organizer',
        fullName: 'Alex Chen',
        status: 'Pending Verification',
        submittedAt: '2026-10-17T12:00:00.000Z',
        decisionHistory: [{ status: 'Pending Verification', comments: 'Application queued', createdAt: '2026-10-17T12:00:00.000Z' }],
      }),
    }),
  };

  const context = vm.createContext(dom);
  vm.runInContext(regSource, context);
  const reg = context.window.EventFlowOrganizerRegistration;

  return {
    context,
    reg,
    elements,
    toasts,
    get modalTitle() { return modalTitle; },
    get modalHtml() { return modalHtml; },
    get modalActions() { return modalActions; },
  };
}

test('1. Role selection modal displays exactly Attendee, Client, and Organizer with descriptions and clickable links', () => {
  const h = setupHarness();
  h.reg.openRegisterModal();

  assert.equal(h.modalTitle, 'Create New Account');
  assert.match(h.modalHtml, /Attendee/);
  assert.match(h.modalHtml, /Discover, register, and attend/);
  assert.match(h.modalHtml, /Client/);
  assert.match(h.modalHtml, /Host events, hire professional organizers/);
  assert.match(h.modalHtml, /Organizer/);
  assert.match(h.modalHtml, /Publish events, accept client event requests/);
  assert.match(h.modalHtml, /openAttendeeRegisterForm/);
  assert.match(h.modalHtml, /openClientRegisterForm/);
  assert.match(h.modalHtml, /openOrganizerRegisterStep\(1\)/);
  assert.match(h.modalHtml, /Already have an account\?/);
  assert.match(h.modalHtml, /Sign In/);
});

test('2. Attendee and Client registration forms open with their respective required fields and back navigation', () => {
  const h = setupHarness();
  
  // Attendee Form
  h.reg.openAttendeeRegisterForm();
  assert.equal(h.modalTitle, 'Attendee Registration');
  assert.match(h.modalHtml, /Date of Birth/);
  assert.match(h.modalHtml, /Gender/);
  assert.match(h.modalHtml, /City \/ Location/);
  assert.match(h.modalHtml, /Interests \/ Event Preferences/);
  assert.match(h.modalHtml, /Security Check \(CAPTCHA\)/);
  assert.match(h.modalHtml, /Back to Role Selection/);

  // Client Form
  h.reg.openClientRegisterForm();
  assert.equal(h.modalTitle, 'Client Registration');
  assert.match(h.modalHtml, /Organization Type/);
  assert.match(h.modalHtml, /Organization \/ Company Name/);
  assert.match(h.modalHtml, /Address/);
  assert.match(h.modalHtml, /Security Check \(CAPTCHA\)/);
  assert.match(h.modalHtml, /Back to Role Selection/);
});

test('3. Organizer Step 1 enforces validation for required fields, password match, and both email/mobile verifications', () => {
  const h = setupHarness();
  h.reg.resetState();
  h.reg.openOrganizerRegisterStep(1);

  assert.match(h.modalTitle, /Step 1: Account Details/);
  assert.match(h.modalHtml, /Full Name \*/);
  assert.match(h.modalHtml, /Email Address \*/);
  assert.match(h.modalHtml, /Mobile Number \*/);
  assert.match(h.modalHtml, /Password \*/);
  assert.match(h.modalHtml, /Confirm Password \*/);
  assert.match(h.modalHtml, /Email Verification/);
  assert.match(h.modalHtml, /Mobile Verification/);

  // Attempting to advance without fields or verifications fails
  h.reg.nextOrganizerStep1();
  assert.ok(h.toasts.length > 0);
  assert.equal(h.reg.getState().step, 1);

  // Fill valid credentials but unverified
  const state = h.reg.getState();
  state.fullName = 'Jane Doe';
  state.email = 'jane.doe@example.com';
  state.mobileNumber = '9876543210';
  state.password = 'Secret@123';
  state.confirmPassword = 'Secret@123';

  h.reg.nextOrganizerStep1();
  assert.equal(state.step, 1, 'Cannot advance without email and mobile verification');
  assert.ok(state.errors.emailVerified);
  assert.ok(state.errors.mobileVerified);

  // Complete Email and Mobile verifications
  state.emailVerified = true;
  state.mobileVerified = true;

  h.reg.nextOrganizerStep1();
  assert.equal(state.step, 2, 'Advances to Step 2 when all fields and verifications are complete');
});

test('4. Organizer Step 2 provides ONLY two organizer types and renders type-specific fields without NGO or student club options', () => {
  const h = setupHarness();
  const state = h.reg.getState();
  state.fullName = 'Jane Doe';
  state.email = 'jane.doe@example.com';
  state.mobileNumber = '9876543210';
  state.emailVerified = true;
  state.mobileVerified = true;
  state.step = 2;

  // Render Registered Company
  state.organizerType = 'Registered Company / Event Agency';
  h.reg.renderStep2Modal();

  assert.match(h.modalHtml, /Registered Company \/ Event Agency/);
  assert.match(h.modalHtml, /Independent Event Organizer/);
  // Ensure excluded types are NOT present
  assert.doesNotMatch(h.modalHtml, /NGO/i);
  assert.doesNotMatch(h.modalHtml, /Nonprofit/i);
  assert.doesNotMatch(h.modalHtml, /Student Club/i);
  assert.doesNotMatch(h.modalHtml, /College Event Club/i);

  // Company fields
  assert.match(h.modalHtml, /Legal Company \/ Agency Name \*/);
  assert.match(h.modalHtml, /Business Structure \*/);
  assert.match(h.modalHtml, /Company Registration Number \*/);
  assert.match(h.modalHtml, /GSTIN/);
  assert.match(h.modalHtml, /Registered Business Address \*/);
  assert.match(h.modalHtml, /Authorized Representative Name \*/);
  assert.match(h.modalHtml, /Representative's Designation \*/);
  assert.match(h.modalHtml, /Company Registration Certificate/);
  assert.match(h.modalHtml, /Proof of Authorization \*/);

  // Toggle to Independent Event Organizer
  h.reg.handleTypeChange('Independent Event Organizer');
  assert.equal(h.reg.getState().organizerType, 'Independent Event Organizer');

  // Independent fields
  assert.match(h.modalHtml, /Professional \/ Organizer Name \*/);
  assert.match(h.modalHtml, /Prefilled from Step 1/);
  assert.match(h.modalHtml, /Residential \/ Business Address \*/);
  assert.match(h.modalHtml, /Years of Event Organizing Experience \*/);
  assert.match(h.modalHtml, /Areas of Specialization \*/);
  assert.match(h.modalHtml, /Corporate Events/);
  assert.match(h.modalHtml, /Weddings/);
  assert.match(h.modalHtml, /Concerts & Music/);
  assert.match(h.modalHtml, /Portfolio \/ Previous Event Details \*/);
  assert.match(h.modalHtml, /Supporting Evidence of Previous Events \*/);
  // Ensure company certs are NOT requested for independent
  assert.doesNotMatch(h.modalHtml, /Company Registration Certificate/);
});

test('5. Step 2 requires file uploads and validation before proceeding to Step 3, and Step 3 requires verification declaration', () => {
  const h = setupHarness();
  const state = h.reg.getState();
  state.fullName = 'Jane Doe';
  state.email = 'jane.doe@example.com';
  state.mobileNumber = '9876543210';
  state.emailVerified = true;
  state.mobileVerified = true;
  state.step = 2;
  state.organizerType = 'Independent Event Organizer';
  state.independentDetails.professionalName = 'Jane Doe Events';
  state.independentDetails.address = '123 Art Street';
  state.independentDetails.city = 'Bangalore';
  state.independentDetails.state = 'Karnataka';
  state.independentDetails.pinCode = '560001';
  state.independentDetails.yearsOfExperience = 3;
  state.independentDetails.areasOfSpecialization = ['Corporate Events', 'Weddings'];
  state.independentDetails.portfolioDetails = 'Organized 15 corporate conferences and 10 private weddings.';
  
  // Without supporting evidence upload, Step 2 should fail
  state.independentDetails.supportingEvidenceDoc = null;
  h.reg.nextOrganizerStep2();
  assert.equal(state.step, 2, 'Should not proceed without required document upload');
  assert.ok(state.errors.supportingEvidenceDoc);

  // Add document upload
  state.independentDetails.supportingEvidenceDoc = { name: 'event-portfolio.pdf', size: 102400, type: 'application/pdf' };
  h.reg.nextOrganizerStep2();
  assert.equal(state.step, 3, 'Advances to Step 3 Review & Submit');

  // Verify Step 3 content
  h.reg.renderStep3Modal();
  assert.match(h.modalTitle, /Step 3: Review & Submit/);
  assert.match(h.modalHtml, /Jane Doe/);
  assert.match(h.modalHtml, /jane.doe@example.com/);
  assert.doesNotMatch(h.modalHtml, /Secret@123/, 'Never display raw password');
  assert.match(h.modalHtml, /event-portfolio\.pdf/);
  assert.match(h.modalHtml, /Verification Declaration:/);
  assert.match(h.modalHtml, /Edit Details/);
});

test('6. Post-submission displays the exact confirmation message with reference number and Track Status button', async () => {
  const h = setupHarness();
  const state = h.reg.getState();
  state.fullName = 'Alex Chen';
  state.email = 'alex.chen@example.com';
  state.mobileNumber = '9876543211';
  state.password = 'Pass@123';
  state.emailVerified = true;
  state.mobileVerified = true;
  state.organizerType = 'Independent Event Organizer';
  state.independentDetails.professionalName = 'Chen Productions';
  state.independentDetails.address = '45 Marine Drive';
  state.independentDetails.city = 'Mumbai';
  state.independentDetails.state = 'Maharashtra';
  state.independentDetails.pinCode = '400001';
  state.independentDetails.yearsOfExperience = 2;
  state.independentDetails.areasOfSpecialization = ['Festivals', 'Concerts & Music'];
  state.independentDetails.portfolioDetails = 'Concert production experience';
  state.independentDetails.supportingEvidenceDoc = { name: 'festivals.pdf', size: 204800, type: 'application/pdf' };
  state.declarationAccepted = true;

  await h.reg.submitOrganizerApplication();

  // Verify the EXACT required confirmation text:
  assert.match(h.modalHtml, /Your Organizer Application Has Been Submitted Successfully!/);
  assert.match(h.modalHtml, /Thank you for registering with EventFlow\. Your application and submitted documents will be reviewed by our verification team\. You will receive an email notification once the verification process is complete\./);
  assert.match(h.modalHtml, /<strong>You will receive an approval email after your application has been successfully verified\.<\/strong>\s*Until approval, you can track your application status, but you cannot publish events or accept event bookings through EventFlow\./);
  assert.match(h.modalHtml, /Application Status:\s*<span[^>]*>Pending Verification<\/span>/);
  assert.match(h.modalHtml, /Track Application Status/);
  assert.match(h.modalHtml, /ORG-APP-2026-9999/);
});

test('7. Application tracking supports the six statuses and reviewer inspection', async () => {
  const h = setupHarness();
  
  // Track status modal
  await h.reg.trackOrganizerApplicationStatus('ORG-APP-2026-9999');
  assert.equal(h.modalTitle, 'Application Status Tracking');
  assert.match(h.modalHtml, /ORG-APP-2026-9999/);
  assert.match(h.modalHtml, /Pending Verification/);
  assert.match(h.modalHtml, /Blocked \(Requires Approval\)/);

  // Reviewer inspection modal
  await h.reg.openReviewerModal('ORG-APP-2026-9999');
  assert.equal(h.modalTitle, 'Review Organizer Application');
  assert.match(h.modalHtml, /Under Review/);
  assert.match(h.modalHtml, /Additional Information Required/);
  assert.match(h.modalHtml, /Approved \(Activate Account\)/);
  assert.match(h.modalHtml, /Rejected/);
  assert.match(h.modalHtml, /Suspended/);
});
