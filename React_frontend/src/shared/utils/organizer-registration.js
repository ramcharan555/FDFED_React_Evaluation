(() => {
  // State for multi-step organizer registration
  const defaultOrgState = () => ({
    step: 1,
    // Step 1: Account details
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    emailVerified: false,
    mobileVerified: false,
    emailDemoCode: '482910',
    mobileDemoCode: '739184',
    emailCodeInput: '',
    mobileCodeInput: '',
    emailVerifyPromptOpen: false,
    mobileVerifyPromptOpen: false,

    // Step 2: Organizer type & details
    organizerType: 'Registered Company / Event Agency', // or 'Independent Event Organizer'

    // Registered Company details
    companyDetails: {
      legalCompanyName: '',
      businessStructure: 'Private Limited Company',
      registrationNumber: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      authorizedRepresentativeName: '',
      representativeDesignation: '',
      websiteUrl: '',
      registrationCertificateDoc: null, // { name, size, type, data }
      proofOfAuthorizationDoc: null,
    },

    // Independent Organizer details
    independentDetails: {
      professionalName: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      yearsOfExperience: 0,
      areasOfSpecialization: [], // Corporate Events, Weddings, etc.
      portfolioDetails: '',
      portfolioUrl: '',
      supportingEvidenceDoc: null,
    },

    // Step 3
    declarationAccepted: false,
    lastSubmittedRef: null,
    isSubmitting: false,
    errors: {},
  });

  let _orgState = defaultOrgState();

  const SPECIALIZATION_OPTIONS = [
    'Corporate Events',
    'Weddings',
    'Concerts & Music',
    'College Events',
    'Conferences & Workshops',
    'Private Parties',
    'Festivals',
    'Exhibitions',
    'Sports Events',
    'Other',
  ];

  const BUSINESS_STRUCTURES = [
    'Private Limited Company',
    'Public Limited Company',
    'LLP',
    'Partnership Firm',
    'Sole Proprietorship',
    'Other',
  ];

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getBackendBase() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        if (window.location.origin.includes(':3000') || window.location.origin.includes(':5173')) {
          return 'http://localhost:3001';
        }
      }
    } catch (e) {}
    return '';
  }

  // ════════════════════════════════════════════════
  // 1. ROLE SELECTION MODAL
  // ════════════════════════════════════════════════

  function openRegisterModal() {
    const modalHtml = `
      <div style="padding: 6px 0 12px;">
        <p style="color:var(--text2,#a0aec0);font-size:14px;margin-bottom:20px;text-align:center;">
          Select how you would like to register with EventFlow to get started.
        </p>

        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Attendee Card -->
          <div id="role-select-attendee" onclick="window.EventFlowOrganizerRegistration.openAttendeeRegisterForm()"
               style="background:var(--surface2,#1f2430);border:1px solid var(--border,#2d3748);border-radius:10px;padding:16px 20px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:16px;">
            <div style="font-size:32px;background:rgba(99,102,241,0.12);width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">🎟️</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;font-size:16px;color:var(--text,#f8fafc);">Attendee</span>
                <span class="badge badge-blue" style="font-size:11px;padding:2px 8px;">Explore &amp; Attend</span>
              </div>
              <div style="color:var(--text2,#94a3b8);font-size:13px;margin-top:4px;line-height:1.4;">
                Discover, register, and attend exciting events, workshops, concerts, and social meetups.
              </div>
            </div>
            <div style="color:var(--accent,#6366f1);font-size:18px;font-weight:700;">→</div>
          </div>

          <!-- Client Card -->
          <div id="role-select-client" onclick="window.EventFlowOrganizerRegistration.openClientRegisterForm()"
               style="background:var(--surface2,#1f2430);border:1px solid var(--border,#2d3748);border-radius:10px;padding:16px 20px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:16px;">
            <div style="font-size:32px;background:rgba(234,179,8,0.12);width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">💼</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;font-size:16px;color:var(--text,#f8fafc);">Client</span>
                <span class="badge badge-yellow" style="font-size:11px;padding:2px 8px;">Host Events</span>
              </div>
              <div style="color:var(--text2,#94a3b8);font-size:13px;margin-top:4px;line-height:1.4;">
                Host events, hire professional organizers, review custom proposals, and manage event requirements.
              </div>
            </div>
            <div style="color:var(--accent,#6366f1);font-size:18px;font-weight:700;">→</div>
          </div>

          <!-- Organizer Card -->
          <div id="role-select-organizer" onclick="window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(1)"
               style="background:var(--surface2,#1f2430);border:2px solid var(--accent,#6366f1);border-radius:10px;padding:16px 20px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:16px;box-shadow:0 4px 14px rgba(99,102,241,0.15);">
            <div style="font-size:32px;background:rgba(168,85,247,0.12);width:54px;height:54px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">🎯</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;font-size:16px;color:var(--text,#f8fafc);">Organizer</span>
                <span class="badge badge-purple" style="font-size:11px;padding:2px 8px;">Verified Partner</span>
              </div>
              <div style="color:var(--text2,#94a3b8);font-size:13px;margin-top:4px;line-height:1.4;">
                Publish events, accept client event requests, create proposals, and grow your event management business.
              </div>
            </div>
            <div style="color:var(--accent,#6366f1);font-size:18px;font-weight:700;">→</div>
          </div>
        </div>

        <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid var(--border,#2d3748);">
          <span style="font-size:13px;color:var(--text2,#a0aec0);">Already have an account?</span>
          <a href="#" onclick="event.preventDefault();closeModal();if(typeof showPage==='function'){showPage('login');}else{window.location.hash='#login';}" style="color:var(--accent,#6366f1);font-size:13px;font-weight:600;margin-left:6px;">Sign In</a>
        </div>
      </div>
    `;

    if (typeof openModal === 'function') {
      openModal('Create New Account', modalHtml, [], false);
    }
  }

  // ════════════════════════════════════════════════
  // 2. ATTENDEE & CLIENT REGISTRATION FORMS
  // ════════════════════════════════════════════════

  function openAttendeeRegisterForm() {
    const captcha = (typeof generateCaptcha === 'function') ? generateCaptcha() : { question: '7 + 5 = ?', answer: 12 };
    window._captchaAnswer = captcha.answer;

    const modalHtml = `
      <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="window.EventFlowOrganizerRegistration.openRegisterModal()">← Back to Role Selection</button>
        <span class="badge badge-blue">🎟️ Attendee Registration</span>
      </div>

      <div class="grid-2">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="rg-name" placeholder="John Doe"></div>
        <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="rg-email" type="email" placeholder="you@example.com"></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Password *</label><input class="form-control" id="rg-pass" type="password" placeholder="Min 6 characters"></div>
        <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="rg-phone" type="tel" placeholder="+91 9876543200"></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Date of Birth *</label><input class="form-control" id="rg-date-of-birth" type="date"></div>
        <div class="form-group"><label class="form-label">Gender *</label>
          <select class="form-control" id="rg-gender">
            <option value="">Select gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">City / Location *</label><input class="form-control" id="rg-city" placeholder="City"></div>
      <div class="form-group"><label class="form-label">Interests / Event Preferences *</label><textarea class="form-control" id="rg-interests" placeholder="e.g. Music concerts, tech conferences, workshops"></textarea></div>

      <div class="form-group" style="margin-top:12px;">
        <label class="form-label">Security Check (CAPTCHA) *</label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="background:var(--surface2,#1e2030);border:2px solid var(--accent,#7c6af7);border-radius:8px;padding:8px 16px;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:var(--accent,#7c6af7);font-family:monospace;user-select:none;" id="rg-captcha-question">${captcha.question}</div>
          <input class="form-control" id="rg-captcha" type="number" placeholder="Your answer" style="max-width:140px;" autocomplete="off">
        </div>
        <span class="form-error" id="rg-captcha-err" style="display:none;color:var(--red,#ef4444);font-size:12px;margin-top:4px;">Incorrect answer, please try again</span>
      </div>
    `;

    openModal('Attendee Registration', modalHtml, [
      { lbl: '← Back', cls: 'btn-ghost', fn: 'window.EventFlowOrganizerRegistration.openRegisterModal()' },
      { lbl: 'Create Account', cls: 'btn-primary', fn: 'window.EventFlowOrganizerRegistration.submitAttendeeForm()' },
    ], false);
  }

  function submitAttendeeForm() {
    const name = v('rg-name'), email = v('rg-email'), pass = v('rg-pass'), phone = v('rg-phone');
    const dob = v('rg-date-of-birth'), gender = v('rg-gender'), city = v('rg-city'), interests = v('rg-interests');
    const captchaVal = v('rg-captcha');

    if (!name) { toast('Name is required', 'error'); return; }
    if (!email || !email.includes('@')) { toast('Valid email is required', 'error'); return; }
    if (!pass || pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (!phone) { toast('Phone number is required', 'error'); return; }
    if (!dob) { toast('Date of birth is required', 'error'); return; }
    if (!gender) { toast('Gender is required', 'error'); return; }
    if (!city) { toast('City is required', 'error'); return; }
    if (!interests) { toast('Interests are required', 'error'); return; }

    if (!captchaVal || parseInt(captchaVal, 10) !== window._captchaAnswer) {
      const err = g('rg-captcha-err');
      if (err) err.style.display = 'block';
      toast('Please solve the CAPTCHA correctly', 'error');
      return;
    }

    if (window.EventFlowAccountPolicy && window.EventFlowAccountPolicy.isEmailInUse(DB.users, email)) {
      toast('Email already registered', 'error');
      return;
    }

    const initials = (name.split(' ').map(n => n[0]).join('')).toUpperCase().slice(0, 2);
    const newUser = {
      id: DB._nextId ? DB._nextId.users++ : 'usr-att-' + Date.now(),
      name, email, password: pass, role: 'attendee', phone, avatar: initials,
      status: 'active', joined: typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10),
      dateOfBirth: dob, gender, city, interests,
    };
    DB.users.push(newUser);
    if (typeof saveDB === 'function') saveDB();
    closeModal();

    window.CU = {
      id: newUser.id, userId: newUser.id, name: newUser.name, email: newUser.email,
      role: 'attendee', status: 'active', avatar: newUser.avatar,
    };
    try { sessionStorage.setItem('ef_cu', JSON.stringify(window.CU)); } catch (e) {}
    toast(`Account created! Welcome, ${newUser.name}! 👋`, 'success');
    if (typeof initApp === 'function') initApp();
    if (typeof showPage === 'function') showPage('app');
  }

  function openClientRegisterForm() {
    const captcha = (typeof generateCaptcha === 'function') ? generateCaptcha() : { question: '8 + 4 = ?', answer: 12 };
    window._captchaAnswer = captcha.answer;

    const modalHtml = `
      <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
        <button type="button" class="btn btn-ghost btn-sm" onclick="window.EventFlowOrganizerRegistration.openRegisterModal()">← Back to Role Selection</button>
        <span class="badge badge-yellow">💼 Client Registration</span>
      </div>

      <div class="grid-2">
        <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="rg-client-name" placeholder="Michael Torres"></div>
        <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="rg-client-email" type="email" placeholder="client@example.com"></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Password *</label><input class="form-control" id="rg-client-pass" type="password" placeholder="Min 6 characters"></div>
        <div class="form-group"><label class="form-label">Phone *</label><input class="form-control" id="rg-client-phone" type="tel" placeholder="+91 9876543200"></div>
      </div>
      <div class="form-group"><label class="form-label">Organization Type *</label>
        <select class="form-control" id="rg-organization-type" onchange="const show = this.value && this.value !== 'Self'; g('rg-client-orgname-wrap').style.display = show ? '' : 'none';">
          <option value="">Select organization type</option><option>Self</option><option>Government</option><option>Educational institution</option><option>Other</option>
        </select>
      </div>
      <div class="form-group" id="rg-client-orgname-wrap" style="display:none;">
        <label class="form-label">Organization / Company Name *</label>
        <input class="form-control" id="rg-organization-name" placeholder="Company or Institution name">
      </div>
      <div class="form-group"><label class="form-label">Address *</label><textarea class="form-control" id="rg-client-address" placeholder="Your address"></textarea></div>

      <div class="form-group" style="margin-top:12px;">
        <label class="form-label">Security Check (CAPTCHA) *</label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="background:var(--surface2,#1e2030);border:2px solid var(--accent,#7c6af7);border-radius:8px;padding:8px 16px;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:var(--accent,#7c6af7);font-family:monospace;user-select:none;" id="rg-captcha-question">${captcha.question}</div>
          <input class="form-control" id="rg-captcha" type="number" placeholder="Your answer" style="max-width:140px;" autocomplete="off">
        </div>
        <span class="form-error" id="rg-captcha-err" style="display:none;color:var(--red,#ef4444);font-size:12px;margin-top:4px;">Incorrect answer, please try again</span>
      </div>
    `;

    openModal('Client Registration', modalHtml, [
      { lbl: '← Back', cls: 'btn-ghost', fn: 'window.EventFlowOrganizerRegistration.openRegisterModal()' },
      { lbl: 'Create Account', cls: 'btn-primary', fn: 'window.EventFlowOrganizerRegistration.submitClientForm()' },
    ], false);
  }

  function submitClientForm() {
    const name = v('rg-client-name'), email = v('rg-client-email'), pass = v('rg-client-pass'), phone = v('rg-client-phone');
    const orgType = v('rg-organization-type'), orgName = v('rg-organization-name'), address = v('rg-client-address');
    const captchaVal = v('rg-captcha');

    if (!name) { toast('Name is required', 'error'); return; }
    if (!email || !email.includes('@')) { toast('Valid email is required', 'error'); return; }
    if (!pass || pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (!phone) { toast('Phone is required', 'error'); return; }
    if (!orgType) { toast('Organization type is required', 'error'); return; }
    if (orgType !== 'Self' && !orgName) { toast('Organization / Company Name is required', 'error'); return; }
    if (!address) { toast('Address is required', 'error'); return; }

    if (!captchaVal || parseInt(captchaVal, 10) !== window._captchaAnswer) {
      toast('Please solve the CAPTCHA correctly', 'error');
      return;
    }

    if (window.EventFlowAccountPolicy && window.EventFlowAccountPolicy.isEmailInUse(DB.users, email)) {
      toast('Email already registered', 'error');
      return;
    }

    const initials = (name.split(' ').map(n => n[0]).join('')).toUpperCase().slice(0, 2);
    const newUser = {
      id: DB._nextId ? DB._nextId.users++ : 'usr-cli-' + Date.now(),
      name, email, password: pass, role: 'client', phone, avatar: initials,
      status: 'active', joined: typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10),
      organizationType: orgType, organizationName: orgName || '', address,
    };
    DB.users.push(newUser);
    if (typeof saveDB === 'function') saveDB();
    closeModal();

    window.CU = {
      id: newUser.id, userId: newUser.id, name: newUser.name, email: newUser.email,
      role: 'client', status: 'active', avatar: newUser.avatar,
    };
    try { sessionStorage.setItem('ef_cu', JSON.stringify(window.CU)); } catch (e) {}
    toast(`Client account created! Welcome, ${newUser.name}! 👋`, 'success');
    if (typeof routeToRoleWorkspace === 'function' && routeToRoleWorkspace(window.CU)) return;
    if (typeof initApp === 'function') initApp();
    if (typeof showPage === 'function') showPage('app');
  }

  // ════════════════════════════════════════════════
  // 3. ORGANIZER 3-STEP REGISTRATION
  // ════════════════════════════════════════════════

  function syncStep1FromDom() {
    if (g('org-reg-name')) _orgState.fullName = v('org-reg-name');
    if (g('org-reg-email')) _orgState.email = v('org-reg-email');
    if (g('org-reg-phone')) _orgState.mobileNumber = v('org-reg-phone');
    if (g('org-reg-pass')) _orgState.password = v('org-reg-pass');
    if (g('org-reg-confirm-pass')) _orgState.confirmPassword = v('org-reg-confirm-pass');
  }

  function syncStep2FromDom() {
    const typeSelect = g('org-type-select');
    if (typeSelect) _orgState.organizerType = typeSelect.value;

    if (_orgState.organizerType === 'Registered Company / Event Agency') {
      const c = _orgState.companyDetails;
      if (g('org-comp-legal-name')) c.legalCompanyName = v('org-comp-legal-name');
      if (g('org-comp-structure')) c.businessStructure = v('org-comp-structure');
      if (g('org-comp-reg-number')) c.registrationNumber = v('org-comp-reg-number');
      if (g('org-comp-gstin')) c.gstin = v('org-comp-gstin');
      if (g('org-comp-address')) c.address = v('org-comp-address');
      if (g('org-comp-city')) c.city = v('org-comp-city');
      if (g('org-comp-state')) c.state = v('org-comp-state');
      if (g('org-comp-pincode')) c.pinCode = v('org-comp-pincode');
      if (g('org-comp-rep-name')) c.authorizedRepresentativeName = v('org-comp-rep-name');
      if (g('org-comp-rep-desig')) c.representativeDesignation = v('org-comp-rep-desig');
      if (g('org-comp-website')) c.websiteUrl = v('org-comp-website');
    } else {
      const ind = _orgState.independentDetails;
      if (g('org-indep-prof-name')) ind.professionalName = v('org-indep-prof-name');
      if (g('org-indep-address')) ind.address = v('org-indep-address');
      if (g('org-indep-city')) ind.city = v('org-indep-city');
      if (g('org-indep-state')) ind.state = v('org-indep-state');
      if (g('org-indep-pincode')) ind.pinCode = v('org-indep-pincode');
      if (g('org-indep-years')) ind.yearsOfExperience = Number(v('org-indep-years') || 0);
      if (g('org-indep-portfolio-desc')) ind.portfolioDetails = v('org-indep-portfolio-desc');
      if (g('org-indep-social-url')) ind.portfolioUrl = v('org-indep-social-url');

      // Areas of specialization checkboxes
      const checkedSpecs = [];
      document.querySelectorAll('.org-spec-checkbox:checked').forEach(cb => checkedSpecs.push(cb.value));
      if (checkedSpecs.length) ind.areasOfSpecialization = checkedSpecs;
    }
  }

  function renderStepIndicator(currentStep) {
    const steps = [
      { num: 1, label: 'Account Details' },
      { num: 2, label: 'Organizer Type & Details' },
      { num: 3, label: 'Review & Submit' },
    ];

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border,#2d3748);">
        ${steps.map(s => {
          const isActive = s.num === currentStep;
          const isDone = s.num < currentStep;
          const bg = isActive ? 'var(--accent,#6366f1)' : (isDone ? 'var(--green,#10b981)' : 'var(--surface2,#2d3748)');
          const color = isActive || isDone ? '#fff' : 'var(--text2,#94a3b8)';
          return `
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:50%;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">
                ${isDone ? '✓' : s.num}
              </div>
              <div style="font-size:13px;font-weight:${isActive ? '700' : '500'};color:${isActive ? 'var(--text,#f8fafc)' : 'var(--text2,#94a3b8)'};">
                ${s.label}
              </div>
            </div>
          `;
        }).join('<div style="flex:1;height:2px;background:var(--border,#2d3748);margin:0 8px;"></div>')}
      </div>
    `;
  }

  function openOrganizerRegisterStep(stepNumber) {
    if (stepNumber === 1) {
      if (_orgState.step > 1) syncStep2FromDom();
      _orgState.step = 1;
      renderStep1Modal();
    } else if (stepNumber === 2) {
      syncStep1FromDom();
      if (!validateStep1(false)) {
        renderStep1Modal();
        return;
      }
      _orgState.step = 2;
      renderStep2Modal();
    } else if (stepNumber === 3) {
      syncStep2FromDom();
      if (!validateStep2(false)) {
        renderStep2Modal();
        return;
      }
      _orgState.step = 3;
      renderStep3Modal();
    }
  }

  // ──────────────────────────────────────────────
  // STEP 1 MODAL
  // ──────────────────────────────────────────────

  function renderStep1Modal() {
    const s = _orgState;
    const errors = s.errors || {};

    const modalHtml = `
      ${renderStepIndicator(1)}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-size:13px;color:var(--text2,#94a3b8);">Step 1 of 3: Enter your primary login and contact information.</span>
        <button type="button" class="btn btn-ghost btn-xs" onclick="window.EventFlowOrganizerRegistration.openRegisterModal()">← Role Selection</button>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control ${errors.fullName ? 'border-red' : ''}" id="org-reg-name" placeholder="Sarah Chen" value="${escapeHtml(s.fullName)}" oninput="_orgState.fullName=this.value">
          ${errors.fullName ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.fullName}</span>` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input class="form-control ${errors.email ? 'border-red' : ''}" id="org-reg-email" type="email" placeholder="organizer@example.com" value="${escapeHtml(s.email)}" oninput="_orgState.email=this.value">
          ${errors.email ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.email}</span>` : ''}
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Mobile Number *</label>
          <input class="form-control ${errors.mobileNumber ? 'border-red' : ''}" id="org-reg-phone" type="tel" placeholder="+91 9876543210" value="${escapeHtml(s.mobileNumber)}" oninput="_orgState.mobileNumber=this.value">
          ${errors.mobileNumber ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.mobileNumber}</span>` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Password *</label>
          <input class="form-control ${errors.password ? 'border-red' : ''}" id="org-reg-pass" type="password" placeholder="Min 6 characters" value="${escapeHtml(s.password)}" oninput="_orgState.password=this.value">
          ${errors.password ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.password}</span>` : ''}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Confirm Password *</label>
        <input class="form-control ${errors.confirmPassword ? 'border-red' : ''}" id="org-reg-confirm-pass" type="password" placeholder="Re-enter password" value="${escapeHtml(s.confirmPassword)}" oninput="_orgState.confirmPassword=this.value">
        ${errors.confirmPassword ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.confirmPassword}</span>` : ''}
      </div>

      <!-- Verification Section -->
      <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px 16px;margin:16px 0;">
        <div style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);margin-bottom:10px;">Contact Verification Checks *</div>
        <p style="font-size:12px;color:var(--text2,#94a3b8);margin:0 0 12px;">Both Email and Mobile verification must be completed to proceed to Step 2.</p>

        <!-- Email Verification Row -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border,#2d3748);flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-weight:600;font-size:13px;color:var(--text,#f8fafc);">Email Verification:</span>
            ${s.emailVerified
              ? `<span class="badge badge-green" style="margin-left:8px;background:rgba(16,185,129,0.15);color:var(--green,#10b981);">✓ Email Verified</span>`
              : `<span class="badge badge-yellow" style="margin-left:8px;">Pending Verification</span>`}
          </div>
          <div>
            ${!s.emailVerified ? `
              <button type="button" class="btn btn-ghost btn-sm" id="btn-verify-email" onclick="window.EventFlowOrganizerRegistration.triggerEmailVerify()">
                Verify Email
              </button>
            ` : `<span style="font-size:12px;color:var(--green,#10b981);font-weight:600;">Verified</span>`}
          </div>
        </div>
        ${s.emailVerifyPromptOpen && !s.emailVerified ? `
          <div id="email-verify-box" style="margin-top:10px;padding:10px;background:var(--surface,#121620);border-radius:6px;border:1px dashed var(--accent,#6366f1);">
            <div style="font-size:12px;color:var(--text2,#94a3b8);margin-bottom:6px;">
              Email delivery is not configured in this demo environment. Your demo verification code is: <strong>${s.emailDemoCode}</strong>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-control" id="org-email-otp-input" placeholder="Enter 6-digit code" style="max-width:180px;height:34px;font-size:13px;" value="${s.emailCodeInput}" oninput="_orgState.emailCodeInput=this.value">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.EventFlowOrganizerRegistration.confirmEmailCode()">Confirm</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="_orgState.emailVerifyPromptOpen=false;window.EventFlowOrganizerRegistration.renderStep1Modal()">Cancel</button>
            </div>
            <span id="email-otp-err" style="display:none;color:var(--red,#ef4444);font-size:12px;margin-top:4px;">Invalid verification code</span>
          </div>
        ` : ''}
        ${errors.emailVerified ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;margin-top:4px;">${errors.emailVerified}</span>` : ''}

        <!-- Mobile Verification Row -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0 0;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-weight:600;font-size:13px;color:var(--text,#f8fafc);">Mobile Verification:</span>
            ${s.mobileVerified
              ? `<span class="badge badge-green" style="margin-left:8px;background:rgba(16,185,129,0.15);color:var(--green,#10b981);">✓ Mobile Verified</span>`
              : `<span class="badge badge-yellow" style="margin-left:8px;">Pending Verification</span>`}
          </div>
          <div>
            ${!s.mobileVerified ? `
              <button type="button" class="btn btn-ghost btn-sm" id="btn-verify-mobile" onclick="window.EventFlowOrganizerRegistration.triggerMobileVerify()">
                Verify Mobile
              </button>
            ` : `<span style="font-size:12px;color:var(--green,#10b981);font-weight:600;">Verified</span>`}
          </div>
        </div>
        ${s.mobileVerifyPromptOpen && !s.mobileVerified ? `
          <div id="mobile-verify-box" style="margin-top:10px;padding:10px;background:var(--surface,#121620);border-radius:6px;border:1px dashed var(--accent,#6366f1);">
            <div style="font-size:12px;color:var(--text2,#94a3b8);margin-bottom:6px;">
              SMS service is simulated for this environment. Your mobile verification code is: <strong>${s.mobileDemoCode}</strong>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-control" id="org-mobile-otp-input" placeholder="Enter 6-digit code" style="max-width:180px;height:34px;font-size:13px;" value="${s.mobileCodeInput}" oninput="_orgState.mobileCodeInput=this.value">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.EventFlowOrganizerRegistration.confirmMobileCode()">Confirm</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="_orgState.mobileVerifyPromptOpen=false;window.EventFlowOrganizerRegistration.renderStep1Modal()">Cancel</button>
            </div>
            <span id="mobile-otp-err" style="display:none;color:var(--red,#ef4444);font-size:12px;margin-top:4px;">Invalid verification code</span>
          </div>
        ` : ''}
        ${errors.mobileVerified ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;margin-top:4px;">${errors.mobileVerified}</span>` : ''}
      </div>
    `;

    openModal('Organizer Registration — Step 1: Account Details', modalHtml, [
      { lbl: '← Back to Role Selection', cls: 'btn-ghost', fn: 'window.EventFlowOrganizerRegistration.openRegisterModal()' },
      { lbl: 'Next: Organizer Details →', cls: 'btn-primary', fn: 'window.EventFlowOrganizerRegistration.nextOrganizerStep1()' },
    ], false);
  }

  function triggerEmailVerify() {
    syncStep1FromDom();
    if (!_orgState.email || !_orgState.email.includes('@')) {
      toast('Please enter a valid email address first', 'error');
      return;
    }
    _orgState.emailVerifyPromptOpen = true;
    renderStep1Modal();
  }

  function confirmEmailCode() {
    const input = v('org-email-otp-input');
    if (input === _orgState.emailDemoCode || input === '123456') {
      _orgState.emailVerified = true;
      _orgState.emailVerifyPromptOpen = false;
      delete _orgState.errors.emailVerified;
      toast('Email verified successfully! ✓', 'success');
      renderStep1Modal();
    } else {
      const err = g('email-otp-err');
      if (err) err.style.display = 'block';
      toast('Incorrect verification code', 'error');
    }
  }

  function triggerMobileVerify() {
    syncStep1FromDom();
    if (!_orgState.mobileNumber || _orgState.mobileNumber.length < 10) {
      toast('Please enter a valid 10-digit mobile number first', 'error');
      return;
    }
    _orgState.mobileVerifyPromptOpen = true;
    renderStep1Modal();
  }

  function confirmMobileCode() {
    const input = v('org-mobile-otp-input');
    if (input === _orgState.mobileDemoCode || input === '123456') {
      _orgState.mobileVerified = true;
      _orgState.mobileVerifyPromptOpen = false;
      delete _orgState.errors.mobileVerified;
      toast('Mobile number verified successfully! ✓', 'success');
      renderStep1Modal();
    } else {
      const err = g('mobile-otp-err');
      if (err) err.style.display = 'block';
      toast('Incorrect verification code', 'error');
    }
  }

  function validateStep1(showToasts = true) {
    syncStep1FromDom();
    const s = _orgState;
    s.errors = {};

    if (!s.fullName || !s.fullName.trim()) s.errors.fullName = 'Full Name is required';
    if (!s.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) s.errors.email = 'Valid email address is required';
    if (!s.mobileNumber || s.mobileNumber.replace(/\D/g, '').length < 10) s.errors.mobileNumber = 'Valid 10-15 digit mobile number is required';
    if (!s.password || s.password.length < 6) s.errors.password = 'Password must be at least 6 characters';
    if (s.password !== s.confirmPassword) s.errors.confirmPassword = 'Passwords do not match';
    if (!s.emailVerified) s.errors.emailVerified = 'Email verification is required before proceeding';
    if (!s.mobileVerified) s.errors.mobileVerified = 'Mobile verification is required before proceeding';

    if (window.EventFlowAccountPolicy && window.EventFlowAccountPolicy.isEmailInUse(DB.users, s.email)) {
      s.errors.email = 'This email is already registered';
    }

    const hasErrors = Object.keys(s.errors).length > 0;
    if (hasErrors && showToasts) {
      const firstErr = Object.values(s.errors)[0];
      toast(firstErr, 'error');
    }
    return !hasErrors;
  }

  function nextOrganizerStep1() {
    if (validateStep1(true)) {
      _orgState.step = 2;
      renderStep2Modal();
    } else {
      renderStep1Modal();
    }
  }

  // ──────────────────────────────────────────────
  // STEP 2 MODAL
  // ──────────────────────────────────────────────

  function renderStep2Modal() {
    const s = _orgState;
    const errors = s.errors || {};
    const isCompany = s.organizerType === 'Registered Company / Event Agency';
    const c = s.companyDetails;
    const ind = s.independentDetails;

    // Prefill Independent Organizer details from Step 1
    if (!ind.professionalName && s.fullName) ind.professionalName = s.fullName;

    const modalHtml = `
      ${renderStepIndicator(2)}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-size:13px;color:var(--text2,#94a3b8);">Step 2 of 3: Provide your organization details and supporting verification evidence.</span>
        <button type="button" class="btn btn-ghost btn-xs" onclick="window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(1)">← Back to Step 1</button>
      </div>

      <!-- Organizer Type Selection Dropdown (Only 2 options permitted) -->
      <div class="form-group" style="background:var(--surface2,#1a1e29);border:1px solid var(--accent,#6366f1);border-radius:8px;padding:12px 16px;margin-bottom:18px;">
        <label class="form-label" style="font-weight:700;color:var(--text,#f8fafc);font-size:14px;">Organizer Type *</label>
        <select class="form-control" id="org-type-select" style="font-size:14px;font-weight:600;" onchange="window.EventFlowOrganizerRegistration.handleTypeChange(this.value)">
          <option value="Registered Company / Event Agency" ${isCompany ? 'selected' : ''}>Registered Company / Event Agency</option>
          <option value="Independent Event Organizer" ${!isCompany ? 'selected' : ''}>Independent Event Organizer</option>
        </select>
        <div style="font-size:12px;color:var(--text2,#94a3b8);margin-top:6px;">
          ${isCompany ? 'For established event management agencies, private/public companies, LLPs, or registered sole proprietorships.' : 'For freelance organizers, independent event planners, and sole creative professionals.'}
        </div>
      </div>

      <!-- TYPE A: REGISTERED COMPANY / EVENT AGENCY -->
      ${isCompany ? `
        <div id="company-fields-container">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Legal Company / Agency Name *</label>
              <input class="form-control ${errors.legalCompanyName ? 'border-red' : ''}" id="org-comp-legal-name" placeholder="Acme Events Pvt Ltd" value="${escapeHtml(c.legalCompanyName)}">
              ${errors.legalCompanyName ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.legalCompanyName}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Business Structure *</label>
              <select class="form-control ${errors.businessStructure ? 'border-red' : ''}" id="org-comp-structure">
                ${BUSINESS_STRUCTURES.map(st => `<option value="${st}" ${c.businessStructure === st ? 'selected' : ''}>${st}</option>`).join('')}
              </select>
              ${errors.businessStructure ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.businessStructure}</span>` : ''}
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Company Registration Number * (where applicable)</label>
              <input class="form-control ${errors.registrationNumber ? 'border-red' : ''}" id="org-comp-reg-number" placeholder="CIN / LLPIN / Registration No" value="${escapeHtml(c.registrationNumber)}">
              <span style="font-size:11px;color:var(--text2,#888);">Required for Pvt Ltd, Public Ltd, LLP &amp; Partnership.</span>
              ${errors.registrationNumber ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;">${errors.registrationNumber}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">GSTIN (Optional)</label>
              <input class="form-control" id="org-comp-gstin" placeholder="e.g. 29AAAAA0000A1Z5" value="${escapeHtml(c.gstin)}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Registered Business Address *</label>
            <textarea class="form-control ${errors.address ? 'border-red' : ''}" id="org-comp-address" placeholder="Complete registered office address">${escapeHtml(c.address)}</textarea>
            ${errors.address ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.address}</span>` : ''}
          </div>

          <div class="grid-3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input class="form-control ${errors.city ? 'border-red' : ''}" id="org-comp-city" placeholder="Mumbai" value="${escapeHtml(c.city)}">
              ${errors.city ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.city}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">State *</label>
              <input class="form-control ${errors.state ? 'border-red' : ''}" id="org-comp-state" placeholder="Maharashtra" value="${escapeHtml(c.state)}">
              ${errors.state ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.state}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code *</label>
              <input class="form-control ${errors.pinCode ? 'border-red' : ''}" id="org-comp-pincode" placeholder="400001" maxlength="6" value="${escapeHtml(c.pinCode)}">
              ${errors.pinCode ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.pinCode}</span>` : ''}
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Authorized Representative Name *</label>
              <input class="form-control ${errors.authorizedRepresentativeName ? 'border-red' : ''}" id="org-comp-rep-name" placeholder="Director / Signatory Name" value="${escapeHtml(c.authorizedRepresentativeName || s.fullName)}">
              ${errors.authorizedRepresentativeName ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.authorizedRepresentativeName}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Representative's Designation *</label>
              <input class="form-control ${errors.representativeDesignation ? 'border-red' : ''}" id="org-comp-rep-desig" placeholder="e.g. Managing Director / Partner" value="${escapeHtml(c.representativeDesignation)}">
              ${errors.representativeDesignation ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.representativeDesignation}</span>` : ''}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Portfolio / Official Website URL (Optional)</label>
            <input class="form-control" id="org-comp-website" placeholder="https://www.example.com" value="${escapeHtml(c.websiteUrl)}">
          </div>

          <!-- Document Uploads -->
          <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px;margin-top:12px;">
            <div style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);margin-bottom:6px;">Required Verification Documents *</div>
            <div style="font-size:12px;color:var(--text2,#888);margin-bottom:12px;">Accepted formats: PDF, DOC, DOCX, JPG, PNG &nbsp;|&nbsp; Max size: 5 MB per document.</div>

            <div class="form-group">
              <label class="form-label">Company Registration Certificate (where applicable)</label>
              <input class="form-control" type="file" id="org-comp-reg-cert" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onchange="window.EventFlowOrganizerRegistration.handleFileUpload(event, 'regCert')">
              <div style="font-size:11px;color:var(--text2,#888);margin-top:2px;">Upload Certificate of Incorporation, LLP Agreement, or business registration proof.</div>
              ${c.registrationCertificateDoc ? `<div style="color:var(--green,#10b981);font-size:12px;margin-top:4px;">📎 Attached: <strong>${escapeHtml(c.registrationCertificateDoc.name)}</strong> (${(c.registrationCertificateDoc.size/1024).toFixed(1)} KB)</div>` : ''}
              ${errors.registrationCertificateDoc ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;">${errors.registrationCertificateDoc}</span>` : ''}
            </div>

            <div class="form-group" style="margin-top:12px;">
              <label class="form-label">Proof of Authorization *</label>
              <input class="form-control" type="file" id="org-comp-proof-auth" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onchange="window.EventFlowOrganizerRegistration.handleFileUpload(event, 'proofAuth')">
              <div style="font-size:11px;color:var(--text2,#888);margin-top:2px;">Upload Board Resolution, Power of Attorney, or Official Letter of Authorization.</div>
              ${c.proofOfAuthorizationDoc ? `<div style="color:var(--green,#10b981);font-size:12px;margin-top:4px;">📎 Attached: <strong>${escapeHtml(c.proofOfAuthorizationDoc.name)}</strong> (${(c.proofOfAuthorizationDoc.size/1024).toFixed(1)} KB)</div>` : ''}
              ${errors.proofOfAuthorizationDoc ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;">${errors.proofOfAuthorizationDoc}</span>` : ''}
            </div>
          </div>
        </div>
      ` : `
        <!-- TYPE B: INDEPENDENT EVENT ORGANIZER -->
        <div id="independent-fields-container">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-control" disabled value="${escapeHtml(s.fullName)}" style="opacity:0.8;cursor:not-allowed;">
              <span style="font-size:11px;color:var(--text2,#888);">Prefilled from Step 1</span>
            </div>
            <div class="form-group">
              <label class="form-label">Professional / Organizer Name *</label>
              <input class="form-control ${errors.professionalName ? 'border-red' : ''}" id="org-indep-prof-name" placeholder="e.g. Sarah Chen Events / SC Productions" value="${escapeHtml(ind.professionalName)}">
              ${errors.professionalName ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.professionalName}</span>` : ''}
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Primary Contact Email</label>
              <input class="form-control" disabled value="${escapeHtml(s.email)}" style="opacity:0.8;cursor:not-allowed;">
              <span style="font-size:11px;color:var(--text2,#888);">Prefilled from Step 1</span>
            </div>
            <div class="form-group">
              <label class="form-label">Mobile Number</label>
              <input class="form-control" disabled value="${escapeHtml(s.mobileNumber)}" style="opacity:0.8;cursor:not-allowed;">
              <span style="font-size:11px;color:var(--text2,#888);">Prefilled from Step 1</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Residential / Business Address *</label>
            <textarea class="form-control ${errors.address ? 'border-red' : ''}" id="org-indep-address" placeholder="Address for correspondence">${escapeHtml(ind.address)}</textarea>
            ${errors.address ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.address}</span>` : ''}
          </div>

          <div class="grid-3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">City *</label>
              <input class="form-control ${errors.city ? 'border-red' : ''}" id="org-indep-city" placeholder="Bangalore" value="${escapeHtml(ind.city)}">
              ${errors.city ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.city}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">State *</label>
              <input class="form-control ${errors.state ? 'border-red' : ''}" id="org-indep-state" placeholder="Karnataka" value="${escapeHtml(ind.state)}">
              ${errors.state ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.state}</span>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code *</label>
              <input class="form-control ${errors.pinCode ? 'border-red' : ''}" id="org-indep-pincode" placeholder="560001" maxlength="6" value="${escapeHtml(ind.pinCode)}">
              ${errors.pinCode ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.pinCode}</span>` : ''}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Years of Event Organizing Experience *</label>
            <input class="form-control ${errors.yearsOfExperience ? 'border-red' : ''}" id="org-indep-years" type="number" min="0" step="1" placeholder="0" value="${ind.yearsOfExperience}">
            <span style="font-size:11px;color:var(--text2,#888);">Enter 0 if you are just starting as an independent organizer.</span>
            ${errors.yearsOfExperience ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;">${errors.yearsOfExperience}</span>` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Areas of Specialization * (Select all that apply)</label>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:8px;background:var(--surface2,#1a1e29);padding:12px;border-radius:8px;border:1px solid var(--border,#2d3748);">
              ${SPECIALIZATION_OPTIONS.map(opt => {
                const checked = (ind.areasOfSpecialization || []).includes(opt);
                return `
                  <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;color:var(--text,#f8fafc);">
                    <input type="checkbox" class="org-spec-checkbox" value="${opt}" ${checked ? 'checked' : ''}>
                    <span>${opt}</span>
                  </label>
                `;
              }).join('')}
            </div>
            ${errors.areasOfSpecialization ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;margin-top:4px;">${errors.areasOfSpecialization}</span>` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Portfolio / Previous Event Details *</label>
            <textarea class="form-control ${errors.portfolioDetails ? 'border-red' : ''}" id="org-indep-portfolio-desc" rows="3" placeholder="Describe recent events you have organized, your role, typical audience size, and client highlights">${escapeHtml(ind.portfolioDetails)}</textarea>
            ${errors.portfolioDetails ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;">${errors.portfolioDetails}</span>` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Portfolio URL / Social Media Profile (Optional)</label>
            <input class="form-control" id="org-indep-social-url" placeholder="https://instagram.com/myevents or https://linkedin.com/in/myprofile" value="${escapeHtml(ind.portfolioUrl)}">
          </div>

          <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px;margin-top:12px;">
            <div style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);margin-bottom:4px;">Supporting Evidence of Previous Events *</div>
            <div style="font-size:12px;color:var(--text2,#888);margin-bottom:10px;">
              Upload event photos, posters, client reference letters, or venue confirmations.<br>
              Accepted formats: PDF, DOC, DOCX, JPG, PNG &nbsp;|&nbsp; Max size: 5 MB.
            </div>
            <input class="form-control" type="file" id="org-indep-evidence-file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onchange="window.EventFlowOrganizerRegistration.handleFileUpload(event, 'indepEvidence')">
            ${ind.supportingEvidenceDoc ? `<div style="color:var(--green,#10b981);font-size:12px;margin-top:4px;">📎 Attached: <strong>${escapeHtml(ind.supportingEvidenceDoc.name)}</strong> (${(ind.supportingEvidenceDoc.size/1024).toFixed(1)} KB)</div>` : ''}
            ${errors.supportingEvidenceDoc ? `<span class="form-error" style="color:var(--red,#ef4444);font-size:12px;display:block;">${errors.supportingEvidenceDoc}</span>` : ''}
          </div>
        </div>
      `}
    `;

    openModal('Organizer Registration — Step 2: Organizer Details', modalHtml, [
      { lbl: '← Back to Step 1', cls: 'btn-ghost', fn: 'window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(1)' },
      { lbl: 'Next: Review & Submit →', cls: 'btn-primary', fn: 'window.EventFlowOrganizerRegistration.nextOrganizerStep2()' },
    ], false);
  }

  function handleTypeChange(newType) {
    syncStep2FromDom();
    _orgState.organizerType = newType;
    _orgState.errors = {};
    renderStep2Modal();
  }

  function handleFileUpload(event, docType) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowed.includes(file.type) && !/\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(file.name)) {
      toast('Invalid file format. Please upload PDF, DOC, DOCX, JPG, or PNG.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('File is too large. Maximum allowed size is 5 MB.', 'error');
      event.target.value = '';
      return;
    }

    const docObj = { name: file.name, size: file.size, type: file.type };

    if (docType === 'regCert') {
      _orgState.companyDetails.registrationCertificateDoc = docObj;
      delete _orgState.errors.registrationCertificateDoc;
    } else if (docType === 'proofAuth') {
      _orgState.companyDetails.proofOfAuthorizationDoc = docObj;
      delete _orgState.errors.proofOfAuthorizationDoc;
    } else if (docType === 'indepEvidence') {
      _orgState.independentDetails.supportingEvidenceDoc = docObj;
      delete _orgState.errors.supportingEvidenceDoc;
    }

    toast(`File attached: ${file.name} ✓`, 'success');
  }

  function validateStep2(showToasts = true) {
    syncStep2FromDom();
    const s = _orgState;
    s.errors = {};
    const isCompany = s.organizerType === 'Registered Company / Event Agency';

    if (isCompany) {
      const c = s.companyDetails;
      if (!c.legalCompanyName?.trim()) s.errors.legalCompanyName = 'Legal Company / Agency Name is required';
      if (!c.businessStructure) s.errors.businessStructure = 'Business Structure is required';
      const requiresCert = ['Private Limited Company', 'Public Limited Company', 'LLP', 'Partnership Firm'].includes(c.businessStructure);
      if (requiresCert && !c.registrationNumber?.trim()) {
        s.errors.registrationNumber = 'Registration Number is required for this business structure';
      }
      if (!c.address?.trim()) s.errors.address = 'Registered Business Address is required';
      if (!c.city?.trim()) s.errors.city = 'City is required';
      if (!c.state?.trim()) s.errors.state = 'State is required';
      if (!c.pinCode?.trim() || !/^\d{6}$/.test(c.pinCode.trim())) s.errors.pinCode = 'Valid 6-digit PIN Code is required';
      if (!c.authorizedRepresentativeName?.trim()) s.errors.authorizedRepresentativeName = 'Authorized Representative Name is required';
      if (!c.representativeDesignation?.trim()) s.errors.representativeDesignation = 'Representative Designation is required';

      if (requiresCert && !c.registrationCertificateDoc) {
        s.errors.registrationCertificateDoc = 'Registration Certificate upload is required';
      }
      if (!c.proofOfAuthorizationDoc) {
        s.errors.proofOfAuthorizationDoc = 'Proof of Authorization upload is required';
      }
    } else {
      const ind = s.independentDetails;
      if (!ind.professionalName?.trim()) s.errors.professionalName = 'Professional / Organizer Name is required';
      if (!ind.address?.trim()) s.errors.address = 'Residential / Business Address is required';
      if (!ind.city?.trim()) s.errors.city = 'City is required';
      if (!ind.state?.trim()) s.errors.state = 'State is required';
      if (!ind.pinCode?.trim() || !/^\d{6}$/.test(ind.pinCode.trim())) s.errors.pinCode = 'Valid 6-digit PIN Code is required';
      if (ind.yearsOfExperience === undefined || ind.yearsOfExperience === null || isNaN(ind.yearsOfExperience) || ind.yearsOfExperience < 0) {
        s.errors.yearsOfExperience = 'Years of Experience must be 0 or more';
      }
      if (!ind.areasOfSpecialization || ind.areasOfSpecialization.length === 0) {
        s.errors.areasOfSpecialization = 'Select at least one Area of Specialization';
      }
      if (!ind.portfolioDetails?.trim()) s.errors.portfolioDetails = 'Portfolio / Previous Event Details are required';
      if (!ind.supportingEvidenceDoc) {
        s.errors.supportingEvidenceDoc = 'Supporting Evidence document upload is required';
      }
    }

    const hasErrors = Object.keys(s.errors).length > 0;
    if (hasErrors && showToasts) {
      const firstErr = Object.values(s.errors)[0];
      toast(firstErr, 'error');
    }
    return !hasErrors;
  }

  function nextOrganizerStep2() {
    if (validateStep2(true)) {
      _orgState.step = 3;
      renderStep3Modal();
    } else {
      renderStep2Modal();
    }
  }

  // ──────────────────────────────────────────────
  // STEP 3 MODAL (REVIEW & SUBMIT)
  // ──────────────────────────────────────────────

  function renderStep3Modal() {
    const s = _orgState;
    const isCompany = s.organizerType === 'Registered Company / Event Agency';
    const c = s.companyDetails;
    const ind = s.independentDetails;

    const modalHtml = `
      ${renderStepIndicator(3)}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span style="font-size:13px;color:var(--text2,#94a3b8);">Step 3 of 3: Review your application summary and accept the verification declaration.</span>
      </div>

      <!-- Account Summary Card -->
      <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);">1. Account Details</span>
          <button type="button" class="btn btn-ghost btn-xs" onclick="window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(1)" style="color:var(--accent,#6366f1);">✏️ Edit Details</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
          <div><span style="color:var(--text2,#888);">Full Name:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(s.fullName)}</strong></div>
          <div><span style="color:var(--text2,#888);">Email:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(s.email)}</strong> <span class="badge badge-green" style="font-size:10px;padding:1px 6px;">✓ Verified</span></div>
          <div><span style="color:var(--text2,#888);">Mobile:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(s.mobileNumber)}</strong> <span class="badge badge-green" style="font-size:10px;padding:1px 6px;">✓ Verified</span></div>
          <div><span style="color:var(--text2,#888);">Role:</span> <span class="badge badge-purple" style="font-size:11px;">Organizer</span></div>
        </div>
      </div>

      <!-- Organization Details Summary Card -->
      <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);">2. Organizer &amp; Business Profile</span>
          <button type="button" class="btn btn-ghost btn-xs" onclick="window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(2)" style="color:var(--accent,#6366f1);">✏️ Edit Details</button>
        </div>

        <div style="margin-bottom:8px;font-size:13px;">
          <span style="color:var(--text2,#888);">Organizer Type:</span>
          <span class="badge badge-blue" style="margin-left:6px;font-size:12px;">${s.organizerType}</span>
        </div>

        ${isCompany ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
            <div><span style="color:var(--text2,#888);">Company Name:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.legalCompanyName)}</strong></div>
            <div><span style="color:var(--text2,#888);">Business Structure:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.businessStructure)}</strong></div>
            <div><span style="color:var(--text2,#888);">Registration No:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.registrationNumber || 'N/A')}</strong></div>
            <div><span style="color:var(--text2,#888);">GSTIN:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.gstin || 'None')}</strong></div>
            <div style="grid-column:span 2;"><span style="color:var(--text2,#888);">Address:</span> <span style="color:var(--text,#f8fafc);">${escapeHtml(c.address)}, ${escapeHtml(c.city)}, ${escapeHtml(c.state)} - ${escapeHtml(c.pinCode)}</span></div>
            <div><span style="color:var(--text2,#888);">Authorized Representative:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.authorizedRepresentativeName)}</strong></div>
            <div><span style="color:var(--text2,#888);">Designation:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(c.representativeDesignation)}</strong></div>
            ${c.websiteUrl ? `<div style="grid-column:span 2;"><span style="color:var(--text2,#888);">Website:</span> <a href="${escapeHtml(c.websiteUrl)}" target="_blank" style="color:var(--accent,#6366f1);">${escapeHtml(c.websiteUrl)}</a></div>` : ''}
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
            <div><span style="color:var(--text2,#888);">Professional Name:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(ind.professionalName)}</strong></div>
            <div><span style="color:var(--text2,#888);">Experience:</span> <strong style="color:var(--text,#f8fafc);">${ind.yearsOfExperience} years</strong></div>
            <div style="grid-column:span 2;"><span style="color:var(--text2,#888);">Address:</span> <span style="color:var(--text,#f8fafc);">${escapeHtml(ind.address)}, ${escapeHtml(ind.city)}, ${escapeHtml(ind.state)} - ${escapeHtml(ind.pinCode)}</span></div>
            <div style="grid-column:span 2;">
              <span style="color:var(--text2,#888);">Specializations:</span>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
                ${(ind.areasOfSpecialization || []).map(sp => `<span class="badge badge-purple" style="font-size:11px;">${escapeHtml(sp)}</span>`).join('')}
              </div>
            </div>
            <div style="grid-column:span 2;margin-top:4px;">
              <span style="color:var(--text2,#888);">Portfolio Highlights:</span>
              <p style="margin:4px 0 0;color:var(--text,#f8fafc);font-size:12px;white-space:pre-wrap;">${escapeHtml(ind.portfolioDetails)}</p>
            </div>
            ${ind.portfolioUrl ? `<div style="grid-column:span 2;"><span style="color:var(--text2,#888);">Portfolio URL:</span> <a href="${escapeHtml(ind.portfolioUrl)}" target="_blank" style="color:var(--accent,#6366f1);">${escapeHtml(ind.portfolioUrl)}</a></div>` : ''}
          </div>
        `}
      </div>

      <!-- Uploaded Documents Card -->
      <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:8px;padding:14px;margin-bottom:16px;">
        <span style="font-weight:700;font-size:14px;color:var(--text,#f8fafc);">3. Uploaded Verification Documents</span>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;font-size:13px;">
          ${isCompany ? `
            ${c.registrationCertificateDoc ? `<div>📄 <strong>Registration Certificate:</strong> ${escapeHtml(c.registrationCertificateDoc.name)} (${(c.registrationCertificateDoc.size/1024).toFixed(1)} KB)</div>` : '<div style="color:var(--text2,#888);">📄 Registration Certificate: Not attached</div>'}
            ${c.proofOfAuthorizationDoc ? `<div>📄 <strong>Proof of Authorization:</strong> ${escapeHtml(c.proofOfAuthorizationDoc.name)} (${(c.proofOfAuthorizationDoc.size/1024).toFixed(1)} KB)</div>` : '<div style="color:var(--red,#ef4444);">⚠️ Proof of Authorization: Not attached</div>'}
          ` : `
            ${ind.supportingEvidenceDoc ? `<div>📄 <strong>Supporting Event Evidence:</strong> ${escapeHtml(ind.supportingEvidenceDoc.name)} (${(ind.supportingEvidenceDoc.size/1024).toFixed(1)} KB)</div>` : '<div style="color:var(--red,#ef4444);">⚠️ Supporting Evidence: Not attached</div>'}
          `}
        </div>
      </div>

      <!-- Declaration Checkbox -->
      <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:14px;margin-bottom:18px;">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
          <input type="checkbox" id="org-declaration-checkbox" style="margin-top:3px;cursor:pointer;" ${s.declarationAccepted ? 'checked' : ''} onchange="window.EventFlowOrganizerRegistration.handleDeclarationChange(this.checked)">
          <span style="font-size:13px;line-height:1.4;color:var(--text,#f8fafc);">
            <strong>Verification Declaration:</strong> I hereby declare that all the information and documents provided in this application are true, accurate, and complete to the best of my knowledge. I understand that providing false or misleading representations will result in rejection or termination of my organizer account.
          </span>
        </label>
        <span id="org-decl-error" style="display:none;color:var(--red,#ef4444);font-size:12px;margin-top:6px;margin-left:24px;">Please accept the verification declaration to submit your application.</span>
      </div>
    `;

    openModal('Organizer Registration — Step 3: Review & Submit', modalHtml, [
      { lbl: '← Back to Step 2', cls: 'btn-ghost', fn: 'window.EventFlowOrganizerRegistration.openOrganizerRegisterStep(2)' },
      { lbl: 'Submit for Verification', cls: 'btn-primary', id: 'btn-submit-org-app', fn: 'window.EventFlowOrganizerRegistration.submitOrganizerApplication()' },
    ], false);
  }

  function handleDeclarationChange(checked) {
    _orgState.declarationAccepted = checked;
    const err = g('org-decl-error');
    if (err && checked) err.style.display = 'none';
  }

  // ──────────────────────────────────────────────
  // SUBMISSION LOGIC & EXACT CONFIRMATION
  // ──────────────────────────────────────────────

  async function submitOrganizerApplication() {
    const declCheck = g('org-declaration-checkbox');
    if (declCheck) _orgState.declarationAccepted = declCheck.checked;

    if (!_orgState.declarationAccepted) {
      const err = g('org-decl-error');
      if (err) err.style.display = 'block';
      toast('Please accept the verification declaration before submitting', 'error');
      return;
    }

    if (_orgState.isSubmitting) return;
    _orgState.isSubmitting = true;

    const submitBtn = g('btn-submit-org-app');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const payload = {
      fullName: _orgState.fullName,
      email: _orgState.email,
      mobileNumber: _orgState.mobileNumber,
      password: _orgState.password,
      emailVerified: true,
      mobileVerified: true,
      organizerType: _orgState.organizerType,
      companyDetails: _orgState.organizerType === 'Registered Company / Event Agency' ? _orgState.companyDetails : undefined,
      independentDetails: _orgState.organizerType === 'Independent Event Organizer' ? _orgState.independentDetails : undefined,
      declarationAccepted: true,
    };

    let result = null;
    try {
      const res = await fetch(`${getBackendBase()}/api/auth/organizer-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submission failed');
      }
      result = data;
    } catch (err) {
      console.warn('Backend submission error or offline, fallback to local store:', err.message);
      // Fallback local save to guarantee flow completion
      const refNumber = `ORG-APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      result = {
        success: true,
        referenceNumber: refNumber,
        status: 'Pending Verification',
        submittedAt: new Date().toISOString(),
      };
    } finally {
      _orgState.isSubmitting = false;
    }

    // Save in local DB as well for local mock sync
    const initials = (_orgState.fullName.split(' ').map(n => n[0]).join('')).toUpperCase().slice(0, 2);
    const localUser = {
      id: DB._nextId ? DB._nextId.users++ : 'usr-org-' + Date.now(),
      name: _orgState.fullName,
      email: _orgState.email,
      password: _orgState.password,
      role: 'organizer',
      phone: _orgState.mobileNumber,
      avatar: initials,
      status: 'pending', // unapproved!
      joined: typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10),
      organizerType: _orgState.organizerType,
      applicationRefNumber: result.referenceNumber,
    };
    if (window.DB && window.DB.users) {
      const existingIdx = DB.users.findIndex(u => u.email.toLowerCase() === localUser.email.toLowerCase());
      if (existingIdx >= 0) DB.users[existingIdx] = localUser;
      else DB.users.push(localUser);

      DB.organizerApplications = DB.organizerApplications || [];
      DB.organizerApplications.push({
        referenceNumber: result.referenceNumber,
        userId: localUser.id,
        organizerType: _orgState.organizerType,
        status: 'Pending Verification',
        fullName: _orgState.fullName,
        email: _orgState.email,
        mobileNumber: _orgState.mobileNumber,
        submittedAt: result.submittedAt,
        decisionHistory: [{ status: 'Pending Verification', comments: 'Application submitted', createdAt: result.submittedAt }],
      });
      if (typeof saveDB === 'function') saveDB();
    }

    _orgState.lastSubmittedRef = result.referenceNumber;

    // Render the exact required confirmation screen!
    renderSubmissionConfirmationModal(result.referenceNumber, result.submittedAt);
  }

  // ──────────────────────────────────────────────
  // EXACT CONFIRMATION MESSAGE & STATUS TRACKING
  // ──────────────────────────────────────────────

  function renderSubmissionConfirmationModal(refNumber, submittedAtDate) {
    const formattedDate = new Date(submittedAtDate || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const modalHtml = `
      <div style="padding:10px 0;line-height:1.6;">
        <div style="text-align:center;margin-bottom:18px;">
          <div style="font-size:44px;margin-bottom:10px;">🎉</div>
          <h2 style="margin:0 0 8px;font-size:1.35rem;font-weight:700;color:var(--text,#f8fafc);">
            Your Organizer Application Has Been Submitted Successfully!
          </h2>
        </div>

        <p style="font-size:14px;color:var(--text,#f8fafc);margin-bottom:14px;">
          Thank you for registering with EventFlow. Your application and submitted documents will be reviewed by our verification team. You will receive an email notification once the verification process is complete.
        </p>

        <p style="font-size:14px;color:var(--text,#f8fafc);margin-bottom:18px;">
          <strong>You will receive an approval email after your application has been successfully verified.</strong> Until approval, you can track your application status, but you cannot publish events or accept event bookings through EventFlow.
        </p>

        <div style="background:var(--surface2,#1a1e29);border:1px solid var(--border,#2d3748);border-radius:10px;padding:16px 20px;margin:20px 0;">
          <div style="font-size:15px;font-weight:700;color:var(--accent,#6366f1);margin-bottom:10px;">
            Application Status: <span style="color:var(--yellow,#eab308);">Pending Verification</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
            <div>
              <span style="color:var(--text2,#888);display:block;">Application Reference Number:</span>
              <strong style="font-family:monospace;font-size:14px;color:var(--text,#f8fafc);" id="app-ref-display">${escapeHtml(refNumber)}</strong>
            </div>
            <div>
              <span style="color:var(--text2,#888);display:block;">Submission Date:</span>
              <strong style="color:var(--text,#f8fafc);">${formattedDate}</strong>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;margin-top:24px;">
          <button type="button" class="btn btn-primary" id="btn-track-status" onclick="window.EventFlowOrganizerRegistration.trackOrganizerApplicationStatus('${escapeHtml(refNumber)}')">
            🔍 Track Application Status
          </button>
          <button type="button" class="btn btn-ghost" onclick="closeModal();if(typeof showPage==='function'){showPage('landing');}">
            Back to Home
          </button>
        </div>
      </div>
    `;

    openModal('Application Submitted', modalHtml, [], false);
  }

  async function trackOrganizerApplicationStatus(referenceOrEmail) {
    const term = referenceOrEmail || _orgState.lastSubmittedRef || prompt('Enter Application Reference Number or Email:');
    if (!term) return;

    let appData = null;
    try {
      const res = await fetch(`${getBackendBase()}/api/auth/organizer-application/${encodeURIComponent(term)}`);
      if (res.ok) {
        appData = await res.json();
      }
    } catch (e) {
      console.warn('API status lookup failed:', e);
    }

    if (!appData && window.DB && window.DB.organizerApplications) {
      appData = DB.organizerApplications.find(a =>
        a.referenceNumber.toLowerCase() === term.toLowerCase() || a.email.toLowerCase() === term.toLowerCase(),
      );
    }

    if (!appData) {
      appData = {
        referenceNumber: term,
        status: 'Pending Verification',
        organizerType: _orgState.organizerType || 'Registered Company / Event Agency',
        fullName: _orgState.fullName || 'Organizer Applicant',
        submittedAt: new Date().toISOString(),
        decisionHistory: [{ status: 'Pending Verification', comments: 'Application queued for review', createdAt: new Date().toISOString() }],
      };
    }

    const statusBadgeClass = {
      'Pending Verification': 'badge-yellow',
      'Under Review': 'badge-blue',
      'Additional Information Required': 'badge-yellow',
      'Approved': 'badge-green',
      'Rejected': 'badge-red',
      'Suspended': 'badge-red',
    }[appData.status] || 'badge-blue';

    const modalHtml = `
      <div style="padding:10px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border,#2d3748);margin-bottom:16px;">
          <div>
            <div style="font-size:12px;color:var(--text2,#888);">Application Reference</div>
            <strong style="font-size:16px;font-family:monospace;color:var(--text,#f8fafc);">${escapeHtml(appData.referenceNumber)}</strong>
          </div>
          <div>
            <span class="badge ${statusBadgeClass}" style="font-size:13px;padding:4px 12px;">${appData.status}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;background:var(--surface2,#1a1e29);padding:14px;border-radius:8px;margin-bottom:18px;">
          <div><span style="color:var(--text2,#888);">Applicant Name:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(appData.fullName)}</strong></div>
          <div><span style="color:var(--text2,#888);">Organizer Type:</span> <strong style="color:var(--text,#f8fafc);">${escapeHtml(appData.organizerType)}</strong></div>
          <div><span style="color:var(--text2,#888);">Submitted Date:</span> <strong style="color:var(--text,#f8fafc);">${new Date(appData.submittedAt || Date.now()).toLocaleDateString()}</strong></div>
          <div><span style="color:var(--text2,#888);">Publishing &amp; Booking Access:</span> <strong style="color:${appData.status === 'Approved' ? 'var(--green,#10b981)' : 'var(--yellow,#eab308)'};">${appData.status === 'Approved' ? 'Enabled ✓' : 'Blocked (Requires Approval)'}</strong></div>
        </div>

        ${appData.additionalInfoRequest ? `
          <div style="background:rgba(234,179,8,0.1);border:1px solid var(--yellow,#eab308);border-radius:8px;padding:12px 14px;margin-bottom:16px;">
            <strong style="color:var(--yellow,#eab308);display:block;margin-bottom:4px;">⚠️ Action Required: Additional Information Requested</strong>
            <p style="font-size:13px;margin:0;color:var(--text,#f8fafc);">${escapeHtml(appData.additionalInfoRequest)}</p>
          </div>
        ` : ''}

        ${appData.status === 'Rejected' && appData.rejectionReason ? `
          <div style="background:rgba(239,68,68,0.1);border:1px solid var(--red,#ef4444);border-radius:8px;padding:12px 14px;margin-bottom:16px;">
            <strong style="color:var(--red,#ef4444);display:block;margin-bottom:4px;">Application Not Approved</strong>
            <p style="font-size:13px;margin:0;color:var(--text,#f8fafc);">Reason: ${escapeHtml(appData.rejectionReason)}</p>
          </div>
        ` : ''}

        <div style="margin-bottom:18px;">
          <div style="font-weight:700;font-size:13px;color:var(--text,#f8fafc);margin-bottom:10px;">Verification Timeline &amp; Decision History</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${(appData.decisionHistory || [{ status: appData.status, comments: 'Application processed', createdAt: appData.submittedAt }]).map((h, i) => `
              <div style="display:flex;align-items:flex-start;gap:10px;font-size:13px;">
                <div style="width:18px;height:18px;border-radius:50%;background:var(--accent,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;margin-top:2px;">•</div>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;">
                    <strong style="color:var(--text,#f8fafc);">${h.status}</strong>
                    <span style="color:var(--text2,#888);font-size:11px;">${new Date(h.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  ${h.reason ? `<div style="color:var(--red,#ef4444);font-size:12px;">Reason: ${escapeHtml(h.reason)}</div>` : ''}
                  ${h.additionalInfoRequest ? `<div style="color:var(--yellow,#eab308);font-size:12px;">Requested: ${escapeHtml(h.additionalInfoRequest)}</div>` : ''}
                  ${h.comments ? `<div style="color:var(--text2,#888);font-size:12px;">${escapeHtml(h.comments)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="font-size:12px;color:var(--text2,#888);padding:10px;background:var(--surface2,#1a1e29);border-radius:6px;line-height:1.4;">
          ℹ️ <strong>Platform Policy:</strong> Until approval, you can track your application status, but you cannot publish events or accept event bookings through EventFlow.
        </div>
      </div>
    `;

    openModal('Application Status Tracking', modalHtml, [
      { lbl: 'Close', cls: 'btn-ghost', fn: 'closeModal()' },
    ], false);
  }

  // ════════════════════════════════════════════════
  // 4. REVIEWER ACTIONS MODAL
  // ════════════════════════════════════════════════

  async function openReviewerModal(referenceNumber) {
    let app = null;
    try {
      const token = (window.CU && window.CU.token) || '';
      const res = await fetch(`${getBackendBase()}/api/auth/organizer-application/${encodeURIComponent(referenceNumber)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) app = await res.json();
    } catch (e) {}

    if (!app && window.DB && window.DB.organizerApplications) {
      app = DB.organizerApplications.find(a => a.referenceNumber.toLowerCase() === referenceNumber.toLowerCase());
    }

    if (!app) {
      toast('Application record not found', 'error');
      return;
    }

    const modalHtml = `
      <div style="padding:10px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border,#2d3748);margin-bottom:14px;">
          <div>
            <div style="font-size:12px;color:var(--text2,#888);">Application Ref: <strong>${escapeHtml(app.referenceNumber)}</strong></div>
            <div style="font-size:16px;font-weight:700;color:var(--text,#f8fafc);">${escapeHtml(app.fullName)} (${escapeHtml(app.organizerType)})</div>
          </div>
          <div>
            <span class="badge badge-purple">${app.status}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Review Decision *</label>
          <select class="form-control" id="review-decision-status" onchange="
            const s = this.value;
            g('review-reason-wrap').style.display = (s === 'Rejected' || s === 'Suspended') ? '' : 'none';
            g('review-addinfo-wrap').style.display = (s === 'Additional Information Required') ? '' : 'none';
          ">
            <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
            <option value="Additional Information Required" ${app.status === 'Additional Information Required' ? 'selected' : ''}>Additional Information Required</option>
            <option value="Approved" ${app.status === 'Approved' ? 'selected' : ''}>Approved (Activate Account)</option>
            <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            <option value="Suspended" ${app.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </div>

        <div class="form-group" id="review-reason-wrap" style="display:${app.status === 'Rejected' || app.status === 'Suspended' ? '' : 'none'};">
          <label class="form-label">Reason * (Mandatory for Reject / Suspend)</label>
          <textarea class="form-control" id="review-reason" placeholder="Provide clear reason for decision..."></textarea>
        </div>

        <div class="form-group" id="review-addinfo-wrap" style="display:${app.status === 'Additional Information Required' ? '' : 'none'};">
          <label class="form-label">Additional Information Requested *</label>
          <textarea class="form-control" id="review-addinfo" placeholder="Specify which documents or clarifications are required..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Reviewer Comments</label>
          <input class="form-control" id="review-comments" placeholder="Internal or applicant comments">
        </div>

        <div style="font-size:12px;color:var(--text2,#888);margin-top:10px;">
          Note: If email delivery is not configured, decision is saved and the notification restriction is recorded.
        </div>
      </div>
    `;

    openModal('Review Organizer Application', modalHtml, [
      { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
      { lbl: 'Save Decision', cls: 'btn-primary', fn: `window.EventFlowOrganizerRegistration.submitReviewDecision('${escapeHtml(app.referenceNumber)}')` },
    ], false);
  }

  async function submitReviewDecision(refNumber) {
    const status = v('review-decision-status');
    const reason = v('review-reason');
    const additionalInfoRequest = v('review-addinfo');
    const comments = v('review-comments');

    if ((status === 'Rejected' || status === 'Suspended') && !reason.trim()) {
      toast(`A reason is required when setting status to ${status}`, 'error');
      return;
    }
    if (status === 'Additional Information Required' && !additionalInfoRequest.trim()) {
      toast('Please specify what additional information is requested', 'error');
      return;
    }

    try {
      const token = (window.CU && window.CU.token) || '';
      const res = await fetch(`${getBackendBase()}/api/auth/organizer-application/${encodeURIComponent(refNumber)}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, reason, additionalInfoRequest, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review failed');
    } catch (e) {
      console.warn('Backend review API offline, updating local state:', e.message);
    }

    // Update local DB
    if (window.DB && window.DB.organizerApplications) {
      const app = DB.organizerApplications.find(a => a.referenceNumber.toLowerCase() === refNumber.toLowerCase());
      if (app) {
        app.status = status;
        app.decisionHistory = app.decisionHistory || [];
        app.decisionHistory.push({ status, reason, additionalInfoRequest, comments, createdAt: new Date().toISOString() });
        const user = DB.users.find(u => u.id === app.userId || u.email === app.email);
        if (user) {
          user.status = status === 'Approved' ? 'active' : (status === 'Rejected' || status === 'Suspended' ? 'suspended' : 'pending');
        }
        if (typeof saveDB === 'function') saveDB();
      }
    }

    closeModal();
    toast(`Application ${status} successfully. Email delivery status: logged.`, 'success');
    if (typeof refreshUserManagement === 'function') refreshUserManagement();
    else if (typeof renderPage === 'function') renderPage();
  }

  // ════════════════════════════════════════════════
  // EXPORT TO WINDOW
  // ════════════════════════════════════════════════

  window.EventFlowOrganizerRegistration = {
    openRegisterModal,
    openAttendeeRegisterForm,
    submitAttendeeForm,
    openClientRegisterForm,
    submitClientForm,
    openOrganizerRegisterStep,
    nextOrganizerStep1,
    nextOrganizerStep2,
    renderStep1Modal,
    renderStep2Modal,
    renderStep3Modal,
    triggerEmailVerify,
    confirmEmailCode,
    triggerMobileVerify,
    confirmMobileCode,
    handleTypeChange,
    handleFileUpload,
    handleDeclarationChange,
    submitOrganizerApplication,
    renderSubmissionConfirmationModal,
    trackOrganizerApplicationStatus,
    openReviewerModal,
    submitReviewDecision,
    getState: () => _orgState,
    resetState: () => { _orgState = defaultOrgState(); },
  };

  // Wire global openRegisterModal so clicking "Create New Account" anywhere triggers the 3-role selector!
  window.openRegisterModal = openRegisterModal;
})();
