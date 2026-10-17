# Ticket QR libraries

- `jsQR-1.4.0.js`: local QR decoder from `https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js`. License: `jsQR-LICENSE.txt`.
- `qrcode-1.5.4.js`: browser bundle of the existing backend `qrcode@1.5.4` core, built with the installed webpack dependency. License: `qrcode-LICENSE.txt`.

Both libraries run locally; camera frames and ticket QR contents stay in the browser. The scanner reads a QR into the ticket input. The existing Verify action checks the selected event and prevents duplicate check-ins.

To rebuild the encoder, run webpack with `backend/node_modules/qrcode/lib/core/qrcode.js` as its entry, target `web`, production mode, and an output library named `EventFlowQR` with type `window`. Write the bundle to this directory as `qrcode-1.5.4.js`.
