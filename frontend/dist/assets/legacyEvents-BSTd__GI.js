import{r as a}from"./index-CKr6dLLk.js";const s=`(() => {\r
  const storageKey = 'eventflow-theme';\r
  const root = document.documentElement;\r
\r
  function setTheme(theme) {\r
    root.dataset.theme = theme;\r
  }\r
\r
  try {\r
    const savedTheme = localStorage.getItem(storageKey);\r
    if (savedTheme === 'light' || savedTheme === 'dark') {\r
      setTheme(savedTheme);\r
    }\r
  } catch (error) {\r
    console.warn('EventFlow could not read the saved color theme.', error);\r
  }\r
\r
  function addThemeToggle() {\r
    if (!['/', '/landing'].includes(window.location.pathname)) return;\r
\r
    const button = document.createElement('button');\r
    const isLight = root.dataset.theme === 'light';\r
    button.className = 'theme-toggle';\r
    button.type = 'button';\r
    button.setAttribute('aria-pressed', String(isLight));\r
    button.setAttribute('aria-label', \`Switch to \${isLight ? 'dark' : 'light'} mode\`);\r
    button.title = \`Switch to \${isLight ? 'dark' : 'light'} mode\`;\r
    button.innerHTML = \`\r
      <svg class="theme-icon-dark" viewBox="0 0 24 24" aria-hidden="true">\r
        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"></path>\r
      </svg>\r
      <svg class="theme-icon-light" viewBox="0 0 24 24" aria-hidden="true">\r
        <circle cx="12" cy="12" r="4"></circle>\r
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>\r
      </svg>\`;\r
    button.addEventListener('click', () => {\r
      const theme = root.dataset.theme === 'light' ? 'dark' : 'light';\r
      setTheme(theme);\r
      const light = theme === 'light';\r
      button.setAttribute('aria-pressed', String(light));\r
      button.setAttribute('aria-label', \`Switch to \${light ? 'dark' : 'light'} mode\`);\r
      button.title = \`Switch to \${light ? 'dark' : 'light'} mode\`;\r
\r
      try {\r
        localStorage.setItem(storageKey, theme);\r
      } catch (error) {\r
        console.warn('EventFlow could not save the selected color theme.', error);\r
      }\r
    });\r
\r
    document.body.prepend(button);\r
\r
    const app = document.getElementById('app');\r
    const dashboardControls = app?.querySelector('.topbar-right');\r
    if (app && dashboardControls) {\r
      const placeThemeToggle = () => {\r
        const container = app.style.display === 'block' ? dashboardControls : document.body;\r
        if (button.parentElement !== container) container.prepend(button);\r
      };\r
      const observer = new MutationObserver(placeThemeToggle);\r
      observer.observe(app, { attributes: true, attributeFilter: ['style'] });\r
      placeThemeToggle();\r
    }\r
  }\r
\r
  function addPasswordToggle(input) {\r
    if (input.type !== 'password' || input.closest('.password-field')) return;\r
\r
    const wrapper = document.createElement('div');\r
    wrapper.className = 'password-field';\r
    input.parentNode.insertBefore(wrapper, input);\r
    wrapper.appendChild(input);\r
\r
    const button = document.createElement('button');\r
    button.className = 'password-toggle';\r
    button.type = 'button';\r
    button.setAttribute('aria-label', 'Show password');\r
    button.setAttribute('aria-pressed', 'false');\r
    button.innerHTML = \`\r
      <svg class="eye-on" viewBox="0 0 24 24" aria-hidden="true">\r
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>\r
        <circle cx="12" cy="12" r="3"></circle>\r
      </svg>\r
      <svg class="eye-off" viewBox="0 0 24 24" aria-hidden="true">\r
        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>\r
        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a14.8 14.8 0 0 1-3 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10.8 10.8 0 0 0 3.1-.5"></path>\r
      </svg>\`;\r
    button.addEventListener('click', () => {\r
      const visible = input.type === 'password';\r
      input.type = visible ? 'text' : 'password';\r
      button.setAttribute('aria-pressed', String(visible));\r
      button.setAttribute('aria-label', \`\${visible ? 'Hide' : 'Show'} password\`);\r
    });\r
    wrapper.appendChild(button);\r
  }\r
\r
  function prepareFormField(field) {\r
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;\r
    if (\r
      field instanceof HTMLInputElement\r
      && (field.type === 'search' || /^([a-z0-9]+-)?q$/i.test(field.id) || /search/i.test(\`\${field.id} \${field.placeholder}\`))\r
    ) return;\r
\r
    const label = field.closest('.form-group')?.querySelector('label')?.textContent?.trim()\r
      || field.labels?.[0]?.textContent?.trim()\r
      || '';\r
    const details = \`\${label} \${field.id} \${field.name} \${field.placeholder}\`.toLowerCase();\r
\r
    if (\r
      label.includes('*')\r
      || field.hasAttribute('required')\r
      || ['l-email', 'l-pass'].includes(field.id)\r
    ) field.required = true;\r
\r
    if (field instanceof HTMLSelectElement && field.options.length) {\r
      const first = field.options[0];\r
      if (!first.hasAttribute('value') && /^select\\b/i.test(first.textContent.trim())) first.value = '';\r
    }\r
\r
    if (field instanceof HTMLInputElement) {\r
      if (field.type === 'text' && /\\b(email|e-mail)\\b/.test(details)) field.type = 'email';\r
      if (field.type === 'text' && /\\b(url|website|web site)\\b/.test(details)) field.type = 'url';\r
      if (field.type === 'text' && /\\b(phone|mobile|telephone|emergency contact)\\b/.test(details)) field.type = 'tel';\r
      if (field.type === 'tel') {\r
        field.maxLength = 10;\r
        field.pattern = '[0-9]{10}';\r
        field.inputMode = 'numeric';\r
      }\r
      if (field.type === 'text' && /\\b(price|budget|amount|fee|cost|capacity|quantity|guests?|age|years? of experience)\\b/.test(label.toLowerCase())) {\r
        field.type = 'number';\r
      }\r
      if (field.type === 'text' && /\\b(date|date of birth)\\b/.test(label.toLowerCase())) field.type = 'date';\r
      if (field.type === 'password' && field.minLength < 6) {\r
        field.minLength = 6;\r
      }\r
\r
      if (field.type === 'number') {\r
        const positiveCount = /\\b(capacity|quantity|guests?)\\b/.test(details);\r
        if (field.min === '' || Number(field.min) < 0) field.min = positiveCount ? '1' : '0';\r
        if (field.step === '') field.step = /\\b(years? of experience|age|capacity|quantity|guests?)\\b/.test(details) ? '1' : 'any';\r
      }\r
\r
    }\r
\r
    const validate = () => {\r
      const value = field.value;\r
      let message = '';\r
      if (field.required && !value.trim()) {\r
        message = 'Please fill out this field.';\r
      } else if (field instanceof HTMLInputElement && field.type === 'tel' && value) {\r
        if (!/^\\d{10}$/.test(value)) {\r
          message = 'Enter a mobile number with exactly 10 digits.';\r
        }\r
      } else if (field instanceof HTMLInputElement && field.type === 'date' && value && Number.isNaN(Date.parse(value))) {\r
        message = 'Enter a valid date.';\r
      } else if (field instanceof HTMLInputElement && field.type === 'password' && value.length < field.minLength) {\r
        message = \`Password must be at least \${field.minLength} characters.\`;\r
      } else if (\r
        field instanceof HTMLInputElement\r
        && /^(full name|your name|name|first name|last name|city|city\\s*\\/\\s*location)$/i.test(label.replace(/\\*/g, '').trim())\r
        && value\r
      ) {\r
        if (!/^[\\p{L}\\p{M} .,'’()-]+$/u.test(value.trim())) {\r
          message = 'Use letters and normal name or city characters only.';\r
        }\r
      } else if (field instanceof HTMLInputElement && field.type === 'email' && value && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {\r
        message = 'Enter a valid email address.';\r
      } else if (field instanceof HTMLInputElement && field.type === 'url' && value) {\r
        try {\r
          const parsedUrl = new URL(value);\r
          if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname.includes('.')) {\r
            message = 'Enter a valid URL.';\r
          }\r
        } catch (error) {\r
          message = 'Enter a valid URL.';\r
        }\r
      } else if (field instanceof HTMLInputElement && /\\b(card number)\\b/.test(details) && value) {\r
        const digits = value.replace(/\\D/g, '');\r
        if (!/^[0-9 ]+$/.test(value) || digits.length < 13 || digits.length > 19) {\r
          message = 'Enter a valid card number using 13 to 19 digits.';\r
        }\r
      } else if (field instanceof HTMLInputElement && /\\b(expiry)\\b/.test(label) && value) {\r
        const match = /^(0[1-9]|1[0-2])\\/(\\d{2})$/.exec(value);\r
        if (!match) {\r
          message = 'Enter an expiry date in MM/YY format.';\r
        } else {\r
          const expiry = new Date(2000 + Number(match[2]), Number(match[1]), 1);\r
          const currentMonth = new Date();\r
          currentMonth.setDate(1);\r
          currentMonth.setHours(0, 0, 0, 0);\r
          if (expiry <= currentMonth) message = 'Card expiry date must be in the future.';\r
        }\r
      } else if (field instanceof HTMLInputElement && /\\botp\\b/.test(details) && value && !/^\\d{6}$/.test(value)) {\r
        message = 'Enter the 6-digit verification code.';\r
      } else if (field instanceof HTMLInputElement && field.type === 'number' && value) {\r
        const positiveCount = /\\b(capacity|quantity|guests?)\\b/.test(details);\r
        if (!Number.isFinite(Number(value)) || Number(value) < (positiveCount ? 1 : 0)) {\r
          message = positiveCount ? 'Enter a number greater than 0.' : 'Enter a non-negative number.';\r
        }\r
      }\r
      field.setCustomValidity(message);\r
    };\r
\r
    if (!field.dataset.validationReady) {\r
      field.addEventListener('input', () => {\r
        if (field instanceof HTMLInputElement && field.type === 'tel') {\r
          field.value = field.value.replace(/\\D/g, '').slice(0, 10);\r
        }\r
        validate();\r
      });\r
      field.addEventListener('change', validate);\r
      field.dataset.validationReady = 'true';\r
    }\r
    validate();\r
  }\r
\r
  function initializeFormValidation() {\r
    const prepareTree = (node) => {\r
      if (!(node instanceof Element)) return;\r
      if (node.matches('input, select, textarea')) prepareFormField(node);\r
      node.querySelectorAll('input, select, textarea').forEach(prepareFormField);\r
    };\r
\r
    prepareTree(document.body);\r
    const observer = new MutationObserver((records) => {\r
      records.forEach((record) => record.addedNodes.forEach(prepareTree));\r
    });\r
    observer.observe(document.body, { childList: true, subtree: true });\r
\r
    document.addEventListener('click', (event) => {\r
      const button = event.target instanceof Element ? event.target.closest('button') : null;\r
      if (!button) return;\r
\r
      let fields;\r
      if (button.closest('#modal-foot')) {\r
        if (button.textContent.trim().toLowerCase() === 'cancel') return;\r
        fields = [...document.querySelectorAll('#modal-body input, #modal-body select, #modal-body textarea')];\r
      } else if (button.matches('[onclick*="doLogin"]')) {\r
        fields = [\r
          document.getElementById('l-email'),\r
          document.getElementById('l-pass'),\r
        ].filter(Boolean);\r
      } else {\r
        return;\r
      }\r
\r
      fields.forEach(prepareFormField);\r
      const invalid = fields.find((field) => !field.checkValidity());\r
      if (invalid) {\r
        event.preventDefault();\r
        event.stopImmediatePropagation();\r
        invalid.reportValidity();\r
      }\r
    }, true);\r
\r
    document.addEventListener('submit', (event) => {\r
      const fields = [...event.target.querySelectorAll('input, select, textarea')];\r
      fields.forEach(prepareFormField);\r
      const invalid = fields.find((field) => !field.checkValidity());\r
      if (invalid) {\r
        event.preventDefault();\r
        invalid.reportValidity();\r
      }\r
    }, true);\r
\r
    document.addEventListener('keydown', (event) => {\r
      if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;\r
      const id = event.target.id;\r
      if (!['l-email', 'l-pass'].includes(id)) return;\r
\r
      const fields = [\r
        document.getElementById('l-email'),\r
        document.getElementById('l-pass'),\r
      ].filter(Boolean);\r
      fields.forEach(prepareFormField);\r
      const invalid = fields.find((field) => !field.checkValidity());\r
      if (invalid) {\r
        event.preventDefault();\r
        event.stopImmediatePropagation();\r
        invalid.reportValidity();\r
      }\r
    }, true);\r
  }\r
\r
  function initializePasswordToggles() {\r
    const prepareTree = (node) => {\r
      if (!(node instanceof Element)) return;\r
      if (node.matches('input[type="password"]')) addPasswordToggle(node);\r
      node.querySelectorAll('input[type="password"]').forEach(addPasswordToggle);\r
    };\r
    prepareTree(document.body);\r
\r
    const observer = new MutationObserver((records) => {\r
      records.forEach((record) => record.addedNodes.forEach(prepareTree));\r
    });\r
    observer.observe(document.body, { childList: true, subtree: true });\r
  }\r
\r
  if (document.readyState === 'loading') {\r
    document.addEventListener('DOMContentLoaded', () => {\r
      addThemeToggle();\r
      initializePasswordToggles();\r
      initializeFormValidation();\r
    }, { once: true });\r
  } else {\r
    addThemeToggle();\r
    initializePasswordToggles();\r
    initializeFormValidation();\r
  }\r
})();\r
`,o=`(function () {\r
  'use strict';\r
\r
  let session = null;\r
  const get = id => document.getElementById(id);\r
\r
  function setStatus(message) {\r
    const status = get('ticket-scan-status');\r
    if (status) {\r
      status.textContent = message;\r
      status.hidden = !message;\r
    }\r
  }\r
\r
  function stopTicketScan(message = '') {\r
    const previous = session;\r
    session = null;\r
    if (previous) {\r
      cancelAnimationFrame(previous.frame);\r
      previous.stream?.getTracks().forEach(track => track.stop());\r
      previous.video.srcObject = null;\r
    }\r
    const preview = get('ticket-camera');\r
    const start = get('ticket-scan-start');\r
    const stop = get('ticket-scan-stop');\r
    if (preview) preview.hidden = true;\r
    if (start) start.hidden = false;\r
    if (stop) stop.hidden = true;\r
    setStatus(message);\r
  }\r
\r
  async function startTicketScan() {\r
    if (session) return;\r
    const preview = get('ticket-camera');\r
    const video = get('ticket-camera-video');\r
    const input = get('qr-input');\r
    if (!preview || !video || !input) return;\r
    if (!navigator.mediaDevices?.getUserMedia) {\r
      setStatus('Open this page on localhost or HTTPS to use the camera.');\r
      return;\r
    }\r
    if (typeof window.jsQR !== 'function') {\r
      setStatus('Scanner unavailable. Enter the ticket ID below.');\r
      return;\r
    }\r
\r
    const current = { video, input, stream: null, frame: 0, lastScan: 0 };\r
    session = current;\r
    preview.hidden = false;\r
    get('ticket-scan-start').hidden = true;\r
    get('ticket-scan-stop').hidden = false;\r
    setStatus('Allow camera access to scan a ticket.');\r
\r
    try {\r
      const stream = await navigator.mediaDevices.getUserMedia({\r
        audio: false,\r
        video: { facingMode: { ideal: 'environment' } }\r
      });\r
      if (session !== current || !video.isConnected) {\r
        stream.getTracks().forEach(track => track.stop());\r
        return;\r
      }\r
      current.stream = stream;\r
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {\r
        if (session === current) stopTicketScan('Camera stopped.');\r
      }));\r
      video.srcObject = stream;\r
      await video.play();\r
      if (session !== current) return;\r
      setStatus('Point the camera at the ticket QR code.');\r
\r
      const canvas = document.createElement('canvas');\r
      const context = canvas.getContext('2d', { willReadFrequently: true });\r
      if (!context) throw new Error('Camera preview unavailable');\r
\r
      function scanFrame(timestamp) {\r
        if (session !== current) return;\r
        if (!video.isConnected || get('qr-input') !== input) {\r
          stopTicketScan();\r
          return;\r
        }\r
        if (video.readyState >= 2 && video.videoWidth && timestamp - current.lastScan >= 150) {\r
          current.lastScan = timestamp;\r
          canvas.width = Math.min(video.videoWidth, 640);\r
          canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);\r
          try {\r
            context.drawImage(video, 0, 0, canvas.width, canvas.height);\r
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);\r
            const result = window.jsQR(pixels.data, pixels.width, pixels.height);\r
            if (result?.data.trim()) {\r
              input.value = result.data.trim();\r
              stopTicketScan('Ticket scanned. Press Verify.');\r
              window.handleQRInput(input.value);\r
              input.focus();\r
              return;\r
            }\r
          } catch (error) {\r
            stopTicketScan('Could not read the camera. Enter the ticket ID below.');\r
            return;\r
          }\r
        }\r
        current.frame = requestAnimationFrame(scanFrame);\r
      }\r
      current.frame = requestAnimationFrame(scanFrame);\r
    } catch (error) {\r
      if (session !== current) return;\r
      const message = error.name === 'NotAllowedError'\r
        ? 'Camera access denied. Allow access or enter a ticket ID.'\r
        : error.name === 'NotFoundError'\r
          ? 'No camera found. Enter the ticket ID below.'\r
          : 'Camera unavailable. Enter the ticket ID below.';\r
      stopTicketScan(message);\r
    }\r
  }\r
\r
  function renderTicketQRCode(value) {\r
    if (!value || !window.EventFlowQR) return '';\r
    const { modules } = window.EventFlowQR.create(String(value), { errorCorrectionLevel: 'M' });\r
    const size = modules.size;\r
    const viewSize = size + 8;\r
    let path = '';\r
    for (let y = 0; y < size; y++) {\r
      for (let x = 0; x < size; x++) {\r
        if (modules.get(y, x)) path += \`M\${x + 4} \${y + 4}h1v1h-1z\`;\r
      }\r
    }\r
    return \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \${viewSize} \${viewSize}" role="img" aria-label="Ticket QR code" shape-rendering="crispEdges"><rect width="\${viewSize}" height="\${viewSize}" fill="#fff"/><path d="\${path}" fill="#000"/></svg>\`;\r
  }\r
\r
  window.startTicketScan = startTicketScan;\r
  window.stopTicketScan = stopTicketScan;\r
  window.renderTicketQRCode = renderTicketQRCode;\r
\r
  new MutationObserver(() => {\r
    if (session && (!session.video.isConnected || get('qr-input') !== session.input)) stopTicketScan();\r
  }).observe(document.body, { childList: true, subtree: true });\r
  const app = get('app');\r
  if (app) new MutationObserver(() => {\r
    if (session && app.style.display === 'none') stopTicketScan();\r
  }).observe(app, { attributes: true, attributeFilter: ['style'] });\r
  document.addEventListener('visibilitychange', () => {\r
    if (document.hidden && session) stopTicketScan();\r
  });\r
  window.addEventListener('pagehide', () => stopTicketScan());\r
})();\r
`;function n(t){const e=document.createElement("script");return e.textContent=t,document.body.appendChild(e),e}function d({source:t,role:e}){return a.useEffect(()=>{document.body.dataset.eventflowRole=e;const r=[n(s),n(o),n(t)];return document.dispatchEvent(new Event("DOMContentLoaded")),()=>r.forEach(i=>i.remove())},[t,e]),null}function c(t,e){return Function("event",t).call(e.currentTarget,e.nativeEvent||e)}export{d as L,c as l};
