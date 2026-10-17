// The existing runtime expects global functions and expressions from HTML handlers.
// JSX attaches the same handlers through React until those screens are migrated.
export function legacyEvent(code, event) {
  return Function('event', code).call(event.currentTarget, event.nativeEvent || event);
}
