const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const jsQR = require('../public/assets/vendor/jsQR-1.4.0.js');

const frontend = path.join(__dirname, '..');
const scannerSource = fs.readFileSync(path.join(frontend, 'src/shared/utils/ticket-scanner.js'), 'utf8');
const encoderSource = fs.readFileSync(path.join(frontend, 'public/assets/vendor/qrcode-1.5.4.js'), 'utf8');

function qrFrame(svg) {
  const size = Number(svg.match(/viewBox="0 0 (\d+)/)[1]);
  const width = size * 6;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  for (const match of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const x = Number(match[1]) * 6;
    const y = Number(match[2]) * 6;
    for (let row = y; row < y + 6; row++) {
      for (let col = x; col < x + 6; col++) {
        const offset = (row * width + col) * 4;
        data[offset] = data[offset + 1] = data[offset + 2] = 0;
      }
    }
  }
  return { data, width, height: width };
}

function harness(options = {}) {
  const elements = new Map();
  const observers = [];
  const listeners = new Map();
  const frames = new Map();
  const inputCalls = [];
  let frameId = 0;
  let stops = 0;
  let image;
  const track = { stop: () => stops++, addEventListener() {} };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  for (const id of ['app', 'qr-input', 'ticket-camera', 'ticket-camera-video', 'ticket-scan-start', 'ticket-scan-stop', 'ticket-scan-status']) {
    elements.set(id, { hidden: false, value: '', textContent: '', isConnected: true, style: {}, focus() {} });
  }
  const video = elements.get('ticket-camera-video');
  Object.assign(video, { readyState: 2, play: async () => {} });
  const document = {
    body: {}, hidden: false,
    getElementById: id => elements.get(id),
    addEventListener: (name, fn) => listeners.set(name, fn),
    createElement: () => ({
      getContext: () => ({ drawImage() {}, getImageData: () => image })
    })
  };
  const context = vm.createContext({
    document,
    navigator: { mediaDevices: { getUserMedia: options.getUserMedia || (async () => stream) } },
    MutationObserver: class {
      constructor(callback) { observers.push(callback); }
      observe() {}
    },
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    addEventListener: (name, fn) => listeners.set(name, fn),
    handleQRInput: value => inputCalls.push(value),
    jsQR, console, TextEncoder
  });
  context.window = context;
  vm.runInContext(encoderSource, context);
  vm.runInContext(scannerSource, context);
  return {
    context, elements, document, observers, listeners, frames, inputCalls, stream,
    get stops() { return stops; },
    setQR(value) {
      image = qrFrame(context.renderTicketQRCode(value));
      video.videoWidth = image.width;
      video.videoHeight = image.height;
      return image;
    },
    frame() {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(300);
    }
  };
}

test('ticket and verification IDs produce QR images that really decode', () => {
  const h = harness();
  for (const value of ['TKT-EMP-101', 'TKT-DEMO-001', 'aB3deF6HiJ9k']) {
    const image = h.setQR(value);
    assert.equal(jsQR(image.data, image.width, image.height).data, value);
  }
});

test('Scan reads the camera frame into the input and stops before verification', async () => {
  const h = harness();
  h.setQR('TKT-EMP-101');
  await h.context.startTicketScan();
  assert.equal(h.elements.get('ticket-camera').hidden, false);
  h.frame();
  assert.equal(h.elements.get('qr-input').value, 'TKT-EMP-101');
  assert.deepEqual(h.inputCalls, ['TKT-EMP-101']);
  assert.equal(h.stops, 1);
  assert.equal(h.frames.size, 0);
  assert.equal(h.elements.get('ticket-camera').hidden, true);
  assert.equal(h.elements.get('ticket-scan-status').textContent, 'Ticket scanned. Press Verify.');
});

test('Stop also releases a camera granted after cancellation', async () => {
  let grant;
  const h = harness({ getUserMedia: () => new Promise(resolve => { grant = resolve; }) });
  const start = h.context.startTicketScan();
  h.context.stopTicketScan();
  grant(h.stream);
  await start;
  assert.equal(h.stops, 1);
  assert.equal(h.frames.size, 0);
  assert.equal(h.elements.get('ticket-camera').hidden, true);
});

test('denied access keeps manual entry available', async () => {
  const h = harness({ getUserMedia: async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); } });
  h.elements.get('qr-input').value = 'TKT-EMP-101';
  await h.context.startTicketScan();
  assert.equal(h.elements.get('qr-input').value, 'TKT-EMP-101');
  assert.equal(h.elements.get('ticket-scan-start').hidden, false);
  assert.match(h.elements.get('ticket-scan-status').textContent, /Camera access denied/);
  assert.equal(h.frames.size, 0);
});

test('navigation, signing out, and hiding the tab release the camera', async () => {
  for (const action of ['navigate', 'signout', 'hide']) {
    const h = harness();
    await h.context.startTicketScan();
    if (action === 'navigate') {
      h.elements.get('ticket-camera-video').isConnected = false;
      h.observers.forEach(fn => fn());
    } else if (action === 'signout') {
      h.elements.get('app').style.display = 'none';
      h.observers.forEach(fn => fn());
    } else {
      h.document.hidden = true;
      h.listeners.get('visibilitychange')();
    }
    assert.equal(h.stops, 1, action);
    assert.equal(h.frames.size, 0, action);
  }
});

