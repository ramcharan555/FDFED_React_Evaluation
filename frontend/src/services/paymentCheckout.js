/* ========================================================================
   EventFlow — Simulated Payment Checkout  (DEMO ONLY)
   Intercepts regForEvent / completeDemoPayment and shows a professional
   checkout UI with Card + UPI options.
   No real payment gateway is used. No card numbers or CVVs are stored.
   ======================================================================== */
(() => {
  const pcoById = (id) => document.getElementById(id);
  const pcoEsc  = (v) => String(v ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* Luhn algorithm */
  function luhn(num) {
    const d = num.replace(/\D/g, '');
    let sum = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = parseInt(d[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return d.length >= 13 && sum % 10 === 0;
  }

  /* Validate MM/YY */
  function validExpiry(val) {
    const m = val.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const mm = parseInt(m[1], 10), yy = parseInt(m[2], 10);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const cy  = 2000 + yy;
    return cy > now.getFullYear() || (cy === now.getFullYear() && mm >= now.getMonth() + 1);
  }

  /* Validate UPI ID */
  function validUpi(upi) {
    return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/.test(upi.trim());
  }

  /* Card brand */
  function cardBrand(num) {
    const n = num.replace(/\D/g, '');
    if (/^4/.test(n))      return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^6/.test(n))      return 'RuPay';
    if (/^3[47]/.test(n))  return 'Amex';
    return '';
  }

  /* ------------------------------------------------------------------ */
  /* Checkout HTML                                                        */
  /* ------------------------------------------------------------------ */
  function checkoutHTML(event, price) {
    const isFree    = price === 0;
    const priceStr  = isFree ? 'Free' : '\u20b9' + price;
    const eEmoji    = pcoEsc(event.emoji || '\u{1F3AB}');
    const eTitle    = pcoEsc(event.title || 'Event');
    const eDate     = pcoEsc(event.date  || '');
    const eVenue    = pcoEsc(event.venue || '');

    return `
<div class="pco-wrap" id="pco-wrap">
  <div class="pco-demo-notice">
    <span class="pco-demo-badge">&#x1F512; DEMO MODE</span>
    <span>Simulated payment &#x2014; no real money transferred. No card data stored.</span>
  </div>

  <!-- STEP 1: Form -->
  <div id="pco-step-form">
    <div class="pco-order-summary">
      <div class="pco-order-event">
        <span class="pco-order-emoji">${eEmoji}</span>
        <div class="pco-order-info">
          <div class="pco-order-title">${eTitle}</div>
          <div class="pco-order-meta">&#x1F4C5; ${eDate}${eVenue ? ' &middot; &#x1F4CD; ' + eVenue : ''}</div>
        </div>
      </div>
      <div class="pco-price-rows">
        <div class="pco-price-row"><span>Ticket (1&times;)</span><span>${priceStr}</span></div>
        <div class="pco-price-row"><span>Platform fee</span><span>\u20b90</span></div>
        <div class="pco-price-row pco-price-total"><span>Total</span><span>${priceStr}</span></div>
      </div>
    </div>

    ${isFree ? '<div class="pco-free-notice">&#x2705; This is a free event &#x2014; no payment required!</div>' : `
    <div class="pco-method-tabs">
      <button class="pco-method-tab active" id="tab-card" onclick="pcoSwitchTab('card')" type="button">&#x1F4B3; Debit / Credit Card</button>
      <button class="pco-method-tab" id="tab-upi" onclick="pcoSwitchTab('upi')" type="button">&#x1F4F1; UPI</button>
    </div>

    <div id="pco-panel-card" class="pco-panel">
      <div class="pco-field-group">
        <label class="pco-label" for="pco-holder">Cardholder Name</label>
        <input class="pco-input" id="pco-holder" placeholder="As on card" autocomplete="cc-name" maxlength="60"/>
        <span class="pco-err" id="pco-holder-err">Enter the name as printed on the card.</span>
      </div>
      <div class="pco-field-group">
        <label class="pco-label" for="pco-number">Card Number</label>
        <div class="pco-input-row">
          <input class="pco-input pco-mono" id="pco-number" placeholder="XXXX XXXX XXXX XXXX"
            autocomplete="cc-number" inputmode="numeric" maxlength="19"
            oninput="pcoFmtCard(this)"/>
          <span class="pco-card-brand" id="pco-brand">&#x1F4B3;</span>
        </div>
        <span class="pco-err" id="pco-number-err">Enter a valid 13&#x2013;16 digit card number.</span>
      </div>
      <div class="pco-row-2">
        <div class="pco-field-group">
          <label class="pco-label" for="pco-expiry">Expiry (MM/YY)</label>
          <input class="pco-input pco-mono" id="pco-expiry" placeholder="MM/YY"
            autocomplete="cc-exp" inputmode="numeric" maxlength="5"
            oninput="pcoFmtExpiry(this)"/>
          <span class="pco-err" id="pco-expiry-err">Enter a valid, non-expired date.</span>
        </div>
        <div class="pco-field-group">
          <label class="pco-label" for="pco-cvv">CVV</label>
          <div class="pco-input-row">
            <input class="pco-input pco-mono" id="pco-cvv" placeholder="&bull;&bull;&bull;"
              autocomplete="off" inputmode="numeric" maxlength="4" type="password"/>
            <span class="pco-cvv-tip" title="3-digit code on back of card (4 for Amex)">?</span>
          </div>
          <span class="pco-err" id="pco-cvv-err">Enter the 3 or 4 digit CVV.</span>
        </div>
      </div>
    </div>

    <div id="pco-panel-upi" class="pco-panel" style="display:none">
      <div class="pco-field-group">
        <label class="pco-label" for="pco-upi">UPI ID</label>
        <input class="pco-input" id="pco-upi" placeholder="yourname@upi"
          autocomplete="off" inputmode="email" maxlength="100"/>
        <span class="pco-err" id="pco-upi-err">Enter a valid UPI ID (e.g. name@okaxis).</span>
      </div>
      <div class="pco-upi-apps">
        <button class="pco-upi-app" onclick="pcoFillUpi('gpay')" type="button" title="Google Pay">GPay</button>
        <button class="pco-upi-app" onclick="pcoFillUpi('phonepe')" type="button" title="PhonePe">PhonePe</button>
        <button class="pco-upi-app" onclick="pcoFillUpi('paytm')" type="button" title="Paytm">Paytm</button>
        <button class="pco-upi-app" onclick="pcoFillUpi('bhim')" type="button" title="BHIM">BHIM</button>
      </div>
      <p class="pco-upi-hint">Tap an app button to auto-fill a sample UPI ID for testing.</p>
    </div>
    `}

    <button class="pco-pay-btn" id="pco-pay-btn" onclick="pcoSubmitPayment()" type="button">
      ${isFree ? '&#x2705; Confirm Registration' : '&#x1F512; Pay ' + priceStr}
    </button>
    <p class="pco-secure-note">&#x1F512; Simulated checkout &mdash; no real payment processed &mdash; card details not stored</p>
  </div>

  <!-- STEP 2: Processing -->
  <div id="pco-step-processing" style="display:none" class="pco-state-panel">
    <div class="pco-spinner"></div>
    <div class="pco-state-title" id="pco-proc-title">Processing payment&hellip;</div>
    <div class="pco-state-sub" id="pco-proc-sub">Please wait, do not close this window.</div>
  </div>

  <!-- STEP 3: Result -->
  <div id="pco-step-result" style="display:none" class="pco-state-panel">
    <div class="pco-result-icon" id="pco-result-icon"></div>
    <div class="pco-state-title" id="pco-result-title"></div>
    <div class="pco-state-sub" id="pco-result-sub"></div>
    <div id="pco-result-detail" class="pco-result-detail"></div>
    <div class="pco-result-actions" id="pco-result-actions"></div>
  </div>
</div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Global helpers exposed on window                                     */
  /* ------------------------------------------------------------------ */
  window.pcoSwitchTab = function (tab) {
    const card = pcoById('pco-panel-card');
    const upi  = pcoById('pco-panel-upi');
    const tCard = pcoById('tab-card');
    const tUpi  = pcoById('tab-upi');
    if (!card) return;
    const isCard = tab === 'card';
    card.style.display = isCard ? '' : 'none';
    upi.style.display  = isCard ? 'none' : '';
    tCard && tCard.classList.toggle('active', isCard);
    tUpi  && tUpi.classList.toggle('active', !isCard);
    const wrap = pcoById('pco-wrap');
    if (wrap) wrap.dataset.pcoMethod = tab;
  };

  window.pcoFmtCard = function (input) {
    const raw = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = raw.replace(/(.{4})/g, '$1 ').trim();
    const el = pcoById('pco-brand');
    if (el) el.textContent = cardBrand(raw) || '\u{1F4B3}';
  };

  window.pcoFmtExpiry = function (input) {
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    input.value = v;
  };

  window.pcoFillUpi = function (app) {
    const samples = { gpay: 'demo.user@okicici', phonepe: 'demo.user@ybl', paytm: 'demo.user@paytm', bhim: 'demo.user@upi' };
    const el = pcoById('pco-upi');
    if (el) { el.value = samples[app] || ''; el.focus(); pcoClrErr('pco-upi-err'); }
  };

  function pcoShowErr(id, msg) {
    const el = pcoById(id); if (!el) return;
    el.textContent = msg; el.classList.add('visible');
    const inp = el.previousElementSibling?.querySelector('input') || el.previousElementSibling;
    inp && inp.classList && inp.classList.add('pco-input-err');
  }

  function pcoClrErr(id) {
    const el = pcoById(id); if (!el) return;
    el.classList.remove('visible');
    const inp = el.previousElementSibling?.querySelector('input') || el.previousElementSibling;
    inp && inp.classList && inp.classList.remove('pco-input-err');
  }
  window.pcoClrErr = pcoClrErr;

  function pcoValidate(method) {
    let ok = true;
    if (method === 'card') {
      const holder = (pcoById('pco-holder')?.value || '').trim();
      const number = (pcoById('pco-number')?.value || '').replace(/\s/g, '');
      const expiry =  pcoById('pco-expiry')?.value || '';
      const cvv    = (pcoById('pco-cvv')?.value || '').trim();
      if (!holder || holder.length < 2)   { pcoShowErr('pco-holder-err', 'Enter the name as printed on the card.'); ok = false; } else pcoClrErr('pco-holder-err');
      if (!luhn(number))                  { pcoShowErr('pco-number-err', 'Enter a valid 13\u201316 digit card number.'); ok = false; } else pcoClrErr('pco-number-err');
      if (!validExpiry(expiry))           { pcoShowErr('pco-expiry-err', 'Enter a valid, non-expired date.'); ok = false; } else pcoClrErr('pco-expiry-err');
      if (!cvv || cvv.length < 3)         { pcoShowErr('pco-cvv-err', 'Enter the 3 or 4 digit CVV.'); ok = false; } else pcoClrErr('pco-cvv-err');
    }
    if (method === 'upi') {
      const upi = (pcoById('pco-upi')?.value || '').trim();
      if (!validUpi(upi)) { pcoShowErr('pco-upi-err', 'Enter a valid UPI ID (e.g. name@okaxis).'); ok = false; } else pcoClrErr('pco-upi-err');
    }
    return ok;
  }

  function showPanel(id) {
    ['pco-step-form','pco-step-processing','pco-step-result'].forEach(p => {
      const el = pcoById(p); if (el) el.style.display = p === id ? '' : 'none';
    });
  }

  function showProcessing(title, sub) {
    showPanel('pco-step-processing');
    const t = pcoById('pco-proc-title'); if (t) t.textContent = title;
    const s = pcoById('pco-proc-sub');   if (s) s.textContent = sub;
    const foot = document.getElementById('modal-foot'); if (foot) foot.style.display = 'none';
  }

  function showResult({ success, icon, title, sub, detail, actions }) {
    showPanel('pco-step-result');
    const ri  = pcoById('pco-result-icon');   if (ri)  { ri.textContent = icon; ri.className = 'pco-result-icon ' + (success ? 'pco-success' : 'pco-failure'); }
    const rt  = pcoById('pco-result-title');  if (rt)  rt.textContent = title;
    const rs  = pcoById('pco-result-sub');    if (rs)  rs.textContent = sub;
    const rd  = pcoById('pco-result-detail'); if (rd)  rd.innerHTML   = detail  || '';
    const ra  = pcoById('pco-result-actions');if (ra)  ra.innerHTML   = actions || '';
  }

  /* ------------------------------------------------------------------ */
  /* Submit handler                                                       */
  /* ------------------------------------------------------------------ */
  window.pcoSubmitPayment = function () {
    const wrap   = pcoById('pco-wrap'); if (!wrap) return;
    const method = wrap.dataset.pcoMethod || 'card';
    const eventId = wrap.dataset.pcoEventId;
    const isFree  = wrap.dataset.pcoFree === '1';
    const regId   = wrap.dataset.pcoRegId || '';
    const price   = parseFloat(wrap.dataset.pcoPrice) || 0;
    const title   = wrap.dataset.pcoTitle || 'Event';

    if (!isFree && !pcoValidate(method)) return;

    const payBtn = pcoById('pco-pay-btn'); if (payBtn) payBtn.disabled = true;

    if (isFree) {
      showProcessing('Confirming registration\u2026', 'Please wait.');
      pcoDoRegister(eventId, null, 0, 'free')
        .then(() => showResult({
          success: true, icon: '\u2705',
          title: 'Registration Confirmed!',
          sub:   "You\u2019re in! Check My Tickets for your booking.",
          detail: `<div class="pco-txn-row"><span>Event</span><span>${pcoEsc(title)}</span></div><div class="pco-txn-row"><span>Payment</span><span>Free</span></div>`,
          actions: '<button class="pco-btn-primary" onclick="closeModal();goNav(\'my-tickets\')">View My Tickets \u2192</button>',
        }))
        .catch(err => showResult({
          success: false, icon: '\u274C',
          title: 'Registration Failed', sub: err.message || 'Something went wrong.',
          actions: '<button class="pco-btn-ghost" onclick="closeModal()">Close</button>',
        }));
      return;
    }

    const upiId  = (pcoById('pco-upi')?.value || '').trim();
    const cardLast4 = (pcoById('pco-number')?.value || '').replace(/\s/g, '').slice(-4);
    const methodLabel = method === 'upi'
      ? 'UPI (' + upiId + ')'
      : 'Card ending ' + (cardLast4 || '****');

    showProcessing('Authenticating payment\u2026', 'Connecting to payment network\u2026');

    setTimeout(() => {
      const t = pcoById('pco-proc-title'); if (t) t.textContent = 'Verifying payment\u2026';
      const s = pcoById('pco-proc-sub');   if (s) s.textContent = 'Awaiting bank confirmation\u2026';
    }, 900);

    const willSucceed = true;
    const delay       = 1400;

    setTimeout(() => {
      const t = pcoById('pco-proc-title'); if (t) t.textContent = 'Almost done\u2026';
      const s = pcoById('pco-proc-sub');   if (s) s.textContent = 'Finalising your booking\u2026';
    }, delay - 400);

    setTimeout(() => {
      if (!willSucceed) {
        const reasons = [
          'Payment declined by your bank. Please try a different payment method.',
          'Transaction limit exceeded. Please contact your bank.',
          'Insufficient funds. Please use a different card or UPI.',
          'Bank authentication failed. Please retry or use another method.',
        ];
        showResult({
          success: false, icon: '\u274C',
          title: 'Payment Failed',
          sub:   reasons[Math.floor(Math.random() * reasons.length)],
          actions: `<button class="pco-btn-primary" onclick="pcoRetry()">Retry Payment</button><button class="pco-btn-ghost" onclick="closeModal()">Cancel</button>`,
        });
        return;
      }

      const action = regId
        ? pcoDoMakePayment(regId, price, method)
        : pcoDoRegister(eventId, method, price, 'standard');

      action.then(data => {
        const txnId = (data && (data.registrationId || data.paymentId)) || ('EF-TXN-' + Date.now().toString(36).toUpperCase());
        showResult({
          success: true, icon: '\uD83C\uDF89',
          title: 'Payment Successful!',
          sub:   'Your registration is confirmed. Enjoy the event!',
          detail: `
            <div class="pco-txn-row"><span>Event</span><span>${pcoEsc(title)}</span></div>
            <div class="pco-txn-row"><span>Amount paid</span><span>\u20b9${price}</span></div>
            <div class="pco-txn-row"><span>Method</span><span>${pcoEsc(methodLabel)}</span></div>
            <div class="pco-txn-row"><span>Transaction ID</span><span class="pco-mono">${pcoEsc(txnId)}</span></div>
            <div class="pco-txn-row"><span>Status</span><span class="pco-badge-success">Confirmed</span></div>`,
          actions: '<button class="pco-btn-primary" onclick="closeModal();goNav(\'my-tickets\')">View My Tickets \u2192</button>',
        });
      }).catch(err => showResult({
        success: false, icon: '\u274C',
        title: 'Registration Error',
        sub:   err.message || 'Payment succeeded but registration could not be confirmed. Contact support.',
        actions: `<button class="pco-btn-primary" onclick="pcoRetry()">Retry</button><button class="pco-btn-ghost" onclick="closeModal()">Cancel</button>`,
      }));
    }, delay);
  };

  window.pcoRetry = function () {
    showPanel('pco-step-form');
    const foot = document.getElementById('modal-foot'); if (foot) foot.style.display = '';
    const payBtn = pcoById('pco-pay-btn'); if (payBtn) payBtn.disabled = false;
  };

  /* ------------------------------------------------------------------ */
  /* Backend helpers                                                      */
  /* ------------------------------------------------------------------ */
  function pcoDoRegister(eventId, method, price, ticketType) {
    const e = (typeof DB !== 'undefined' && DB.events.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)))
      || (typeof attendeeEventCatalog !== 'undefined' && attendeeEventCatalog.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)));
    if (!e) return Promise.reject(new Error('Event not found.'));

    const attendeeId = typeof CU !== 'undefined' && (CU.userId || CU.id);
    const isWl = e.status === 'full' && e.waitlistEnabled;

    const getBackendId = e.eventId
      ? Promise.resolve(e.eventId)
      : (typeof apiGetEvents === 'function'
          ? apiGetEvents().then(evts => {
              const match = (Array.isArray(evts) ? evts : []).find(item =>
                String(item.name || item.title || '').trim().toLowerCase() === String(e.title || '').trim().toLowerCase());
              if (!match) throw new Error('Event not available in server catalog.');
              return match.eventId || match.id;
            })
          : Promise.reject(new Error('Event catalog unavailable.')));

    return getBackendId
      .then(id => apiRegisterForEvent({
        attendeeId: String(attendeeId),
        eventId:    String(id),
        ticketType: ticketType || (price === 0 ? 'free' : 'standard'),
        joinWaitlist: isWl,
      }))
      .then(regData => {
        if (price > 0 && regData.status !== 'waitlisted') {
          return apiMakePayment({
            registrationId: regData.registrationId,
            amount:         price,
            paymentMethod:  'DEMO_PROVIDER',
            paymentDate:    new Date().toISOString().split('T')[0],
          }).then(payment => {
            regData.paymentStatus  = payment.status;
            regData.verificationId = payment.registration?.verificationId;
            regData.qrCode         = payment.registration?.qrCode;
            return regData;
          });
        }
        return regData;
      })
      .then(regData => {
        if (typeof DB !== 'undefined') {
          const n        = DB._nextId.regs++;
          const ticketId = regData.ticketId || ('TKT-2026-' + String(n).padStart(3, '0'));
          const seat     = e.category === 'Conference' ? ('A-' + Math.floor(Math.random() * 200 + 1).toString().padStart(3, '0')) : 'GA';
          const isWlReg  = regData.status === 'waitlisted';
          const newReg = {
            id:             n,
            registrationId: regData.registrationId,
            attendeeId:     (typeof CU !== 'undefined') ? CU.id : attendeeId,
            eventId:        e.id,
            date:           (typeof today === 'function') ? today() : new Date().toISOString().split('T')[0],
            ticketId:       isWlReg ? '' : ticketId,
            status:         isWlReg ? 'waitlisted' : 'confirmed',
            payment:        isWlReg ? 'not_due' : (price === 0 ? 'free' : (regData.paymentStatus || 'completed')),
            amount:         isWlReg ? 0 : price,
            checkedIn:      false,
            seat:           isWlReg ? '' : seat,
            verificationId: isWlReg ? '' : (regData.verificationId || ticketId),
          };
          DB.registrations.push(newReg);
          if (typeof attendeeRegistrationCatalog !== 'undefined') {
            const catIdx = attendeeRegistrationCatalog.findIndex(r => r.registrationId === regData.registrationId);
            if (catIdx >= 0) attendeeRegistrationCatalog[catIdx] = { ...attendeeRegistrationCatalog[catIdx], ...newReg };
            else attendeeRegistrationCatalog.push(newReg);
          }
          if (!isWlReg) e.registered = Math.min((e.registered || 0) + 1, e.capacity);
          if (e.registered >= e.capacity) e.status = 'full';
          if (typeof saveDB === 'function') saveDB();
        }
        return regData;
      });
  }

  function pcoDoMakePayment(registrationId, price, method) {
    return apiMakePayment({
      registrationId,
      amount:        price,
      paymentMethod: 'DEMO_PROVIDER',
      paymentDate:   new Date().toISOString().split('T')[0],
    }).then(payment => {
      if (typeof DB !== 'undefined') {
        const reg = DB.registrations.find(r =>
          r.registrationId === registrationId || String(r.id) === String(registrationId));
        if (reg) {
          reg.payment        = payment.status || 'completed';
          reg.status         = 'confirmed';
          reg.verificationId = payment.registration?.verificationId || reg.verificationId || reg.ticketId;
        }
        if (typeof attendeeRegistrationCatalog !== 'undefined') {
          const catReg = attendeeRegistrationCatalog.find(r =>
            r.registrationId === registrationId || String(r.id) === String(registrationId));
          if (catReg) {
            catReg.payment = payment.status || 'completed';
            catReg.status = 'confirmed';
            catReg.verificationId = payment.registration?.verificationId || catReg.verificationId || catReg.ticketId;
          }
        }
        if (typeof saveDB === 'function') saveDB();
      }
      return payment;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Event Review Modal & Terms Workflow                                 */
  /* ------------------------------------------------------------------ */
  function eventReviewHTML(e) {
    const isWl   = e.status === 'full' && e.waitlistEnabled;
    const isFree = e.price === 0;
    const priceStr = isFree ? 'Free' : '\u20b9' + e.price;
    const remainingSeats = Math.max(0, (e.capacity || 100) - (e.registered || 0));
    const deadline = e.cancellationDeadline;
    const deadlineText = deadline
      ? `${deadline} (Cutoff at 23:59:59 IST)`
      : 'No cancellation deadline configured (Eligible prior to event start)';
    const refundPolicyText = isFree
      ? 'Free Event: No ticket fee was charged. Cancellations release your seat with no monetary refund due.'
      : `Eligible for a full simulated refund if cancelled on or before ${deadline || 'the event date'}. Cancellations after this deadline are strictly non-refundable per organizer policy.`;
    const postponementRulesText = 'If this event is postponed, rescheduled, or cancelled by the organizer, registered attendees will be notified promptly via email and the dashboard, and eligible simulated refunds will be credited automatically in accordance with EventFlow policy.';

    return `
<div class="pco-review-wrap" id="pco-review-wrap" style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;padding-right:4px">
  <!-- Event Overview Banner -->
  <div style="background:var(--surface2, #1e293b);border:1px solid var(--border, #334155);border-radius:10px;padding:14px;display:flex;align-items:center;gap:14px">
    <span style="font-size:36px;flex-shrink:0">${pcoEsc(e.emoji || '\u{1F3AB}')}</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
        <span class="badge badge-purple">${pcoEsc(e.category || 'Event')}</span>
        <span class="badge badge-${(e.status === 'upcoming' || e.status === 'published') ? 'blue' : e.status === 'full' ? 'yellow' : 'gray'}">${pcoEsc(e.status)}</span>
        ${isFree ? '<span class="badge badge-green">Free Admission</span>' : `<span class="badge badge-blue">\u20b9${e.price}</span>`}
      </div>
      <div style="font-weight:700;font-size:16px;line-height:1.3;color:var(--text, #fff)">${pcoEsc(e.title)}</div>
      <div class="small" style="color:var(--text2, #94a3b8);margin-top:4px">&#x1F4C5; ${pcoEsc(e.date)} &middot; ${pcoEsc(e.time || 'TBA')}</div>
      <div class="small" style="color:var(--text2, #94a3b8)">&#x1F4CD; ${pcoEsc(e.venue)}${e.city ? ', ' + pcoEsc(e.city) : ''}</div>
    </div>
  </div>

  <!-- Event Details Grid -->
  <div style="border:1px solid var(--border, #334155);border-radius:8px;padding:10px 14px;background:var(--surface2, #1e293b)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
      <div>
        <div class="label" style="font-size:11px;margin-bottom:2px;color:var(--text3, #64748b)">Attendee</div>
        <div style="font-weight:600;color:var(--text, #fff)">${pcoEsc(typeof CU !== 'undefined' ? CU.name : 'Attendee')}</div>
        <div class="small" style="color:var(--text3, #64748b)">${pcoEsc(typeof CU !== 'undefined' ? CU.email : '')}</div>
      </div>
      <div>
        <div class="label" style="font-size:11px;margin-bottom:2px;color:var(--text3, #64748b)">Availability & Capacity</div>
        <div style="font-weight:600;color:${isWl ? 'var(--yellow, #eab308)' : 'var(--green, #22c55e)'}">
          ${isWl ? 'Waitlist Only (Capacity Full)' : `${remainingSeats} seats available`}
        </div>
        <div class="small" style="color:var(--text3, #64748b)">Total capacity: ${e.capacity || 100} attendees</div>
      </div>
    </div>
    ${e.description ? `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border, #334155)">
        <div class="label" style="font-size:11px;margin-bottom:2px;color:var(--text3, #64748b)">About This Event</div>
        <div style="font-size:12.5px;color:var(--text2, #94a3b8);line-height:1.5">${pcoEsc(e.description)}</div>
      </div>
    ` : ''}
  </div>

  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <button type="button" class="btn btn-ghost" onclick="openEventPolicies('${pcoEsc(e.eventId || e.id)}')">&#x1F4CB; Event Policies &amp; Rules</button>
    <button type="button" class="btn btn-ghost" onclick="openTermsConditions('${pcoEsc(e.eventId || e.id)}')">&#x1F4C4; Terms and Conditions</button>
  </div>

  <!-- Required Agreement Checkbox -->
  <div style="background:var(--surface3, #0f172a);border:1px solid var(--border, #334155);border-radius:8px;padding:12px;display:flex;align-items:flex-start;gap:10px">
    <input type="checkbox" id="pco-terms-check" style="width:18px;height:18px;margin-top:2px;cursor:pointer;accent-color:var(--accent, #38bdf8)" onchange="pcoToggleTerms(this.checked)">
    <label for="pco-terms-check" style="font-size:13px;line-height:1.4;cursor:pointer;color:var(--text, #fff);font-weight:500">
      I have reviewed the event details and agree to the <strong>Terms & Conditions</strong>, <strong>Cancellation Policy</strong>, and <strong>Event Rules</strong>.
    </label>
  </div>
</div>`;
  }

  window.pcoToggleTerms = function (checked) {
    const btn = pcoById('pco-review-proceed-btn');
    if (btn) {
      btn.disabled = !checked;
      btn.style.opacity = checked ? '1' : '0.5';
      btn.style.cursor = checked ? 'pointer' : 'not-allowed';
    }
  };

  function openEventReviewModal(eventId) {
    const e = (typeof DB !== 'undefined' && DB.events.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)))
      || (typeof attendeeEventCatalog !== 'undefined' && attendeeEventCatalog.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)));
    if (!e) { if (typeof toast === 'function') toast('Event not found', 'error'); return; }

    // Revalidate event availability
    if (e.status === 'cancelled') {
      if (typeof toast === 'function') toast('This event has been cancelled and is no longer accepting registrations.', 'error');
      return;
    }
    if (e.status === 'completed' || (e.date && new Date(`${e.date}T23:59:59`) < new Date())) {
      if (typeof toast === 'function') toast('This event has already concluded.', 'error');
      return;
    }
    if (e.status === 'full' && !e.waitlistEnabled) {
      if (typeof toast === 'function') toast('Sorry, this event is full and the waitlist is closed.', 'error');
      return;
    }

    // Duplicate registration check
    const existing = (typeof attendeeRegistrationCatalog !== 'undefined'
        && attendeeRegistrationCatalog.find(r => r.status !== 'cancelled' && (String(r.eventId) === String(eventId) || String(r.eventId) === String(e.id) || String(r.eventId) === String(e.eventId))))
      || (typeof DB !== 'undefined'
          && DB.registrations.find(r =>
            r.status !== 'cancelled'
            && String(r.attendeeId) === String(typeof CU !== 'undefined' ? CU.id : '')
            && (String(r.eventId) === String(eventId) || String(r.eventId) === String(e.id) || String(r.eventId) === String(e.eventId))));
    if (existing) {
      if (typeof toast === 'function') toast('You already have an active registration for this event.', 'info');
      if (typeof openViewTicketModal === 'function') openViewTicketModal(existing.id || existing.registrationId);
      return;
    }

    const isWl   = e.status === 'full' && e.waitlistEnabled;
    const isFree = e.price === 0;
    const proceedLabel = isWl ? 'Join Waitlist' : (isFree ? 'Confirm Free Registration' : 'Proceed to Payment');
    const proceedClass = isWl ? 'btn-warning' : (isFree ? 'btn-success' : 'btn-primary');

    if (typeof openModal === 'function') {
      openModal(`Review Event \u2014 ${e.title}`, eventReviewHTML(e), [
        {
          lbl: proceedLabel,
          cls: proceedClass,
          fn: `pcoProceedFromReview('${eventId}')`
        }
      ], true);

      setTimeout(() => {
        const btn = document.getElementById('modal-foot')?.querySelector('.btn-primary, .btn-success, .btn-warning');
        if (btn) {
          btn.id = 'pco-review-proceed-btn';
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
        }
      }, 20);
    }
  }
  window.openEventReviewModal = openEventReviewModal;

  window.pcoProceedFromReview = function (eventId) {
    const chk = pcoById('pco-terms-check');
    if (!chk || !chk.checked) {
      if (typeof toast === 'function') toast('Please accept the Terms & Conditions to proceed.', 'warning');
      return;
    }

    const e = (typeof DB !== 'undefined' && DB.events.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)))
      || (typeof attendeeEventCatalog !== 'undefined' && attendeeEventCatalog.find(ev => String(ev.id) === String(eventId) || String(ev.eventId) === String(eventId)));
    if (!e) { if (typeof toast === 'function') toast('Event not found', 'error'); return; }

    // Revalidate event availability, capacity, and registration eligibility
    if (e.status === 'cancelled') {
      if (typeof toast === 'function') toast('This event has been cancelled and is no longer accepting registrations.', 'error');
      if (typeof closeModal === 'function') closeModal();
      return;
    }
    if (e.status === 'completed' || (e.date && new Date(`${e.date}T23:59:59`) < new Date())) {
      if (typeof toast === 'function') toast('This event has already concluded.', 'error');
      if (typeof closeModal === 'function') closeModal();
      return;
    }
    if (e.status === 'full' && !e.waitlistEnabled) {
      if (typeof toast === 'function') toast('Sorry, this event is full and the waitlist is closed.', 'error');
      if (typeof closeModal === 'function') closeModal();
      return;
    }

    const existing = (typeof attendeeRegistrationCatalog !== 'undefined'
        && attendeeRegistrationCatalog.find(r => r.status !== 'cancelled' && (String(r.eventId) === String(eventId) || String(r.eventId) === String(e.id) || String(r.eventId) === String(e.eventId))))
      || (typeof DB !== 'undefined'
          && DB.registrations.find(r =>
            r.status !== 'cancelled'
            && String(r.attendeeId) === String(typeof CU !== 'undefined' ? CU.id : '')
            && (String(r.eventId) === String(eventId) || String(r.eventId) === String(e.id) || String(r.eventId) === String(e.eventId))));
    if (existing) {
      if (typeof toast === 'function') toast('You already have an active registration for this event.', 'warning');
      if (typeof closeModal === 'function') closeModal();
      if (typeof openViewTicketModal === 'function') openViewTicketModal(existing.id || existing.registrationId);
      return;
    }

    const isWl   = e.status === 'full' && e.waitlistEnabled;
    const isFree = e.price === 0;

    // For Free Events: skip payment after acceptance and validation
    if (isFree && !isWl) {
      const btn = pcoById('pco-review-proceed-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Confirming Registration\u2026'; }
      pcoDoRegister(eventId, null, 0, 'free')
        .then(() => {
          if (typeof closeModal === 'function') closeModal();
          if (typeof toast === 'function') toast('🎉 Registration confirmed! Check your tickets.', 'success');
          if (typeof goNav === 'function') goNav('my-tickets');
        })
        .catch(err => {
          if (btn) { btn.disabled = false; btn.textContent = 'Confirm Free Registration'; }
          if (typeof toast === 'function') toast(err.message || 'Registration could not be completed.', 'error');
        });
      return;
    }

    // For Waitlisted Events: no payment required
    if (isWl) {
      const btn = pcoById('pco-review-proceed-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Joining Waitlist\u2026'; }
      pcoDoRegister(eventId, null, 0, 'standard')
        .then(regData => {
          if (typeof closeModal === 'function') closeModal();
          if (typeof toast === 'function') toast(`Joined waitlist${regData?.waitlistPosition ? ` at position ${regData.waitlistPosition}` : ''}.`, 'success');
          if (typeof goNav === 'function') goNav('my-tickets');
        })
        .catch(err => {
          if (btn) { btn.disabled = false; btn.textContent = 'Join Waitlist'; }
          if (typeof toast === 'function') toast(err.message || 'Could not join waitlist.', 'error');
        });
      return;
    }

    // For Paid Events: open existing payment page with correct event ID and amount!
    openExistingPaymentModal(e);
  };

  function openExistingPaymentModal(e, regId) {
    const isWl   = e.status === 'full' && e.waitlistEnabled;
    const isFree = e.price === 0;
    const mTitle = 'Checkout \u2014 ' + e.title;
    if (typeof openModal === 'function') openModal(mTitle, checkoutHTML(e, isFree ? 0 : e.price), [], true);

    requestAnimationFrame(() => {
      const wrap = pcoById('pco-wrap'); if (!wrap) return;
      wrap.dataset.pcoEventId = String(e.id);
      wrap.dataset.pcoTitle   = e.title || '';
      wrap.dataset.pcoPrice   = String(e.price || 0);
      wrap.dataset.pcoFree    = isFree ? '1' : '0';
      if (regId) wrap.dataset.pcoRegId = String(regId);
      wrap.dataset.pcoMethod  = 'card';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Patch runtime functions                                              */
  /* ------------------------------------------------------------------ */
  function newRegForEvent(eventId) {
    openEventReviewModal(eventId);
  }

  function newCompleteDemoPayment(registrationId) {
    const reg   = typeof attendeeRegistrationCatalog !== 'undefined'
      && attendeeRegistrationCatalog.find(r => r.registrationId === registrationId);
    const event = reg && typeof DB !== 'undefined' && DB.events.find(e => String(e.id) === String(reg.eventId));
    if (!reg || !event) {
      if (typeof toast === 'function') toast('Registration details are unavailable.', 'error'); return;
    }
    openExistingPaymentModal(event, registrationId);
  }

  function patchRuntime() {
    if (typeof regForEvent !== 'undefined')         window.regForEvent         = newRegForEvent;
    if (typeof completeDemoPayment !== 'undefined') window.completeDemoPayment = newCompleteDemoPayment;
  }

  patchRuntime();
  document.addEventListener('DOMContentLoaded', patchRuntime, { once: true });
})();

/* ========================================================================
   Attendee dashboard implementation is managed in runtime.js
   ======================================================================== */

