(function () {
  'use strict';

  let session = null;
  const get = id => document.getElementById(id);

  function setStatus(message) {
    const status = get('ticket-scan-status');
    if (status) {
      status.textContent = message;
      status.hidden = !message;
    }
  }

  function stopTicketScan(message = '') {
    const previous = session;
    session = null;
    if (previous) {
      cancelAnimationFrame(previous.frame);
      previous.stream?.getTracks().forEach(track => track.stop());
      previous.video.srcObject = null;
    }
    const preview = get('ticket-camera');
    const start = get('ticket-scan-start');
    const stop = get('ticket-scan-stop');
    if (preview) preview.hidden = true;
    if (start) start.hidden = false;
    if (stop) stop.hidden = true;
    setStatus(message);
  }

  async function startTicketScan() {
    if (session) return;
    const preview = get('ticket-camera');
    const video = get('ticket-camera-video');
    const input = get('qr-input');
    if (!preview || !video || !input) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Open this page on localhost or HTTPS to use the camera.');
      return;
    }
    if (typeof window.jsQR !== 'function') {
      setStatus('Scanner unavailable. Enter the ticket ID below.');
      return;
    }

    const current = { video, input, stream: null, frame: 0, lastScan: 0 };
    session = current;
    preview.hidden = false;
    get('ticket-scan-start').hidden = true;
    get('ticket-scan-stop').hidden = false;
    setStatus('Allow camera access to scan a ticket.');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
      if (session !== current || !video.isConnected) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      current.stream = stream;
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (session === current) stopTicketScan('Camera stopped.');
      }));
      video.srcObject = stream;
      await video.play();
      if (session !== current) return;
      setStatus('Point the camera at the ticket QR code.');

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Camera preview unavailable');

      function scanFrame(timestamp) {
        if (session !== current) return;
        if (!video.isConnected || get('qr-input') !== input) {
          stopTicketScan();
          return;
        }
        if (video.readyState >= 2 && video.videoWidth && timestamp - current.lastScan >= 150) {
          current.lastScan = timestamp;
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);
          try {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = window.jsQR(pixels.data, pixels.width, pixels.height);
            if (result?.data.trim()) {
              input.value = result.data.trim();
              stopTicketScan('Ticket scanned. Press Verify.');
              window.handleQRInput(input.value);
              input.focus();
              return;
            }
          } catch (error) {
            stopTicketScan('Could not read the camera. Enter the ticket ID below.');
            return;
          }
        }
        current.frame = requestAnimationFrame(scanFrame);
      }
      current.frame = requestAnimationFrame(scanFrame);
    } catch (error) {
      if (session !== current) return;
      const message = error.name === 'NotAllowedError'
        ? 'Camera access denied. Allow access or enter a ticket ID.'
        : error.name === 'NotFoundError'
          ? 'No camera found. Enter the ticket ID below.'
          : 'Camera unavailable. Enter the ticket ID below.';
      stopTicketScan(message);
    }
  }

  function renderTicketQRCode(value) {
    if (!value || !window.EventFlowQR) return '';
    const { modules } = window.EventFlowQR.create(String(value), { errorCorrectionLevel: 'M' });
    const size = modules.size;
    const viewSize = size + 8;
    let path = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (modules.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" role="img" aria-label="Ticket QR code" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  }

  window.startTicketScan = startTicketScan;
  window.stopTicketScan = stopTicketScan;
  window.renderTicketQRCode = renderTicketQRCode;

  new MutationObserver(() => {
    if (session && (!session.video.isConnected || get('qr-input') !== session.input)) stopTicketScan();
  }).observe(document.body, { childList: true, subtree: true });
  const app = get('app');
  if (app) new MutationObserver(() => {
    if (session && app.style.display === 'none') stopTicketScan();
  }).observe(app, { attributes: true, attributeFilter: ['style'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && session) stopTicketScan();
  });
  window.addEventListener('pagehide', () => stopTicketScan());
})();