test('all entry points use the compact panel and verify scanned IDs only for the selected event', () => {
  const roles = ['attendee', 'client', 'employee1', 'employee2', 'landing', 'organizer', 'staff', 'admin'];
  const appFiles = {
    attendee: ['attendee', 'AttendeeApp'], client: ['client', 'ClientApp'],
    employee1: ['support-executive', 'SupportExecutiveApp'], employee2: ['finance-executive', 'FinanceExecutiveApp'],
    landing: ['landing', 'LandingApp'], organizer: ['organizer', 'OrganizerApp'],
    staff: ['event-staff', 'EventStaffApp'], admin: ['admin', 'AdminApp'],
  };
  for (const role of roles) {
    const [folder, app] = appFiles[role];
    let componentPath = path.join(frontend, 'src/apps', folder, 'app', app + '.jsx');
    let component = fs.readFileSync(componentPath, 'utf8');
    const delegatedComponent = component.match(/import\s+(\w+)\s+from\s+['"]([^'"]+\.jsx)['"]/);
    if (delegatedComponent && new RegExp(`return\\s+<${delegatedComponent[1]}\\s*\\/>`).test(component)) {
      componentPath = path.resolve(path.dirname(componentPath), delegatedComponent[2]);
      component = fs.readFileSync(componentPath, 'utf8');
    }
    const runtimeImport = component.match(/import\s+source\s+from\s+['"]([^'"]+)\?raw['"]/);
    assert.ok(runtimeImport, `${role} must render a component with a runtime`);
    const source = fs.readFileSync(path.resolve(path.dirname(componentPath), runtimeImport[1]), 'utf8');
    const h = harness();
    const saved = new Map([['verify_eventId', '101']]);
    const registration = { id: 1, eventId: 101, attendeeId: 'a1', ticketId: 'TKT-EMP-101', verificationId: 'aB3deF6HiJ9k', checkedIn: false };
    const other = { id: 2, eventId: 102, ticketId: 'TKT-OTHER', checkedIn: false };
    const notifications = [];
    let saves = 0;
    Object.assign(h.context, {
      CU: { id: 'staff1', role: 'staff' },
      DB: {
        staffAssignments: [{ staffId: 'staff1', eventId: 101, status: 'accepted' }],
        events: [{ id: 101, title: 'Conference', date: '2026-10-13' }],
        registrations: [registration, other], users: []
      },
      sessionStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, String(value)) },
      isDepartmentEmployee: () => false,
      g: id => h.elements.get(id),
      saveDB: () => saves++, renderPage() {},
      toast: message => notifications.push(message)
    });
    const pageStart = source.lastIndexOf('function pageAttendeeVerification() {');
    const helperStart = source.indexOf('function useDemoTicketForVerification()', pageStart);
    const helperEnd = source.indexOf('function markAsVerified(', helperStart);
    const quickStart = source.indexOf('function quickVerify(');
    const quickEnd = source.indexOf('function pageAttendeeVerification()', quickStart);
    vm.runInContext(source.slice(pageStart, helperEnd) + source.slice(quickStart, quickEnd), h.context);
    const panel = h.context.pageAttendeeVerification();
    assert.match(panel, /onclick="startTicketScan\(\)"/, role);
    assert.match(panel, /onclick="stopTicketScan\(\)"/, role);
    assert.doesNotMatch(panel, /Manual QR Entry|Works offline|font-size:64px|Pending Verification/, role);
    assert.match(panel, /<svg[^>]*aria-label="Ticket QR code"/, role);
    h.context.handleQRInput(registration.verificationId);
    assert.equal(h.elements.get('qr-input').style.borderColor, 'var(--green)', role);
    h.elements.get('qr-input').value = other.ticketId;
    h.context.submitQRScan();
    assert.equal(other.checkedIn, false, role);
    assert.equal(saves, 0, role);
    h.elements.get('qr-input').value = registration.verificationId;
    h.context.submitQRScan();
    assert.equal(registration.checkedIn, true, role);
    assert.equal(saves, 1, role);
    h.elements.get('qr-input').value = registration.ticketId;
    h.context.submitQRScan();
    assert.equal(saves, 1, role);
    assert.equal(notifications.at(-1), 'Already checked in', role);
    h.context.DB.registrations = [];
    assert.match(h.context.pageAttendeeVerification(), /disabled>Use Ticket/, role);
    assert.match(component, /LegacyRuntime source=\{source(?:\s*\+\s*'\\n'\s*\+\s*financeSource)?\}/, role);
    new vm.Script(source, { filename: role + '/runtime.js' });
  }
  const index = fs.readFileSync(path.join(frontend, 'index.html'), 'utf8');
  assert.match(index, /\/assets\/vendor\/qrcode-1\.5\.4\.js/);
  assert.match(index, /\/assets\/vendor\/jsQR-1\.4\.0\.js/);
  assert.match(fs.readFileSync(path.join(frontend, 'src/shared/components/LegacyRuntime.jsx'), 'utf8'), /ticket-scanner\.js\?raw/);
});
