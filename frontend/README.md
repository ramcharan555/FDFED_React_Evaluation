# EventFlow Frontend

## Run

```sh
npm install
npm run dev
```

Build with `npm run build` and run the existing QR verification tests with `npm test`.

The Vite entry is `index.html`. Routes are `/`, `/landing`, `/admin`, `/attendee`, `/client`, `/employee1`, `/employee2`, `/employee3`, `/organizer`, and `/staff`. Opening or refreshing a role route restores the session from `ef_cu`, and unauthenticated access returns to `/landing`.

Static page markup is in `src/apps/<role>/*.jsx`, with the corresponding preserved CSS in each role folder. Shared theme CSS is in `src/styles`; the QR scanner and theme scripts are in `src/services`. Images and vendor QR libraries are in `public`.

The role dashboards still run their original DOM-driven JavaScript from `src/apps/<role>/runtime.js` through `LegacyRuntime`. This preserves current workflows and backend requests during the remaining conversion of dynamic screens to React state and components.
