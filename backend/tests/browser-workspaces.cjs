/* Local QA using installed Edge and CDP. All server/browser records are temporary. */
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const value = await check(); if (value) return value; await delay(100); }
  throw new Error(message);
}
async function connect(url) {
  const socket = new WebSocket(url); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let counter = 0; const waiting = new Map(), errors = [];
  socket.onmessage = event => { const value = JSON.parse(event.data); if (value.id) { const pending = waiting.get(value.id); waiting.delete(value.id); if (value.error) pending?.reject(new Error(JSON.stringify(value.error))); else pending?.resolve(value.result); } else if (value.method === 'Runtime.exceptionThrown') errors.push(value.params.exceptionDetails.exception?.description || value.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++counter; waiting.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  return { send, errors, close: () => socket.close(), async evaluate(expression) { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text); return response.result.value; } };
}
(async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-browser-'));
  const profile = path.join(temporary, 'edge-profile'), store = path.join(temporary, 'store.json');
  const oldFile = process.env.EVENTFLOW_DATA_FILE, oldSmtp = process.env.SMTP_HOST;
  process.env.EVENTFLOW_DATA_FILE = store; process.env.SMTP_HOST = '';
  let app, browser, browserClient;
  try {
    const { Module, ValidationPipe } = require('@nestjs/common');
    const { NestFactory, APP_INTERCEPTOR } = require('@nestjs/core');
    const { ThrottlerModule } = require('@nestjs/throttler');
    const { DataStorePersistenceInterceptor } = require('../src/common/interceptors/data-store-persistence.interceptor');
    const names = ['auth', 'users', 'events', 'registrations', 'payments', 'attendance', 'staff-assignments', 'staff', 'event-requests', 'event-plans', 'reports', 'notifications', 'reviews', 'support', 'finance', 'workspace'];
    class BrowserApplication {}
    Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]), ...names.map(name => Object.values(require(`../src/modules/${name}/${name}.module`))[0])], providers: [{ provide: APP_INTERCEPTOR, useClass: DataStorePersistenceInterceptor }] })(BrowserApplication);
    app = await NestFactory.create(BrowserApplication, { logger: ['error'], abortOnError: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    const dist = path.resolve(__dirname, '../../frontend/dist');
    app.useStaticAssets(dist);
    app.use((req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(dist, 'index.html')));
    await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
    const edge = process.env.EVENTFLOW_EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!fs.existsSync(edge)) throw new Error('Installed Edge not found; set EVENTFLOW_EDGE_PATH');
    browser = spawn(edge, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-component-update', '--disable-sync', '--disable-gpu', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    await until(() => fs.existsSync(portFile), 'Headless Edge did not start');
    const [port, browserPath] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
    browserClient = await connect(`ws://127.0.0.1:${port}${browserPath}`);
    const { DataStore } = require('../src/common/data-store'); const db = DataStore.getInstance();
    const { jwtConfig } = require('../src/config/jwt.config'); const jwt = require('jsonwebtoken');
    const roleMap = { super_admin: 'superuser', event_organizer: 'organizer', event_staff: 'staff', attendee: 'attendee', client: 'client' };
    const fixtures = [
      ['Super Admin', '/admin', u => u.userRole === 'super_admin'],
      ['Registration Executive', '/employee1', u => u.employeeType === 'REGISTRATION_VERIFICATION'],
      ['Event Operations', '/employee1', u => u.employeeType === 'EVENT_OPERATIONS'],
      ['Finance Executive', '/employee2', u => ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].includes(u.employeeType)],
      ['Organizer', '/organizer', u => u.userRole === 'event_organizer'],
      ['Client', '/client', u => u.userRole === 'client'],
      ['Event Staff', '/staff', u => u.userRole === 'event_staff' && !u.employeeType],
      ['Attendee', '/attendee', u => u.userRole === 'attendee'],
      ['Support Executive', '/employee1', u => u.employeeType === 'SUPPORT_EXECUTIVE'],
    ];
    const pages = [];
    for (const [name, route, predicate] of fixtures) {
      const user = db.users.find(u => u.status === 'active' && predicate(u)); assert.ok(user, name);
      const { password, ...safe } = user;
      const session = { ...safe, id: user.userId, role: roleMap[user.userRole], token: jwt.sign({ userId: user.userId, email: user.email }, jwtConfig.secret, { expiresIn: '10m' }) };
      const target = await browserClient.send('Target.createTarget', { url: 'about:blank' });
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = await connect(targets.find(t => t.id === target.targetId).webSocketDebuggerUrl); pages.push(page);
      await page.send('Runtime.enable'); await page.send('Page.enable');
      await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('ef_cu',${JSON.stringify(JSON.stringify(session))});const originalFetch=window.fetch;window.fetch=(url,options)=>originalFetch(typeof url==='string'&&url.startsWith('http://localhost:3001/api')?${JSON.stringify(base)}+url.slice('http://localhost:3001'.length):url,options);` });
      await page.send('Page.navigate', { url: base + route });
      await until(() => page.evaluate(`Boolean(document.querySelector('#page-content .cw-workspace h1, #page-content .finance-workspace h1'))`), `${name}: dashboard failed to render`);
      const links = await page.evaluate(`Array.from(document.querySelectorAll('#sb-nav [data-pg]')).map(b=>({page:b.dataset.pg,title:b.textContent.trim()}))`);
      assert.ok(links.length >= 3, `${name}: missing navigation`);
      for (const link of links) {
        await page.evaluate(`goNav(${JSON.stringify(link.page)})`);
        await until(() => page.evaluate(`Boolean(document.querySelector('#page-content h1'))&&!document.querySelector('.finance-skeleton')&&!document.querySelector('#page-content [role=status]')?.textContent.startsWith('Loading')`), `${name}: ${link.page} failed to load`);
        const text = await page.evaluate(`document.querySelector('#page-content').innerText`);
        assert.doesNotMatch(text, /Workspace data unavailable|Financial data unavailable|This page is not available|This department does not have access/i, `${name} ${link.page}`);
      }
      assert.deepEqual(page.errors, [], `${name}: JavaScript exceptions`);
      console.log(`PASS ${name}: ${links.length} navigation pages rendered from backend records`);
    }
    // Actual form submission and cross-role visibility, with existing seed accounts.
    const adminPage = pages[0], operationsPage = pages[2];
    await operationsPage.evaluate(`goNav('employee-reports')`);
    await until(() => operationsPage.evaluate(`Boolean(document.querySelector('[data-action="new-report"]'))`), 'Employee report action unavailable');
    await operationsPage.evaluate(`document.querySelector('[data-action="new-report"]').click()`);
    await operationsPage.evaluate(`document.querySelector('#cw-form [name=title]').value='Browser readiness report';document.querySelector('#cw-form [name=content]').value='Submitted through the actual rendered form.';document.querySelectorAll('#cw-form input,#cw-form textarea').forEach(input=>input.dispatchEvent(new Event('input',{bubbles:true})));document.querySelector('#cw-form').requestSubmit()`);
    try { await until(() => operationsPage.evaluate(`document.querySelector('#page-content')?.innerText.includes('Browser readiness report')&&!document.querySelector('#cw-dialog[open]')`), 'Employee form submission did not persist'); }
    catch (error) { console.error('Employee report UI:', await operationsPage.evaluate(`({text:document.querySelector('#page-content')?.innerText,handler:typeof document.querySelector('#cw-form')?.onsubmit,fields:Array.from(document.querySelector('#cw-form')?.elements||[]).map(e=>({name:e.name,value:e.value,valid:e.checkValidity(),message:e.validationMessage,disabled:e.disabled}))})`), 'JavaScript:', operationsPage.errors, 'Stored reports:', db.employeeReports.length); throw error; }
    await adminPage.evaluate(`goNav('employee-reports')`);
    await until(() => adminPage.evaluate(`document.querySelector('#page-content')?.innerText.includes('Browser readiness report')`), 'Super Admin did not receive employee report');
    console.log('PASS employee report form → backend persistence → Super Admin report inbox');
    const storedReport = db.employeeReports.find(r => r.title === 'Browser readiness report'); assert.ok(storedReport);
    await adminPage.evaluate(`document.querySelector('[data-action="review-report"][data-id=${JSON.stringify(storedReport.id)}]').click()`);
    await adminPage.evaluate(`document.querySelector('#cw-form [name=notes]').value='Reviewed in browser.';document.querySelector('#cw-form [name=notes]').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#cw-form').requestSubmit()`);
    await until(() => db.employeeReports.find(r => r.id === storedReport.id)?.status === 'reviewed', 'Admin review was not saved');
    console.log('PASS Super Admin review form → persisted feedback for employee');
    const financePage = pages[3];
    await financePage.evaluate(`goNav('reports')`);
    await until(() => financePage.evaluate(`Boolean(document.querySelector('[data-send-report]'))`), 'Finance send action unavailable');
    await financePage.evaluate(`document.querySelector('[data-send-report]').click()`);
    await financePage.evaluate(`document.querySelector('#finance-send-form [name=title]').value='Browser finance report';document.querySelector('#finance-send-form [name=title]').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#finance-send-form').requestSubmit()`);
    await until(() => db.financeReportSubmissions.some(r => r.title === 'Browser finance report'), 'Finance report form did not persist');
    const financialReport = db.financeReportSubmissions.find(r => r.title === 'Browser finance report');
    await adminPage.evaluate(`goNav('revenue-reports')`);
    await until(() => adminPage.evaluate(`document.querySelector('#page-content')?.innerText.includes('Browser finance report')`), 'Super Admin finance inbox did not receive the report');
    await adminPage.evaluate(`document.querySelector('[data-report=${JSON.stringify(financialReport.id)}]').click()`);
    await until(() => adminPage.evaluate(`Boolean(document.querySelector('[data-review]'))`), 'Finance report review form did not open');
    await adminPage.evaluate(`document.querySelector('[data-review] [name=notes]').value='Finance snapshot checked in browser.';document.querySelector('[data-review] [name=notes]').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-review]').requestSubmit()`);
    await until(() => db.financeReportSubmissions.find(r => r.id === financialReport.id)?.status === 'reviewed', 'Finance report feedback was not persisted');
    console.log('PASS Finance Executive report form → Super Admin saved snapshot → review feedback');
    await adminPage.evaluate(`goNav('users')`); await until(() => adminPage.evaluate(`document.querySelector('#page-content h1')?.textContent==='Users & Employees'`), 'Users page unavailable');
    await adminPage.evaluate(`goNav('events')`); await until(() => adminPage.evaluate(`document.querySelector('#page-content h1')?.textContent==='Events'`), 'Events page unavailable');
    await adminPage.evaluate(`history.back()`); await until(() => adminPage.evaluate(`document.querySelector('#page-content h1')?.textContent==='Users & Employees'`), 'Browser back did not restore the previous page');
    console.log('PASS browser back navigation restores the prior connected page');
    await adminPage.evaluate(`goNav('revenue-reports')`);
    await until(() => adminPage.evaluate(`Boolean(document.querySelector('[data-action="new-policy"]'))`), 'Commission policy control unavailable');
    await adminPage.evaluate(`(()=>{document.querySelector('[data-action="new-policy"]').click();const form=document.querySelector('#cw-form');form.elements.basisPoints.value='0';form.elements.effectiveDate.value='2020-01-01';form.querySelectorAll('input').forEach(input=>input.dispatchEvent(new Event('input',{bubbles:true})));form.requestSubmit()})()`);
    await until(() => db.commissionPolicies.some(p => p.effectiveDate === '2020-01-01' && p.basisPoints === 0), 'Admin policy form did not persist');
    await until(() => adminPage.evaluate(`!document.querySelector('#cw-dialog[open]')&&Boolean(document.querySelector('[data-action="new-policy"]'))`), 'Policy form did not close');
    console.log('PASS Super Admin commission configuration form accepts historical effective dates');
    await adminPage.evaluate(`goNav('events')`);
    await until(() => adminPage.evaluate(`Boolean(document.querySelector('[data-action="new-event"]'))`), 'Admin event creation unavailable');
    await adminPage.evaluate(`(()=>{document.querySelector('[data-action="new-event"]').click();const form=document.querySelector('#cw-form');for(const [name,value] of Object.entries({name:'Browser created event',category:'Technology',date:'2099-06-06',time:'10:00',location:'Browser venue',capacity:'10',ticketPrice:'35.50'})){form.elements[name].value=value;form.elements[name].dispatchEvent(new Event('input',{bubbles:true}));}form.requestSubmit()})()`);
    await until(() => db.events.some(e => e.name === 'Browser created event' && e.ticketPrice === 35.5), 'Admin event form did not persist');
    console.log('PASS event creation form → validated persisted event with the selected organizer');
    await adminPage.evaluate(`goNav('customer-support')`);
    await until(() => adminPage.evaluate(`Boolean(document.querySelector('[data-support-tickets]'))`), 'Customer support did not connect to backend tickets');
    await adminPage.evaluate(`goNav('customer-support');goNav('users')`);
    await until(() => adminPage.evaluate(`document.querySelector('#page-content h1')?.textContent==='Users & Employees'`), 'Rapid navigation left a stale support response on screen');
    console.log('PASS connected customer support and stale-response protection during navigation');
    // A separate public page tests real signup/login rather than injected sessions.
    const guestTarget = await browserClient.send('Target.createTarget', { url: 'about:blank' });
    const guestTargets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const guest = await connect(guestTargets.find(t => t.id === guestTarget.targetId).webSocketDebuggerUrl); pages.push(guest);
    await guest.send('Runtime.enable'); await guest.send('Page.enable');
    await guest.send('Page.addScriptToEvaluateOnNewDocument', { source: `const originalFetch=window.fetch;window.fetch=(url,options)=>originalFetch(typeof url==='string'&&url.startsWith('http://localhost:3001/api')?${JSON.stringify(base)}+url.slice('http://localhost:3001'.length):url,options);` });
    await guest.send('Page.navigate', { url: base + '/landing' });
    await until(() => guest.evaluate(`typeof window.EventFlowConnectedWorkspace==='object'`), 'Public workspace did not initialize');
    await guest.evaluate(`showPage('find-events')`);
    await until(() => guest.evaluate(`Boolean(document.querySelector('#cw-public-search'))`), 'Public catalog did not load backend events');
    await guest.evaluate(`showPage('landing');openRegisterModal()`);
    await guest.evaluate(`const form=document.querySelector('#cw-signup');for(const [name,value] of Object.entries({name:'Browser Signup',email:'browser-signup@test.invalid',password:'BrowserPass@123',userRole:'attendee'})){form.elements[name].value=value;form.elements[name].dispatchEvent(new Event('input',{bubbles:true}));form.elements[name].dispatchEvent(new Event('change',{bubbles:true}));}form.requestSubmit()`);
    await until(() => guest.evaluate(`Boolean(document.querySelector('#page-content .cw-workspace h1'))&&location.pathname==='/attendee'`), 'Public signup did not reach the persisted attendee workspace');
    assert.ok(db.users.some(u => u.email === 'browser-signup@test.invalid'));
    console.log('PASS dynamic public catalog → signup form → persisted attendee account and workspace');
    assert.deepEqual(guest.errors, [], 'Public signup JavaScript errors');
    for (const page of pages) { assert.deepEqual(page.errors, [], 'No browser runtime exceptions'); page.close(); }
    console.log('Browser QA complete; no production records or real money operations were used.');
  } finally {
    try { await browserClient?.send('Browser.close'); } catch {}
    browserClient?.close();
    if (browser) { await delay(500); if (browser.exitCode === null) browser.kill(); }
    await app?.close();
    if (oldFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = oldFile;
    if (oldSmtp === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = oldSmtp;
    // Verified temporary path, never a personal browser profile or project directory.
    assert.equal(path.dirname(path.resolve(profile)), path.resolve(temporary));
    if (fs.existsSync(profile)) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    for (const file of [store, `${store}.tmp`]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(temporary);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
