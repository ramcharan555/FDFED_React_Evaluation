import{j as e}from"./index-CKr6dLLk.js";import{l as t,L as r}from"./legacyEvents-BSTd__GI.js";const s=`/* ===== EventFlow source: api.js ===== */\r
// ═══════════════════════════════════════════════════════════════\r
// CENTRAL API UTILITY — EventFlow Backend Integration\r
// All backend calls are routed through this file.\r
// Backend: http://localhost:3001/api\r
// ═══════════════════════════════════════════════════════════════\r
\r
const API_BASE_URL = 'http://localhost:3001/api';\r
const SESSION_KEY = 'ef_cu';\r
\r
// ─── Role Normalisation ─────────────────────────────────────────\r
// Maps frontend role strings → backend x-role header values\r
const ROLE_MAP = {\r
  superuser:       'super_admin',\r
  super_admin:     'super_admin',\r
  'super-user':    'super_admin',\r
  admin:           'super_admin',\r
  organizer:       'event_organizer',\r
  event_organizer: 'event_organizer',\r
  'event-organizer': 'event_organizer',\r
  client:          'client',\r
  staff:           'event_staff',\r
  event_staff:     'event_staff',\r
  'event-staff':   'event_staff',\r
  attendee:        'attendee',\r
};\r
\r
function normalizeRole(role) {\r
  return ROLE_MAP[(role || '').toLowerCase()] || (role || '').toLowerCase();\r
}\r
\r
// ─── Session Helpers ─────────────────────────────────────────────\r
function getCurrentUser() {\r
  try {\r
    const s = sessionStorage.getItem(SESSION_KEY);\r
    return s ? JSON.parse(s) : null;\r
  } catch (e) { return null; }\r
}\r
\r
function setCurrentUser(user) {\r
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) {}\r
}\r
\r
function clearCurrentUser() {\r
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}\r
}\r
\r
// ─── Header Helpers ──────────────────────────────────────────────\r
function getRoleHeader() {\r
  const u = getCurrentUser();\r
  return u ? normalizeRole(u.role || u.userRole || '') : '';\r
}\r
\r
function getUserIdHeader() {\r
  const u = getCurrentUser();\r
  return u ? (u.userId || u.id || '') : '';\r
}\r
\r
function getAuthHeader() {\r
  const u = getCurrentUser();\r
  return u && u.token ? \`Bearer \${u.token}\` : '';\r
}\r
\r
// ─── Core Fetch Wrapper ──────────────────────────────────────────\r
// Authorization is handled entirely by JWT Bearer tokens.\r
// No client-controlled identity headers (x-role, x-user-id) are sent.\r
async function apiRequest(endpoint, options = {}) {\r
  const authorization = getAuthHeader();\r
\r
  const headers = {\r
    'Content-Type': 'application/json',\r
    ...(authorization ? { Authorization: authorization } : {}),\r
    ...(options.headers || {}),\r
  };\r
\r
  try {\r
    const res = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {\r
      ...options,\r
      headers,\r
    });\r
\r
    let data = null;\r
    const ct = res.headers.get('content-type') || '';\r
    if (ct.includes('application/json')) {\r
      data = await res.json();\r
    } else {\r
      data = { message: await res.text() };\r
    }\r
\r
    if (!res.ok) {\r
      const msg = Array.isArray(data?.message)\r
        ? data.message.join(', ')\r
        : (data?.message || \`HTTP \${res.status}\`);\r
      throw new ApiError(msg, res.status, data);\r
    }\r
\r
    return data;\r
  } catch (e) {\r
    if (e instanceof ApiError) throw e;\r
    // Network error (backend offline)\r
    if (e.message && (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network') || e.name === 'TypeError')) {\r
      throw new ApiError('Backend server is offline. Please start the NestJS server on port 3001.', 0);\r
    }\r
    throw new ApiError(e.message || 'Unknown error', 0);\r
  }\r
}\r
\r
// ─── API Error Class ─────────────────────────────────────────────\r
class ApiError extends Error {\r
  constructor(message, status, data = null) {\r
    super(message);\r
    this.name = 'ApiError';\r
    this.status = status;\r
    this.data = data;\r
  }\r
}\r
\r
// ─── AUTH ────────────────────────────────────────────────────────\r
async function apiLogin(email, password) {\r
  const data = await apiRequest('/auth/login', {\r
    method: 'POST',\r
    body: JSON.stringify({ email, password }),\r
  });\r
  // Backend returns { success, message, data: { userId, name, email, userRole, status } }\r
  // Unwrap the envelope so the caller gets the flat user object\r
  if (data && data.data) return data.data;\r
  return data;\r
}\r
\r
// ─── USERS ───────────────────────────────────────────────────────\r
async function apiGetUsers() {\r
  return apiRequest('/users');\r
}\r
\r
async function apiCreateUser(userData) {\r
  return apiRequest('/users', {\r
    method: 'POST',\r
    body: JSON.stringify(userData),\r
  });\r
}\r
\r
async function apiUpdateUser(userId, updates) {\r
  return apiRequest(\`/users/\${userId}\`, {\r
    method: 'PATCH',\r
    body: JSON.stringify(updates),\r
  });\r
}\r
\r
async function apiDeleteUser(userId) {\r
  return apiRequest(\`/users/\${userId}\`, {\r
    method: 'DELETE',\r
  });\r
}\r
\r
// ─── EVENTS ──────────────────────────────────────────────────────\r
async function apiGetEvents() {\r
  return apiRequest('/events');\r
}\r
\r
async function apiCreateEvent(eventData) {\r
  return apiRequest('/events', {\r
    method: 'POST',\r
    body: JSON.stringify(eventData),\r
  });\r
}\r
\r
async function apiUpdateEvent(eventId, updates) {\r
  return apiRequest(\`/events/\${eventId}\`, {\r
    method: 'PUT',\r
    body: JSON.stringify(updates),\r
  });\r
}\r
\r
async function apiDeleteEvent(eventId) {\r
  return apiRequest(\`/events/\${eventId}\`, {\r
    method: 'DELETE',\r
  });\r
}\r
\r
// ─── ANALYTICS ───────────────────────────────────────────────────\r
async function apiGetDashboard() {\r
  return apiRequest('/analytics/dashboard');\r
}\r
\r
async function apiGetOrganizerDashboard(organizerId) {\r
  return apiRequest('/analytics/organizer-dashboard');\r
}\r
\r
// ─── EVENT REQUESTS ──────────────────────────────────────────────\r
async function apiGetEventRequests() {\r
  return apiRequest('/event-requests');\r
}\r
\r
async function apiGetClientRequests(clientId) {\r
  return apiRequest('/event-requests');\r
}\r
\r
async function apiGetOrganizerRequests(organizerId) {\r
  return apiRequest('/event-requests');\r
}\r
\r
async function apiCreateEventRequest(reqData) {\r
  return apiRequest('/event-requests', {\r
    method: 'POST',\r
    body: JSON.stringify(reqData),\r
  });\r
}\r
\r
async function apiUpdateRequestStatus(requestId, status) {\r
  return apiRequest(\`/event-requests/\${requestId}/status\`, {\r
    method: 'PATCH',\r
    body: JSON.stringify({ status }),\r
  });\r
}\r
\r
// ─── EVENT PLANS ─────────────────────────────────────────────────\r
async function apiCreateEventPlan(planData) {\r
  return apiRequest('/event-plans', {\r
    method: 'POST',\r
    body: JSON.stringify(planData),\r
  });\r
}\r
\r
async function apiApproveEventPlan(planId, approvalStatus) {\r
  return apiRequest(\`/event-plans/\${planId}/approval\`, {\r
    method: 'PATCH',\r
    body: JSON.stringify({ approvalStatus }),\r
  });\r
}\r
\r
// ─── REGISTRATIONS ───────────────────────────────────────────────\r
async function apiGetAttendeeRegistrations(attendeeId) {\r
  return apiRequest('/registrations');\r
}\r
\r
async function apiRegisterForEvent(regData) {\r
  return apiRequest('/registrations', {\r
    method: 'POST',\r
    body: JSON.stringify(regData),\r
  });\r
}\r
\r
// ─── PAYMENTS ────────────────────────────────────────────────────\r
async function apiMakePayment(paymentData) {\r
  return apiRequest('/payments', {\r
    method: 'POST',\r
    body: JSON.stringify(paymentData),\r
  });\r
}\r
\r
// ─── STAFF ASSIGNMENTS ───────────────────────────────────────────\r
async function apiGetStaffAssignments(staffId) {\r
  return apiRequest('/staff-assignments');\r
}\r
\r
async function apiGetStaffStatistics() {\r
  return apiRequest('/staff/statistics');\r
}\r
\r
async function apiCreateStaffAssignment(data) {\r
  return apiRequest('/staff-assignments', {\r
    method: 'POST',\r
    body: JSON.stringify(data),\r
  });\r
}\r
\r
async function apiUpdateAssignmentStatus(assignmentId, status) {\r
  return apiRequest(\`/staff-assignments/\${assignmentId}/status\`, {\r
    method: 'PATCH',\r
    body: JSON.stringify({ status }),\r
  });\r
}\r
\r
// ─── ATTENDANCE ──────────────────────────────────────────────────\r
async function apiVerifyAttendance(verifyData) {\r
  return apiRequest('/attendance/verify', {\r
    method: 'POST',\r
    body: JSON.stringify(verifyData),\r
  });\r
}\r
\r
// ─── NOTIFICATIONS ───────────────────────────────────────────────\r
async function apiGetNotifications(userId) {\r
  return apiRequest('/notifications');\r
}\r
\r
async function apiMarkAllNotificationsRead() {\r
  return apiRequest('/notifications/read-all', {\r
    method: 'PATCH',\r
  });\r
}\r
\r
// ─── REPORTS ─────────────────────────────────────────────────────\r
async function apiCreateStaffReport(reportData) {\r
  return apiRequest('/reports/staff', {\r
    method: 'POST',\r
    body: JSON.stringify(reportData),\r
  });\r
}\r
\r
async function apiCreateEventReport(reportData) {\r
  return apiRequest('/reports/event', {\r
    method: 'POST',\r
    body: JSON.stringify(reportData),\r
  });\r
}\r
\r
// ─── REVIEWS ─────────────────────────────────────────────────────\r
async function apiSubmitEventReview(reviewData) {\r
  return apiRequest('/reviews/event', {\r
    method: 'POST',\r
    body: JSON.stringify(reviewData),\r
  });\r
}\r
\r
// ─── ERROR DISPLAY ───────────────────────────────────────────────\r
function showApiError(message) {\r
  if (typeof toast === 'function') {\r
    toast(message, 'error');\r
  } else {\r
    console.error('[API Error]', message);\r
  }\r
}\r
\r
function showApiSuccess(message) {\r
  if (typeof toast === 'function') {\r
    toast(message, 'success');\r
  } else {\r
    console.log('[API Success]', message);\r
  }\r
}\r
\r
// ─── Export globals ──────────────────────────────────────────────\r
window.API_BASE_URL = API_BASE_URL;\r
window.normalizeRole = normalizeRole;\r
window.getCurrentUser = getCurrentUser;\r
window.setCurrentUser = setCurrentUser;\r
window.clearCurrentUser = clearCurrentUser;\r
window.getRoleHeader = getRoleHeader;\r
window.getUserIdHeader = getUserIdHeader;\r
window.getAuthHeader = getAuthHeader;\r
window.apiRequest = apiRequest;\r
window.ApiError = ApiError;\r
window.apiLogin = apiLogin;\r
window.apiGetUsers = apiGetUsers;\r
window.apiCreateUser = apiCreateUser;\r
window.apiUpdateUser = apiUpdateUser;\r
window.apiDeleteUser = apiDeleteUser;\r
window.apiGetEvents = apiGetEvents;\r
window.apiCreateEvent = apiCreateEvent;\r
window.apiUpdateEvent = apiUpdateEvent;\r
window.apiDeleteEvent = apiDeleteEvent;\r
window.apiGetDashboard = apiGetDashboard;\r
window.apiGetOrganizerDashboard = apiGetOrganizerDashboard;\r
window.apiGetEventRequests = apiGetEventRequests;\r
window.apiGetClientRequests = apiGetClientRequests;\r
window.apiGetOrganizerRequests = apiGetOrganizerRequests;\r
window.apiCreateEventRequest = apiCreateEventRequest;\r
window.apiUpdateRequestStatus = apiUpdateRequestStatus;\r
window.apiCreateEventPlan = apiCreateEventPlan;\r
window.apiApproveEventPlan = apiApproveEventPlan;\r
window.apiGetAttendeeRegistrations = apiGetAttendeeRegistrations;\r
window.apiRegisterForEvent = apiRegisterForEvent;\r
window.apiMakePayment = apiMakePayment;\r
window.apiGetStaffAssignments = apiGetStaffAssignments;\r
window.apiGetStaffStatistics = apiGetStaffStatistics;\r
window.apiCreateStaffAssignment = apiCreateStaffAssignment;\r
window.apiUpdateAssignmentStatus = apiUpdateAssignmentStatus;\r
window.apiVerifyAttendance = apiVerifyAttendance;\r
window.apiGetNotifications = apiGetNotifications;\r
window.apiMarkAllNotificationsRead = apiMarkAllNotificationsRead;\r
window.apiCreateStaffReport = apiCreateStaffReport;\r
window.apiCreateEventReport = apiCreateEventReport;\r
window.apiSubmitEventReview = apiSubmitEventReview;\r
window.showApiError = showApiError;\r
window.showApiSuccess = showApiSuccess;\r
\r
\r
/* ===== EventFlow source: state.js ===== */\r
// ═══════════════════════════════════════════════════════════════\r
// CENTRAL STATE MANAGEMENT - EventFlow Platform\r
// Handles all app state, localStorage persistence, and CRUD operations\r
// ═══════════════════════════════════════════════════════════════\r
\r
const STATE_VERSION = "2.0";\r
const STATE_KEY = "eventflow_state_v2";\r
\r
// Central state object\r
let AppState = {\r
  users: [],\r
  events: [],\r
  registrations: [],\r
  notifications: [],\r
  currentUser: null,\r
  version: STATE_VERSION\r
};\r
\r
// ═══════════════════ PERSISTENCE ═══════════════════\r
\r
function saveState() {\r
  try {\r
    localStorage.setItem(STATE_KEY, JSON.stringify(AppState));\r
  } catch (e) {\r
    console.error("Failed to save state:", e);\r
  }\r
}\r
\r
function loadState() {\r
  try {\r
    const saved = localStorage.getItem(STATE_KEY);\r
    if (saved) {\r
      const parsed = JSON.parse(saved);\r
      // Merge with existing to preserve structure\r
      AppState = { ...AppState, ...parsed };\r
    }\r
  } catch (e) {\r
    console.error("Failed to load state:", e);\r
  }\r
}\r
\r
function initializeDefaultState() {\r
  AppState = {\r
    users: [\r
      { id: "u1", name: "Super Admin", email: "admin@eventflow.com", password: "admin123", role: "superuser", phone: "+91 9876543210", status: "active", joinedAt: "2024-01-01", avatarImage: "/images/avatars/user-alex-johnson.jpg" },\r
      { id: "u2", name: "Priya Sharma", email: "organizer@eventflow.com", password: "org123", role: "organizer", phone: "+91 9876543211", status: "active", joinedAt: "2024-01-05", specialization: "Corporate Events", avatarImage: "/images/avatars/organizer-priya-sharma.jpg" },\r
      { id: "u3", name: "Amit Kumar", email: "staff@eventflow.com", password: "staff123", role: "staff", phone: "+91 9876543212", status: "active", joinedAt: "2024-01-10", service: "Event Coordination", avatarImage: "/images/avatars/staff-amit-kumar.jpg" },\r
      { id: "u4", name: "Sneha Reddy", email: "client@eventflow.com", password: "client123", role: "client", phone: "+91 9876543213", status: "active", joinedAt: "2024-02-01", company: "TechCorp", avatarImage: "/images/avatars/user-michael-torres.jpg" },\r
      { id: "u5", name: "Rahul Singh", email: "attendee@eventflow.com", password: "att123", role: "attendee", phone: "+91 9876543214", status: "active", joinedAt: "2024-02-10", avatarImage: "/images/avatars/user-robert-singh.jpg" }\r
    ],\r
    events: [\r
      { id: "e1", title: "Tech Fest 2026", category: "Conference", date: "2026-04-15", time: "09:00", location: "Convention Center, Chennai", city: "Chennai", capacity: 500, registered: 342, price: 499, status: "upcoming", organizer: "u2", description: "Premier technology conference featuring AI, Cloud & DevOps workshops", image: "/images/events/event-tech-summit.jpg" },\r
      { id: "e2", title: "Startup Meetup", category: "Networking", date: "2026-04-22", time: "18:00", location: "Innovation Hub, Bangalore", city: "Bangalore", capacity: 150, registered: 98, price: 0, status: "upcoming", organizer: "u2", description: "Monthly networking event for startups and investors", image: "/images/events/event-pitch-night.jpg" },\r
      { id: "e3", title: "Web Dev Workshop", category: "Workshop", date: "2026-05-01", time: "10:00", location: "Tech Academy, Hyderabad", city: "Hyderabad", capacity: 80, registered: 65, price: 299, status: "upcoming", organizer: "u2", description: "Hands-on workshop on modern web development with React & Vue", image: "/images/events/event-marketing-workshop.jpg" }\r
    ],\r
    registrations: [\r
      { id: "r1", attendeeId: "u5", eventId: "e1", date: "2026-03-01", ticketId: "TKT-001", status: "confirmed", amount: 499, checkedIn: false, qr: generateQRCode() },\r
      { id: "r2", attendeeId: "u5", eventId: "e2", date: "2026-03-05", ticketId: "TKT-002", status: "confirmed", amount: 0, checkedIn: false, qr: generateQRCode() }\r
    ],\r
    notifications: [\r
      { id: "n1", userId: "u5", message: "Welcome to EventFlow! 🎉", type: "info", read: false, createdAt: new Date().toISOString() }\r
    ],\r
    currentUser: null,\r
    version: STATE_VERSION\r
  };\r
  saveState();\r
}\r
\r
// Load state on initialization\r
document.addEventListener("DOMContentLoaded", () => {\r
  loadState();\r
  if (!AppState.users || AppState.users.length === 0) {\r
    initializeDefaultState();\r
  }\r
});\r
\r
// ═══════════════════ CRUD: USERS ═══════════════════\r
\r
function createUser(userData) {\r
  const newUser = {\r
    id: "u" + Date.now(),\r
    joinedAt: new Date().toISOString().split("T")[0],\r
    status: "active",\r
    ...userData\r
  };\r
  AppState.users.push(newUser);\r
  saveState();\r
  addNotification(null, \`User "\${newUser.name}" created successfully\`, "success");\r
  return newUser;\r
}\r
\r
function updateUser(userId, updates) {\r
  const user = AppState.users.find(u => u.id === userId);\r
  if (user) {\r
    Object.assign(user, updates);\r
    saveState();\r
    addNotification(null, \`User "\${user.name}" updated\`, "success");\r
    return user;\r
  }\r
  return null;\r
}\r
\r
function deleteUser(userId) {\r
  const index = AppState.users.findIndex(u => u.id === userId);\r
  if (index > -1) {\r
    const name = AppState.users[index].name;\r
    AppState.users.splice(index, 1);\r
    saveState();\r
    addNotification(null, \`User "\${name}" deleted\`, "info");\r
    return true;\r
  }\r
  return false;\r
}\r
\r
// ═══════════════════ CRUD: EVENTS ═══════════════════\r
\r
function createEvent(eventData) {\r
  const newEvent = {\r
    id: "e" + Date.now(),\r
    createdAt: new Date().toISOString().split("T")[0],\r
    registered: 0,\r
    status: "upcoming",\r
    ...eventData\r
  };\r
  AppState.events.push(newEvent);\r
  saveState();\r
  addNotification(null, \`Event "\${newEvent.title}" created\`, "success");\r
  return newEvent;\r
}\r
\r
function updateEvent(eventId, updates) {\r
  const event = AppState.events.find(e => e.id === eventId);\r
  if (event) {\r
    Object.assign(event, updates);\r
    saveState();\r
    addNotification(null, \`Event "\${event.title}" updated\`, "success");\r
    return event;\r
  }\r
  return null;\r
}\r
\r
function deleteEvent(eventId) {\r
  const index = AppState.events.findIndex(e => e.id === eventId);\r
  if (index > -1) {\r
    const title = AppState.events[index].title;\r
    AppState.events.splice(index, 1);\r
    // Also remove registrations for this event\r
    AppState.registrations = AppState.registrations.filter(r => r.eventId !== eventId);\r
    saveState();\r
    addNotification(null, \`Event "\${title}" deleted\`, "info");\r
    return true;\r
  }\r
  return false;\r
}\r
\r
// ═══════════════════ CRUD: REGISTRATIONS ═══════════════════\r
\r
function registerAttendee(attendeeId, eventId) {\r
  const event = AppState.events.find(e => e.id === eventId);\r
  if (!event) return null;\r
  \r
  if (event.registered >= event.capacity || event.status === 'full') {\r
    return { success: false, message: 'Event is at maximum capacity' };\r
  }\r
  \r
  // Check if already registered\r
  if (AppState.registrations.find(r => r.attendeeId === attendeeId && r.eventId === eventId)) {\r
    addNotification(attendeeId, "You're already registered for this event", "warning");\r
    return null;\r
  }\r
\r
  const newReg = {\r
    id: "r" + Date.now(),\r
    attendeeId,\r
    eventId,\r
    date: new Date().toISOString().split("T")[0],\r
    ticketId: "TKT-" + String(AppState.registrations.length + 1).padStart(3, "0"),\r
    status: "confirmed",\r
    amount: event.price,\r
    checkedIn: false,\r
    qr: generateQRCode()\r
  };\r
  \r
  AppState.registrations.push(newReg);\r
  event.registered = Math.min(event.registered + 1, event.capacity);\r
  if (event.registered >= event.capacity) {\r
    event.status = "full";\r
  }\r
  \r
  saveState();\r
  addNotification(attendeeId, \`Registered for "\${event.title}" ✓\`, "success");\r
  return newReg;\r
}\r
\r
function cancelRegistration(registrationId) {\r
  const index = AppState.registrations.findIndex(r => r.id === registrationId);\r
  if (index > -1) {\r
    const reg = AppState.registrations[index];\r
    const event = AppState.events.find(e => e.id === reg.eventId);\r
    \r
    if (event) {\r
      event.registered = Math.max(0, event.registered - 1);\r
      if (event.registered < event.capacity && event.status === "full") {\r
        event.status = "upcoming";\r
      }\r
    }\r
    \r
    AppState.registrations.splice(index, 1);\r
    saveState();\r
    addNotification(null, "Registration cancelled", "info");\r
    return true;\r
  }\r
  return false;\r
}\r
\r
function checkInAttendee(registrationId) {\r
  const reg = AppState.registrations.find(r => r.id === registrationId);\r
  if (reg) {\r
    reg.checkedIn = true;\r
    saveState();\r
    addNotification(null, "Attendee checked in ✓", "success");\r
    return true;\r
  }\r
  return false;\r
}\r
\r
// ═══════════════════ NOTIFICATIONS ═══════════════════\r
\r
function addNotification(userId, message, type = "info") {\r
  const notification = {\r
    id: "n" + Date.now(),\r
    userId: userId || "global",\r
    message,\r
    type, // "success", "error", "warning", "info"\r
    read: false,\r
    createdAt: new Date().toISOString()\r
  };\r
  \r
  AppState.notifications.push(notification);\r
  // Keep only last 50 notifications\r
  if (AppState.notifications.length > 50) {\r
    AppState.notifications.shift();\r
  }\r
  \r
  saveState();\r
  return notification;\r
}\r
\r
function markNotificationAsRead(notificationId) {\r
  const notif = AppState.notifications.find(n => n.id === notificationId);\r
  if (notif) {\r
    notif.read = true;\r
    saveState();\r
  }\r
}\r
\r
function getUnreadCount() {\r
  return AppState.notifications.filter(n => !n.read).length;\r
}\r
\r
// ═══════════════════ HELPERS ═══════════════════\r
\r
function generateQRCode() {\r
  // Simple QR grid pattern (5x5 for demo)\r
  const qr = [];\r
  for (let i = 0; i < 25; i++) {\r
    qr.push(Math.random() > 0.5 ? 1 : 0);\r
  }\r
  return qr;\r
}\r
\r
function findUser(userId) {\r
  return AppState.users.find(u => u.id === userId);\r
}\r
\r
function findEvent(eventId) {\r
  return AppState.events.find(e => e.id === eventId);\r
}\r
\r
function getUserEvents(userId) {\r
  return AppState.events.filter(e => e.organizer === userId);\r
}\r
\r
function getUserRegistrations(userId) {\r
  return AppState.registrations.filter(r => r.attendeeId === userId);\r
}\r
\r
function getEventRegistrations(eventId) {\r
  return AppState.registrations.filter(r => r.eventId === eventId);\r
}\r
\r
// ═══════════════════ AUTHENTICATION ═══════════════════\r
\r
function login(email, password) {\r
  const user = AppState.users.find(u => u.email === email && u.password === password);\r
  if (user) {\r
    AppState.currentUser = user;\r
    saveState();\r
    addNotification(user.id, \`Welcome back, \${user.name}! 👋\`, "success");\r
    return user;\r
  }\r
  return null;\r
}\r
\r
function logout() {\r
  AppState.currentUser = null;\r
  saveState();\r
}\r
\r
// Make AppState global\r
window.AppState = AppState;\r
window.createUser = createUser;\r
window.updateUser = updateUser;\r
window.deleteUser = deleteUser;\r
window.createEvent = createEvent;\r
window.updateEvent = updateEvent;\r
window.deleteEvent = deleteEvent;\r
window.registerAttendee = registerAttendee;\r
window.cancelRegistration = cancelRegistration;\r
window.checkInAttendee = checkInAttendee;\r
window.addNotification = addNotification;\r
window.markNotificationAsRead = markNotificationAsRead;\r
window.getUnreadCount = getUnreadCount;\r
window.findUser = findUser;\r
window.findEvent = findEvent;\r
window.getUserEvents = getUserEvents;\r
window.getUserRegistrations = getUserRegistrations;\r
window.getEventRegistrations = getEventRegistrations;\r
window.login = login;\r
window.logout = logout;\r
\r
\r
/* ===== EventFlow source: main.js ===== */\r
// ═══════════════════════════════════════════════════════════════\r
// UI RENDERING & HELPER FUNCTIONS - EventFlow Platform\r
// Dynamically renders all UI components based on state\r
// ═══════════════════════════════════════════════════════════════\r
\r
// ═══════════════════ RENDER: TABLES ═══════════════════\r
\r
function renderUsersTable(containerId, users = null) {\r
  users = users || AppState.users;\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
\r
  const html = \`\r
    <table class="data-table">\r
      <thead>\r
        <tr>\r
          <th>Name</th>\r
          <th>Email</th>\r
          <th>Role</th>\r
          <th>Phone</th>\r
          <th>Status</th>\r
          <th>Actions</th>\r
        </tr>\r
      </thead>\r
      <tbody>\r
        \${users.map(u => \`\r
          <tr class="table-row">\r
            <td>\${escapeHtml(u.name)}</td>\r
            <td>\${escapeHtml(u.email)}</td>\r
            <td><span class="badge badge-\${u.role}">\${u.role}</span></td>\r
            <td>\${escapeHtml(u.phone)}</td>\r
            <td><span class="status-badge status-\${u.status}">\${u.status}</span></td>\r
            <td class="action-buttons">\r
              <button class="btn-small btn-edit" onclick="editUserHandler('\${u.id}')">Edit</button>\r
              <button class="btn-small btn-delete" onclick="deleteUserHandler('\${u.id}')">Delete</button>\r
            </td>\r
          </tr>\r
        \`).join("")}\r
      </tbody>\r
    </table>\r
  \`;\r
  \r
  container.innerHTML = html;\r
}\r
\r
function renderEventsTable(containerId, events = null) {\r
  events = events || AppState.events;\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
\r
  const html = \`\r
    <table class="data-table">\r
      <thead>\r
        <tr>\r
          <th>Event Title</th>\r
          <th>Date</th>\r
          <th>City</th>\r
          <th>Capacity</th>\r
          <th>Registered</th>\r
          <th>Price (₹)</th>\r
          <th>Status</th>\r
          <th>Actions</th>\r
        </tr>\r
      </thead>\r
      <tbody>\r
        \${events.map(e => \`\r
          <tr class="table-row">\r
            <td><strong>\${escapeHtml(e.title)}</strong></td>\r
            <td>\${e.date}</td>\r
            <td>\${escapeHtml(e.city)}</td>\r
            <td>\${e.capacity}</td>\r
            <td>\${e.registered}/\${e.capacity}</td>\r
            <td>₹\${e.price}</td>\r
            <td><span class="status-badge status-\${e.status}">\${e.status}</span></td>\r
            <td class="action-buttons">\r
              <button class="btn-small btn-edit" onclick="editEventHandler('\${e.id}')">Edit</button>\r
              <button class="btn-small btn-delete" onclick="deleteEventHandler('\${e.id}')">Delete</button>\r
            </td>\r
          </tr>\r
        \`).join("")}\r
      </tbody>\r
    </table>\r
  \`;\r
  \r
  container.innerHTML = html;\r
}\r
\r
function renderRegistrationsTable(containerId, registrations = null) {\r
  registrations = registrations || AppState.registrations;\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
\r
  const html = \`\r
    <table class="data-table">\r
      <thead>\r
        <tr>\r
          <th>Ticket ID</th>\r
          <th>Attendee</th>\r
          <th>Event</th>\r
          <th>Date</th>\r
          <th>Status</th>\r
          <th>Checked In</th>\r
          <th>Actions</th>\r
        </tr>\r
      </thead>\r
      <tbody>\r
        \${registrations.map(r => {\r
          const attendee = findUser(r.attendeeId);\r
          const event = findEvent(r.eventId);\r
          return \`\r
            <tr class="table-row">\r
              <td><code>\${r.ticketId}</code></td>\r
              <td>\${escapeHtml(attendee?.name || "Unknown")}</td>\r
              <td>\${escapeHtml(event?.title || "Unknown")}</td>\r
              <td>\${r.date}</td>\r
              <td><span class="status-badge status-\${r.status}">\${r.status}</span></td>\r
              <td>\${r.checkedIn ? "✓" : "−"}</td>\r
              <td class="action-buttons">\r
                \${!r.checkedIn ? \`<button class="btn-small btn-success" onclick="checkInHandler('\${r.id}')">Check In</button>\` : ""}\r
                <button class="btn-small btn-delete" onclick="cancelRegistrationHandler('\${r.id}')">Cancel</button>\r
              </td>\r
            </tr>\r
          \`;\r
        }).join("")}\r
      </tbody>\r
    </table>\r
  \`;\r
  \r
  container.innerHTML = html;\r
}\r
\r
// ═══════════════════ RENDER: EVENT CARDS ═══════════════════\r
\r
function renderEventCards(containerId, events = null, isAttendee = false) {\r
  events = events || AppState.events;\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
\r
  const html = \`\r
    <div class="event-cards-grid">\r
      \${events.map(e => {\r
        const userReg = AppState.registrations.find(r => \r
          r.eventId === e.id && \r
          AppState.currentUser && \r
          r.attendeeId === AppState.currentUser.id\r
        );\r
        const isFull = e.registered >= e.capacity;\r
        const isRegistered = !!userReg;\r
        \r
        return \`\r
          <div class="event-card">\r
            \${e.image ? \`\r
              <div class="event-card-banner" style="height:130px;overflow:hidden;border-radius:8px 8px 0 0;margin:-16px -16px 12px -16px;position:relative">\r
                <img src="\${e.image}" alt="\${escapeHtml(e.title)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'">\r
              </div>\r
            \` : ''}\r
            <div class="event-card-header">\r
              <h3>\${escapeHtml(e.title)}</h3>\r
              <span class="badge badge-\${(e.category || '').toLowerCase()}">\${e.category}</span>\r
            </div>\r
            <div class="event-card-body">\r
              <p class="event-date">📅 \${e.date} at \${e.time}</p>\r
              <p class="event-location">📍 \${escapeHtml(e.city)}</p>\r
              <p class="event-description">\${escapeHtml(e.description)}</p>\r
              <div class="event-capacity">\r
                <span>\${e.registered}/\${e.capacity} registered</span>\r
                <div class="progress-bar">\r
                  <div class="progress" style="width: \${(e.registered/e.capacity)*100}%"></div>\r
                </div>\r
              </div>\r
              <p class="event-price"><strong>₹\${e.price}</strong>\${e.price === 0 ? " (FREE)" : ""}</p>\r
            </div>\r
            <div class="event-card-footer">\r
              \${isAttendee ? \`\r
                \${isRegistered ? \r
                  \`<button class="btn btn-secondary" disabled>Registered ✓</button>\` :\r
                  \`<button class="btn btn-primary" onclick="quickRegisterHandler('\${e.id}')" \${isFull ? "disabled" : ""}>\r
                    \${isFull ? "Event Full" : "Register Now"}\r
                  </button>\`\r
                }\r
              \` : ""}\r
            </div>\r
          </div>\r
        \`;\r
      }).join("")}\r
    </div>\r
  \`;\r
  \r
  container.innerHTML = html;\r
}\r
\r
// ═══════════════════ RENDER: NOTIFICATIONS ═══════════════════\r
\r
function renderNotificationsPanel(containerId) {\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
\r
  const unread = AppState.notifications.filter(n => !n.read);\r
  \r
  const html = \`\r
    <div class="notifications-panel">\r
      \${unread.length === 0 ? \r
        \`<p class="empty-state">No new notifications</p>\` :\r
        \`\r
          <div class="notification-list">\r
            \${unread.map(n => \`\r
              <div class="notification-item notification-\${n.type}" onclick="markNotificationAsRead('\${n.id}')">\r
                <div class="notification-icon">\r
                  \${n.type === "success" ? "✓" : n.type === "error" ? "✕" : n.type === "warning" ? "⚠" : "ℹ"}\r
                </div>\r
                <div class="notification-content">\r
                  <p>\${escapeHtml(n.message)}</p>\r
                  <small>\${getTimeAgo(n.createdAt)}</small>\r
                </div>\r
              </div>\r
            \`).join("")}\r
          </div>\r
        \`\r
      }\r
    </div>\r
  \`;\r
  \r
  container.innerHTML = html;\r
  \r
  // Update notification badge\r
  const badge = document.querySelector(".notification-badge");\r
  if (badge) {\r
    const count = getUnreadCount();\r
    badge.textContent = count;\r
    badge.style.display = count > 0 ? "inline-flex" : "none";\r
  }\r
}\r
\r
// ═══════════════════ MODAL: FORMS ═══════════════════\r
\r
function showAddUserModal() {\r
  const modal = \`\r
    <div class="modal-overlay" onclick="closeModal()">\r
      <div class="modal" onclick="event.stopPropagation()">\r
        <div class="modal-header">\r
          <h3>Add New User</h3>\r
          <button class="btn-close" onclick="closeModal()">×</button>\r
        </div>\r
        <div class="modal-body">\r
          <form id="addUserForm" onsubmit="submitAddUser(event)">\r
            <div class="form-group">\r
              <label for="newUserName">Name *</label>\r
              <input type="text" id="newUserName" required>\r
            </div>\r
            <div class="form-group">\r
              <label for="newUserEmail">Email *</label>\r
              <input type="email" id="newUserEmail" required>\r
            </div>\r
            <div class="form-group">\r
              <label for="newUserPassword">Password *</label>\r
              <input type="password" id="newUserPassword" required>\r
            </div>\r
            <div class="form-group">\r
              <label for="newUserRole">Role *</label>\r
              <select id="newUserRole" required>\r
                <option value="">Select a role</option>\r
                <option value="superuser">Super Admin</option>\r
                <option value="organizer">Event Organizer</option>\r
                <option value="staff">Event Staff</option>\r
                <option value="client">Client</option>\r
                <option value="attendee">Attendee</option>\r
              </select>\r
            </div>\r
            <div class="form-group">\r
              <label for="newUserPhone">Phone *</label>\r
              <input type="tel" id="newUserPhone" required>\r
            </div>\r
            <div class="modal-buttons">\r
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>\r
              <button type="submit" class="btn btn-primary">Create User</button>\r
            </div>\r
          </form>\r
        </div>\r
      </div>\r
    </div>\r
  \`;\r
  \r
  document.body.insertAdjacentHTML("beforeend", modal);\r
}\r
\r
function showAddEventModal() {\r
  const modal = \`\r
    <div class="modal-overlay" onclick="closeModal()">\r
      <div class="modal" onclick="event.stopPropagation()">\r
        <div class="modal-header">\r
          <h3>Create New Event</h3>\r
          <button class="btn-close" onclick="closeModal()">×</button>\r
        </div>\r
        <div class="modal-body">\r
          <form id="addEventForm" onsubmit="submitAddEvent(event)">\r
            <div class="form-row">\r
              <div class="form-group">\r
                <label for="newEventTitle">Event Title *</label>\r
                <input type="text" id="newEventTitle" required>\r
              </div>\r
              <div class="form-group">\r
                <label for="newEventCategory">Category *</label>\r
                <select id="newEventCategory" required>\r
                  <option value="">Select category</option>\r
                  <option value="Conference">Conference</option>\r
                  <option value="Workshop">Workshop</option>\r
                  <option value="Networking">Networking</option>\r
                  <option value="Seminar">Seminar</option>\r
                </select>\r
              </div>\r
            </div>\r
            <div class="form-row">\r
              <div class="form-group">\r
                <label for="newEventDate">Date *</label>\r
                <input type="date" id="newEventDate" required>\r
              </div>\r
              <div class="form-group">\r
                <label for="newEventTime">Time *</label>\r
                <input type="time" id="newEventTime" required>\r
              </div>\r
            </div>\r
            <div class="form-group">\r
              <label for="newEventCity">City *</label>\r
              <select id="newEventCity" required>\r
                <option value="">Select city</option>\r
                <option value="Chennai">Chennai</option>\r
                <option value="Bangalore">Bangalore</option>\r
                <option value="Hyderabad">Hyderabad</option>\r
                <option value="Mumbai">Mumbai</option>\r
                <option value="Delhi">Delhi</option>\r
              </select>\r
            </div>\r
            <div class="form-group">\r
              <label for="newEventLocation">Full Location Address *</label>\r
              <input type="text" id="newEventLocation" placeholder="e.g., Convention Center, Chennai" required>\r
            </div>\r
            <div class="form-row">\r
              <div class="form-group">\r
                <label for="newEventCapacity">Capacity *</label>\r
                <input type="number" id="newEventCapacity" min="1" required>\r
              </div>\r
              <div class="form-group">\r
                <label for="newEventPrice">Price (₹) *</label>\r
                <input type="number" id="newEventPrice" min="0" step="0.01" required>\r
              </div>\r
            </div>\r
            <div class="form-group">\r
              <label for="newEventDescription">Description</label>\r
              <textarea id="newEventDescription" rows="3"></textarea>\r
            </div>\r
            <div class="modal-buttons">\r
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>\r
              <button type="submit" class="btn btn-primary">Create Event</button>\r
            </div>\r
          </form>\r
        </div>\r
      </div>\r
    </div>\r
  \`;\r
  \r
  document.body.insertAdjacentHTML("beforeend", modal);\r
}\r
\r
// ═══════════════════ FORM HANDLERS ═══════════════════\r
\r
function submitAddUser(e) {\r
  e.preventDefault();\r
  \r
  const user = {\r
    name: document.getElementById("newUserName").value,\r
    email: document.getElementById("newUserEmail").value,\r
    password: document.getElementById("newUserPassword").value,\r
    role: document.getElementById("newUserRole").value,\r
    phone: document.getElementById("newUserPhone").value\r
  };\r
  \r
  createUser(user);\r
  closeModal();\r
  updateAllTables();\r
}\r
\r
function submitAddEvent(e) {\r
  e.preventDefault();\r
  \r
  const event = {\r
    title: document.getElementById("newEventTitle").value,\r
    category: document.getElementById("newEventCategory").value,\r
    date: document.getElementById("newEventDate").value,\r
    time: document.getElementById("newEventTime").value,\r
    city: document.getElementById("newEventCity").value,\r
    location: document.getElementById("newEventLocation").value,\r
    capacity: parseInt(document.getElementById("newEventCapacity").value),\r
    price: parseFloat(document.getElementById("newEventPrice").value),\r
    description: document.getElementById("newEventDescription").value,\r
    organizer: AppState.currentUser?.id || "u1"\r
  };\r
  \r
  createEvent(event);\r
  closeModal();\r
  updateAllTables();\r
}\r
\r
// ═══════════════════ QUICK ACTION HANDLERS ═══════════════════\r
\r
function editUserHandler(userId) {\r
  console.log("Edit user:", userId);\r
  const user = findUser(userId);\r
  if (!user) { alert('User not found'); return; }\r
  // TODO: Show edit modal with user data pre-filled\r
  alert("Edit functionality for: " + user.name);\r
}\r
\r
function deleteUserHandler(userId) {\r
  const user = findUser(userId);\r
  if (!user) { alert('User not found'); return; }\r
  if (confirm(\`Delete user "\${user.name}"? This cannot be undone.\`)) {\r
    deleteUser(userId);\r
    updateAllTables();\r
  }\r
}\r
\r
function editEventHandler(eventId) {\r
  console.log("Edit event:", eventId);\r
  const event = findEvent(eventId);\r
  if (!event) { alert('Event not found'); return; }\r
  // TODO: Show edit modal with event data pre-filled\r
  alert("Edit functionality for: " + event.title);\r
}\r
\r
function deleteEventHandler(eventId) {\r
  const event = findEvent(eventId);\r
  if (!event) { alert('Event not found'); return; }\r
  if (confirm(\`Delete event "\${event.title}"? This will also cancel all registrations.\`)) {\r
    deleteEvent(eventId);\r
    updateAllTables();\r
  }\r
}\r
\r
function quickRegisterHandler(eventId) {\r
  if (!AppState.currentUser) {\r
    alert("Please log in to register for events");\r
    return;\r
  }\r
  \r
  const event = findEvent(eventId);\r
  if (!event) { alert('Event not found'); return; }\r
  if (event.registered >= event.capacity) {\r
    alert("Event is full!");\r
    return;\r
  }\r
  \r
  registerAttendee(AppState.currentUser.id, eventId);\r
  updateAllTables();\r
  renderEventCards("eventsContainer", null, AppState.currentUser.role === "attendee");\r
}\r
\r
function checkInHandler(registrationId) {\r
  if (confirm("Confirm check-in for this attendee?")) {\r
    checkInAttendee(registrationId);\r
    updateAllTables();\r
  }\r
}\r
\r
function cancelRegistrationHandler(registrationId) {\r
  if (confirm("Cancel this registration?")) {\r
    cancelRegistration(registrationId);\r
    updateAllTables();\r
  }\r
}\r
\r
// ═══════════════════ UTILITY FUNCTIONS ═══════════════════\r
\r
function closeModal() {\r
  const overlay = document.querySelector(".modal-overlay");\r
  if (overlay) overlay.remove();\r
}\r
\r
function updateAllTables() {\r
  if (document.getElementById('usersTableContainer')) renderUsersTable("usersTableContainer", AppState.users);\r
  if (document.getElementById('eventsTableContainer')) renderEventsTable("eventsTableContainer", AppState.events);\r
  if (document.getElementById('registrationsTableContainer')) renderRegistrationsTable("registrationsTableContainer", AppState.registrations);\r
  if (document.getElementById('notificationsPanel')) renderNotificationsPanel("notificationsPanel");\r
}\r
\r
function escapeHtml(text) {\r
  if (!text) return "";\r
  const div = document.createElement("div");\r
  div.textContent = text;\r
  return div.innerHTML;\r
}\r
\r
function getTimeAgo(isoString) {\r
  const date = new Date(isoString);\r
  const now = new Date();\r
  const seconds = Math.floor((now - date) / 1000);\r
  \r
  if (seconds < 60) return "just now";\r
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";\r
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";\r
  return Math.floor(seconds / 86400) + "d ago";\r
}\r
\r
// Notifications are refreshed when their data changes. Replacing the panel on\r
// a timer remounted its DOM every five seconds and made pages visibly blink.\r
\r
// Make functions global\r
window.renderUsersTable = renderUsersTable;\r
window.renderEventsTable = renderEventsTable;\r
window.renderRegistrationsTable = renderRegistrationsTable;\r
window.renderEventCards = renderEventCards;\r
window.renderNotificationsPanel = renderNotificationsPanel;\r
window.showAddUserModal = showAddUserModal;\r
window.showAddEventModal = showAddEventModal;\r
window.submitAddUser = submitAddUser;\r
window.submitAddEvent = submitAddEvent;\r
window.updateAllTables = updateAllTables;\r
window.closeModal = closeModal;\r
\r
\r
/* ===== EventFlow source: qr.js ===== */\r
// ═══════════════════════════════════════════════════════════════\r
// QR CODE UTILITIES FOR EVENTFLOW CHECK-IN\r
// Generates and displays QR codes for attendee tickets\r
// ═══════════════════════════════════════════════════════════════\r
\r
// Generate a simple deterministic QR-like visual representation\r
function generateQRVisual(data, size = 20) {\r
  const strData = String(data);\r
  // Create a hash-based grid pattern\r
  let pattern = [];\r
  let hash = 0;\r
  \r
  // Simple string hash\r
  for (let i = 0; i < strData.length; i++) {\r
    hash = ((hash << 5) - hash) + strData.charCodeAt(i);\r
    hash = hash & hash; // Convert to 32-bit integer\r
  }\r
  \r
  // Generate grid pattern based on hash\r
  for (let i = 0; i < size * size; i++) {\r
    hash = (hash * 9301 + 49297) % 233280;\r
    pattern.push(hash % 2 === 0);\r
  }\r
  \r
  return pattern;\r
}\r
\r
// Render QR code as SVG or canvas-ready data\r
function renderQRAsGrid(pattern, size = 20, cellSize = 6) {\r
  let svg = \`<svg width="\${size * cellSize}" height="\${size * cellSize}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border:2px solid #000">\`;\r
  \r
  for (let i = 0; i < pattern.length; i++) {\r
    const row = Math.floor(i / size);\r
    const col = i % size;\r
    const x = col * cellSize;\r
    const y = row * cellSize;\r
    \r
    if (pattern[i]) {\r
      svg += \`<rect x="\${x}" y="\${y}" width="\${cellSize}" height="\${cellSize}" fill="#000"/>\`;\r
    }\r
  }\r
  \r
  svg += \`</svg>\`;\r
  return svg;\r
}\r
\r
// Simple canvas-based QR renderer\r
function renderQRCanvas(registrationId, containerId) {\r
  const container = document.getElementById(containerId);\r
  if (!container) return;\r
  \r
  const canvas = document.createElement('canvas');\r
  canvas.width = 150;\r
  canvas.height = 150;\r
  canvas.style.border = '1px solid #ccc';\r
  canvas.style.borderRadius = '5px';\r
  \r
  const ctx = canvas.getContext('2d');\r
  const pattern = generateQRVisual(registrationId, 15);\r
  const cellSize = 10;\r
  \r
  // White background\r
  ctx.fillStyle = '#ffffff';\r
  ctx.fillRect(0, 0, canvas.width, canvas.height);\r
  \r
  // Black pattern\r
  ctx.fillStyle = '#000000';\r
  for (let i = 0; i < pattern.length; i++) {\r
    if (pattern[i]) {\r
      const row = Math.floor(i / 15);\r
      const col = i % 15;\r
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);\r
    }\r
  }\r
  \r
  // Add registration ID text\r
  ctx.fillStyle = '#000000';\r
  ctx.font = '10px Arial';\r
  ctx.textAlign = 'center';\r
  ctx.fillText(String(registrationId).substring(0, 8), canvas.width / 2, canvas.height - 10);\r
  \r
  container.innerHTML = '';\r
  container.appendChild(canvas);\r
}\r
\r
// Display QR code in modal for ticket view\r
function showTicketQRModal(registrationId) {\r
  const reg = AppState.registrations.find(r => r.id === registrationId);\r
  if (!reg) {\r
    addNotification(null, 'Registration not found', 'error');\r
    return;\r
  }\r
  \r
  const event = AppState.events.find(e => e.id === reg.eventId);\r
  const attendee = AppState.users.find(u => u.id === reg.attendeeId);\r
  \r
  const modal = \`\r
    <div id="modal-overlay" onclick="this.remove()">\r
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 400px">\r
        <div class="modal-header">\r
          <h3>🎟️ Ticket & QR Code</h3>\r
          <button class="modal-close-btn" onclick="document.getElementById('modal-overlay').remove()">×</button>\r
        </div>\r
        <div class="modal-body">\r
          <div style="text-align: center; padding: 20px 0">\r
            <div style="font-weight: 600; margin-bottom: 10px">\${attendee?.name}</div>\r
            <div style="color: #8891b4; font-size: 12px; margin-bottom: 20px">\${event?.title}</div>\r
            <div id="qr-canvas-container" style="display: flex; justify-content: center; margin: 20px 0"></div>\r
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">\r
              <div style="font-size: 12px; color: #8891b4">Ticket ID</div>\r
              <div style="font-family: monospace; font-weight: 600; color: #7c6ff7">\${reg.ticketId}</div>\r
            </div>\r
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">\r
              <div style="font-size: 12px; color: #8891b4">Event Date</div>\r
              <div style="font-weight: 500">\${event?.date} at \${event?.time}</div>\r
            </div>\r
            <div style="background: #1c2135; padding: 12px; border-radius: 5px; margin: 20px 0">\r
              <div style="font-size: 12px; color: #8891b4">Amount Paid</div>\r
              <div style="font-weight: 600; color: #22d3a5">₹\${reg.amount}</div>\r
            </div>\r
            <div style="text-align: center; margin-top: 16px">\r
              <span class="badge badge-\${reg.checkedIn ? 'green' : 'yellow'}">\${reg.checkedIn ? '✓ Checked In' : 'Pending Check-in'}</span>\r
            </div>\r
          </div>\r
        </div>\r
        <div class="modal-buttons">\r
          \${!reg.checkedIn ? \`<button class="btn btn-success w-full" onclick="checkInHandler('\${reg.id}'); document.getElementById('modal-overlay').remove(); renderPage('attendance')">✓ Check In Now</button>\` : ''}\r
          <button class="btn btn-ghost w-full" onclick="document.getElementById('modal-overlay').remove()">Close</button>\r
        </div>\r
      </div>\r
    </div>\r
  \`;\r
  \r
  document.body.insertAdjacentHTML('beforeend', modal);\r
  setTimeout(() => renderQRCanvas(reg.id, 'qr-canvas-container'), 100);\r
}\r
\r
// Render QR in registration row\r
function addQRToRegistration(registrationId, cellElement) {\r
  const reg = AppState.registrations.find(r => r.id === registrationId);\r
  if (!reg) return;\r
  \r
  const qrIcon = document.createElement('a');\r
  qrIcon.href = '#';\r
  qrIcon.style.cursor = 'pointer';\r
  qrIcon.style.fontSize = '16px';\r
  qrIcon.onclick = (e) => {\r
    e.preventDefault();\r
    showTicketQRModal(registrationId);\r
  };\r
  qrIcon.textContent = '📱 QR';\r
  qrIcon.title = 'View QR Code';\r
  \r
  cellElement.insertBefore(qrIcon, cellElement.firstChild);\r
  cellElement.insertBefore(document.createTextNode(' '), qrIcon.nextSibling);\r
}\r
\r
// Check-in modal with QR scanner simulation\r
function showCheckInModal(eventId) {\r
  const event = AppState.events.find(e => e.id === eventId);\r
  if (!event) return;\r
  \r
  const regs = AppState.registrations.filter(r => r.eventId === eventId && !r.checkedIn);\r
  \r
  const modal = \`\r
    <div id="modal-overlay" onclick="this.remove()">\r
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px">\r
        <div class="modal-header">\r
          <h3>✅ Check-in Attendees — \${event.title}</h3>\r
          <button class="modal-close-btn" onclick="document.getElementById('modal-overlay').remove()">×</button>\r
        </div>\r
        <div class="modal-body">\r
          <div style="margin-bottom: 16px">\r
            <div style="font-size: 12px; color: #8891b4; margin-bottom: 8px">Pending Check-ins</div>\r
            <div style="font-size: 20px; font-weight: 700; color: #7c6ff7">\${regs.length}</div>\r
          </div>\r
          \r
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 300px; overflow-y: auto">\r
            \${regs.map(r => {\r
              const att = AppState.users.find(u => u.id === r.attendeeId);\r
              return \`\r
                <div style="background: #151929; border: 1px solid #1f2640; border-radius: 8px; padding: 12px">\r
                  <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px">\${att?.name}</div>\r
                  <div style="font-size: 11px; color: #8891b4; margin-bottom: 8px">\${r.ticketId}</div>\r
                  <button class="btn btn-sm btn-success" onclick="checkInAttendee('\${r.id}'); refreshCheckInList('\${eventId}')" style="width: 100%">✓ Check In</button>\r
                </div>\r
              \`;\r
            }).join('')}\r
          </div>\r
        </div>\r
        <div class="modal-buttons">\r
          <button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').remove()">Close</button>\r
        </div>\r
      </div>\r
    </div>\r
  \`;\r
  \r
  document.body.insertAdjacentHTML('beforeend', modal);\r
}\r
\r
function refreshCheckInList(eventId) {\r
  // Re-render the check-in modal\r
  const overlay = document.getElementById('modal-overlay');\r
  if (overlay) overlay.remove();\r
  setTimeout(() => showCheckInModal(eventId), 100);\r
}\r
\r
// Global access\r
window.generateQRVisual = generateQRVisual;\r
window.renderQRAsGrid = renderQRAsGrid;\r
window.renderQRCanvas = renderQRCanvas;\r
window.showTicketQRModal = showTicketQRModal;\r
window.addQRToRegistration = addQRToRegistration;\r
window.showCheckInModal = showCheckInModal;\r
window.refreshCheckInList = refreshCheckInList;\r
\r
\r
/* ===== EventFlow source: navigation.js ===== */\r
/* EventFlow navigation module.\r
 * Navigation module boundary. showPage/goNav/renderPage remain in app.js so all existing page IDs and workflows are unchanged.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['navigation'] = true;\r
\r
\r
/* ===== EventFlow source: auth.js ===== */\r
/* EventFlow auth module.\r
 * Authentication module boundary. Existing login/logout functions remain in app.js; API helpers remain in api.js.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['auth'] = true;\r
\r
\r
/* ===== EventFlow source: database.js ===== */\r
/* EventFlow database module.\r
 * Database module boundary. The canonical mock DB remains in app.js to preserve initialization order and exact data.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['database'] = true;\r
\r
\r
/* ===== EventFlow source: modals.js ===== */\r
/* EventFlow modals module.\r
 * Modal module boundary. Existing modal/drawer/confirm implementations remain in app.js.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['modals'] = true;\r
\r
\r
/* ===== EventFlow source: notifications.js ===== */\r
/* EventFlow notifications module.\r
 * Notifications module boundary. Existing notification state/rendering remains in app.js.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['notifications'] = true;\r
\r
\r
/* ===== EventFlow source: shared.js ===== */\r
/* EventFlow shared module.\r
 * Shared UI module boundary. Existing helpers and cross-page utilities remain in app.js.\r
 * This boundary is intentionally non-invasive: the working SPA runtime remains\r
 * centralized in app.js so no existing IDs, function names, storage keys,\r
 * mock-data records, validation, or button workflows are changed.\r
 */\r
window.EventFlowModules = window.EventFlowModules || {};\r
window.EventFlowModules['shared'] = true;\r
\r
\r
/* ===== EventFlow source: app.js ===== */\r
// ════════════════════════════════════════════════\r
    //  MOCK DATABASE\r
    // ════════════════════════════════════════════════\r
    const DB = {\r
      users: [\r
        { id: 'usr-admin-001', name: 'Alex Johnson', email: 'superadmin@example.com', password: 'Admin@123', role: 'superuser', phone: '+91 9876543201', avatar: 'AJ', avatarImage: '/images/avatars/user-alex-johnson.jpg', status: 'active', joined: '2024-01-15', bio: 'Platform administrator with full system access.' },\r
        { id: 'usr-org-001', name: 'Sarah Chen', email: 'organizer@example.com', password: 'Organizer@123', role: 'organizer', phone: '+91 9876543202', avatar: 'SC', avatarImage: '/images/avatars/organizer-sarah-chen.jpg', status: 'active', joined: '2024-02-01', bio: 'Senior event organizer specializing in corporate events.', service: 'Corporate Events & Conferences', city: 'Bangalore', rating: 4.8, color: '#7c6ff7' },\r
        { id: 'usr-emp-001', userId: 'usr-emp-001', name: 'Marcus Vance', email: 'employee@example.com', password: 'Employee@123', role: 'staff', employeeType: 'EVENT_OPERATIONS', phone: '+91 9876543220', avatar: 'MV', avatarImage: '/images/avatars/staff-marcus-vance.jpg', status: 'active', joined: '2024-01-18', bio: 'Senior event operations employee managing event information and live execution.', service: 'Corporate Conferences & Tech Summits', city: 'Bangalore', rating: 4.9, color: '#3b82f6' },\r
        { id: 'usr-emp-001c', userId: 'usr-emp-001', name: 'Marcus Vance', email: 'marcus.ops@eventflow.com', password: 'Employee@123', role: 'staff', employeeType: 'SUPPORT_FINANCE', phone: '+91 9876543220', avatar: 'MV', avatarImage: '/images/avatars/staff-marcus-vance.jpg', status: 'active', joined: '2024-01-18', bio: 'Customer support and finance operations executive.', service: 'Support & Finance', city: 'Bangalore', rating: 4.9, color: '#3b82f6' },\r
        { id: 'usr-emp-002', userId: 'usr-emp-002', name: 'Elena Rostova', email: 'elena.coordinator@eventflow.com', password: 'Employee@123', role: 'staff', employeeType: 'EVENT_OPERATIONS', phone: '+91 9876543221', avatar: 'ER', avatarImage: '/images/avatars/staff-elena-rostova.jpg', status: 'active', joined: '2024-02-12', bio: 'Event operations executive.', service: 'Event Operations', city: 'Mumbai', rating: 4.8, color: '#ec4899' },\r
        { id: 'usr-emp-003', userId: 'usr-emp-003', name: 'Arjun Kapoor', email: 'arjun.events@eventflow.com', password: 'Employee@123', role: 'staff', employeeType: 'REGISTRATION_VERIFICATION', phone: '+91 9876543222', avatar: 'AK', avatarImage: '/images/avatars/staff-arjun-kapoor.jpg', status: 'active', joined: '2024-03-08', bio: 'Registration and attendee verification executive.', service: 'Registration & Verification', city: 'Delhi NCR', rating: 4.9, color: '#8b5cf6' },\r
        { id: 'usr-emp-004', userId: 'usr-emp-004', name: 'Maya Lin', email: 'maya.ops@eventflow.com', password: 'Employee@123', role: 'staff', employeeType: 'SUPPORT_FINANCE', phone: '+91 9876543223', avatar: 'ML', avatarImage: '/images/avatars/staff-maya-lin.jpg', status: 'active', joined: '2024-03-22', bio: 'Customer support and finance operations executive.', service: 'Support & Finance', city: 'Hyderabad', rating: 4.7, color: '#10b981' },\r
        { id: 'usr-client-001', name: 'Michael Torres', email: 'client@example.com', password: 'Client@123', role: 'client', phone: '+91 9876543203', avatar: 'MT', avatarImage: '/images/avatars/user-michael-torres.jpg', status: 'active', joined: '2024-03-10', bio: 'Head of Events at TechCorp Ltd.', company: 'TechCorp Ltd' },\r
        { id: 'usr-staff-001', name: 'James Wilson', email: 'staff@example.com', password: 'Staff@123', role: 'staff', phone: '+91 9876543204', avatar: 'JW', avatarImage: '/images/avatars/staff-james-wilson.jpg', status: 'active', joined: '2024-02-15', bio: 'Professional photographer and event videographer.', service: 'Photography & Videography', rate: 800 },\r
        { id: 'usr-attendee-001', name: 'Priya Patel', email: 'attendee@example.com', password: 'Attendee@123', role: 'attendee', phone: '+91 9876543205', avatar: 'PP', avatarImage: '/images/avatars/user-priya-patel.jpg', status: 'active', joined: '2024-04-01', bio: 'Tech enthusiast and frequent conference attendee.' },\r
        { id: 'usr-dup-001', name: 'Priya Patel (Secondary)', email: 'attendee@example.com', password: 'Attendee@123', role: 'attendee', phone: '+91 9876543205', avatar: 'PP', avatarImage: '/images/avatars/user-priya-patel.jpg', status: 'active', joined: '2024-04-12', bio: 'Secondary registration under same email.' },\r
        { id: 6, name: 'Emma Brown', email: 'emma@eventflow.com', password: 'org123', role: 'organizer', phone: '+91 9876543206', avatar: 'EB', avatarImage: '/images/avatars/organizer-emma-brown.jpg', status: 'active', joined: '2024-02-20', service: 'Weddings & Social Events', city: 'Pune', rating: 4.7, color: '#f56565', bio: 'Expert in creating memorable wedding and social event experiences with meticulous attention to detail.' },\r
        { id: 7, name: 'David Kim', email: 'david@eventflow.com', password: 'staff123', role: 'staff', phone: '+91 9876543207', avatar: 'DK', avatarImage: '/images/avatars/staff-david-kim.jpg', status: 'inactive', joined: '2024-03-01', service: 'Catering & Hospitality', rate: 1200 },\r
        { id: 8, name: 'Lisa Zhang', email: 'lisa@eventflow.com', password: 'att123', role: 'attendee', phone: '+91 9876543208', avatar: 'LZ', avatarImage: '/images/avatars/user-lisa-zhang.jpg', status: 'active', joined: '2024-04-15' },\r
        { id: 9, name: 'Robert Singh', email: 'robert@eventflow.com', password: 'att123', role: 'attendee', phone: '+91 9876543209', avatar: 'RS', avatarImage: '/images/avatars/user-robert-singh.jpg', status: 'active', joined: '2024-05-01' },\r
        { id: 10, name: 'Nina Lopez', email: 'nina@eventflow.com', password: 'staff123', role: 'staff', phone: '+91 9876543215', avatar: 'NL', avatarImage: '/images/avatars/staff-nina-lopez.jpg', status: 'active', joined: '2024-03-20', service: 'Sound & AV', rate: 950 },\r
        { id: 11, name: 'Rajesh Sharma', email: 'rajesh@eventflow.com', password: 'org123', role: 'organizer', phone: '+91 9876543210', avatar: 'RS', avatarImage: '/images/avatars/organizer-rajesh-sharma.jpg', status: 'active', joined: '2024-03-05', service: 'Weddings & Social Events', city: 'Delhi NCR', rating: 4.9, color: '#22d3a5', bio: 'Expert wedding planner with 15+ years of experience in creating stunning celebrations for families across India.' },\r
        { id: 12, name: 'TechEvents India', email: 'techevents@eventflow.com', password: 'org123', role: 'organizer', phone: '+91 9876543211', avatar: 'TE', avatarImage: '/images/avatars/organizer-techevents.jpg', status: 'active', joined: '2024-01-20', service: 'Tech Conferences & Hackathons', city: 'Bangalore', rating: 4.6, color: '#ed8936', bio: 'Leading organizer for technology summits, conferences, and hackathons in India.' },\r
      ],\r
      events: [\r
        { id: 101, title: 'Global AI & Cloud Summit 2026', category: 'Conference', date: '2026-06-15', time: '09:00', endTime: '18:00', venue: 'Grand Convention Center, Hall A', city: 'Bangalore', capacity: 600, registered: 480, price: 200, status: 'upcoming', organizer: 'usr-emp-001', clientId: 'usr-client-001', description: 'Flagship enterprise summit on Generative AI, Cloud Infrastructure, and Agentic Workflows.', color: '#3b82f6', emoji: '🤖', tags: ['AI', 'Cloud', 'Enterprise'], image: '/images/events/event-ai-summit.jpg' },\r
        { id: 102, title: 'FinTech Leaders Executive Conclave', category: 'Corporate', date: '2026-06-22', time: '17:30', endTime: '22:30', venue: 'The Leela Palace Ballroom', city: 'Mumbai', capacity: 250, registered: 210, price: 350, status: 'upcoming', organizer: 'usr-emp-001', clientId: 'usr-client-001', description: 'Exclusive executive dinner and keynote sessions for digital banking and FinTech innovators.', color: '#10b981', emoji: '💼', tags: ['FinTech', 'Banking', 'Executive'], image: '/images/events/event-fintech.jpg' },\r
        { id: 103, title: 'Cybersecurity & Zero Trust Workshop', category: 'Workshop', date: '2026-07-05', time: '10:00', endTime: '16:00', venue: 'Cyber Towers — Tech Room 3', city: 'Hyderabad', capacity: 80, registered: 80, price: 120, status: 'full', organizer: 'usr-emp-001', clientId: 'usr-client-001', description: 'Hands-on live simulation on threat modeling, Zero Trust architecture, and cloud security.', color: '#f59e0b', emoji: '🛡️', tags: ['Security', 'ZeroTrust', 'HandsOn'], image: '/images/events/event-cybersecurity.jpg' },\r
        { id: 104, title: 'National Web3 & AI Hackathon 2026', category: 'Networking', date: '2026-07-18', time: '08:00', endTime: '20:00', venue: 'Innovation Arena, HITEC City', city: 'Chennai', capacity: 400, registered: 315, price: 0, status: 'upcoming', organizer: 'usr-emp-001', clientId: 'usr-client-001', description: '36-hour national developer hackathon with ?50K in prize bounties for open source AI agents.', color: '#8b5cf6', emoji: '🚀', tags: ['Hackathon', 'AI', 'Developers'], image: '/images/events/event-hackathon.jpg' },\r
        { id: 105, title: 'Healthcare & Biotech Forum 2026', category: 'Conference', date: '2026-03-25', time: '09:00', endTime: '17:00', venue: 'Medical Research Auditorium', city: 'Delhi NCR', capacity: 350, registered: 350, price: 250, status: 'completed', organizer: 'usr-emp-001', clientId: 'usr-client-001', description: 'International forum on AI diagnostics, clinical trials automation, and genomics data.', color: '#06b6d4', emoji: '🏥', tags: ['Healthcare', 'Biotech', 'Genomics'], image: '/images/events/event-healthcare-forum.jpg' },\r
        { id: 1, title: 'Tech Innovation Summit 2026', category: 'Conference', date: '2026-04-15', time: '09:00', endTime: '18:00', venue: 'Grand Convention Center, Hall A', city: 'Chennai', capacity: 500, registered: 342, price: 150, status: 'upcoming', organizer: 'usr-org-001', clientId: 'usr-client-001', description: 'Annual technology conference featuring keynotes from industry leaders, workshops on AI, blockchain, and cloud computing.', color: '#7c6ff7', emoji: '💻', tags: ['AI', 'Tech', 'Networking'], image: '/images/events/event-tech-summit.jpg' },\r
        { id: 2, title: 'Corporate Annual Gala 2026', category: 'Corporate', date: '2026-04-22', time: '18:00', endTime: '23:00', venue: 'Grand Ballroom — Marriott Hotel', city: 'Tirupathi', capacity: 200, registered: 187, price: 250, status: 'upcoming', organizer: 'usr-org-001', clientId: 'usr-client-001', description: 'Exclusive annual corporate dinner and awards ceremony celebrating achievements and milestones.', color: '#22d3a5', emoji: '🥂', tags: ['Corporate', 'Gala', 'Awards'], image: '/images/events/event-annual-gala.jpg' },\r
        { id: 3, title: 'Spring Music Festival', category: 'Concert', date: '2026-05-01', time: '14:00', endTime: '23:00', venue: 'City Park Outdoor Amphitheater', city: 'Noida', capacity: 1000, registered: 756, price: 75, status: 'upcoming', organizer: 6, clientId: 'usr-client-001', description: 'Two-day outdoor music festival featuring 15+ artists across multiple genres.', color: '#f56565', emoji: '🎵', tags: ['Music', 'Outdoor', 'Festival'], image: '/images/events/event-music-fest.jpg' },\r
        { id: 4, title: 'Digital Marketing Workshop', category: 'Workshop', date: '2026-05-10', time: '10:00', endTime: '16:00', venue: 'Business Hub — Room 201', city: 'Hyderabad', capacity: 50, registered: 50, price: 80, status: 'full', organizer: 'usr-org-001', clientId: 'usr-client-001', description: 'Hands-on full-day workshop on modern digital marketing, SEO, social media strategy, and analytics.', color: '#f6c90e', emoji: '📱', tags: ['Marketing', 'Workshop', 'SEO'], image: '/images/events/event-marketing-workshop.jpg' },\r
        { id: 5, title: 'Startup Pitch Night', category: 'Networking', date: '2026-05-15', time: '17:00', endTime: '21:00', venue: 'Innovation Lab — Main Hall', city: 'Chennai', capacity: 150, registered: 98, price: 0, status: 'upcoming', organizer: 6, clientId: 'usr-client-001', description: 'Monthly startup pitch competition with panels of VC judges and networking opportunities.', color: '#7c6ff7', emoji: '🚀', tags: ['Startup', 'Pitch', 'VC'], image: '/images/events/event-pitch-night.jpg' },\r
        { id: 6, title: 'Healthcare Innovation Forum', category: 'Conference', date: '2026-03-10', time: '08:30', endTime: '17:00', venue: 'City Medical Center Auditorium', city: 'Bangalore', capacity: 300, registered: 300, price: 200, status: 'completed', organizer: 'usr-org-001', clientId: 'usr-client-001', description: 'Forum on AI in healthcare, telemedicine, and patient data management.', color: '#22d3a5', emoji: '🏥', tags: ['Health', 'AI', 'Forum'], image: '/images/events/event-medtech.jpg' },\r
        { id: 7, title: 'Photography Masterclass', category: 'Workshop', date: '2026-06-01', time: '10:00', endTime: '15:00', venue: 'Art Studio 5, Downtown', city: 'Pune', capacity: 30, registered: 12, price: 120, status: 'upcoming', organizer: 6, clientId: null, description: 'Hands-on photography workshop for intermediate photographers covering lighting, composition, and post-processing.', color: '#ed8936', emoji: '📷', tags: ['Photography', 'Art', 'Workshop'], image: '/images/events/event-photography.jpg' },\r
        { id: 8, title: 'Rajesh Grand Wedding Celebration', category: 'Wedding', date: '2026-05-15', time: '17:00', endTime: '23:59', venue: 'The Ashok Hotel, New Delhi', city: 'Delhi NCR', capacity: 800, registered: 750, price: 0, status: 'ongoing', organizer: 11, clientId: null, description: 'Grand wedding celebration bringing together families and friends. Featuring traditional ceremonies, vibrant decorations, and festive atmosphere.', color: '#22d3a5', emoji: '💒', tags: ['Wedding', 'Celebration', 'Grand'], image: '/images/events/event-wedding.jpg' },\r
      ],\r
      eventRequests: [\r
        { id: 101, clientId: 'usr-client-001', title: 'Torres Tech Q3 Product Launch', type: 'Corporate', date: '2026-06-01', guests: 350, budget: 35000, status: 'pending', desc: 'Global launch for next-gen enterprise suite. Require 4K live streaming, stage AV, VIP catering, and 5 photographers.', created: '2026-03-20', organizer: 'usr-emp-001', venue: 'Downtown Convention Center' },\r
        { id: 102, clientId: 'usr-client-001', title: 'Annual Leadership Strategy Retreat', type: 'Corporate', date: '2026-06-15', guests: 120, budget: 18000, status: 'approved', desc: 'Annual executive team retreat with breakout workshop sessions, keynote speaker, and outdoor networking dinner.', created: '2026-03-15', organizer: 'usr-emp-001', venue: 'Hilltop Mountain Resort' },\r
        { id: 103, clientId: 'usr-client-001', title: 'Tech Innovation Demo Day', type: 'Networking', date: '2026-07-10', guests: 200, budget: 22000, status: 'in_review', desc: 'Startup and partner showcase demo day with booth setups, investor pitch panels, and networking reception.', created: '2026-03-25', organizer: 'usr-emp-001', venue: 'Innovation Hub Hall 2' },\r
        { id: 1, clientId: 'usr-client-001', title: 'Product Launch Event', type: 'Corporate', date: '2026-06-01', guests: 300, budget: 25000, status: 'pending', desc: 'Grand product launch for our new AI-powered software suite. Need venue, catering, AV, and professional photography.', created: '2026-03-20', venue: 'Downtown Convention Center' },\r
        { id: 2, clientId: 'usr-client-001', title: 'Team Building Retreat', type: 'Corporate', date: '2026-06-15', guests: 80, budget: 12000, status: 'approved', desc: 'Annual team building activity with outdoor challenges, group activities, and team dinner.', created: '2026-03-15', organizer: 'usr-org-001', venue: 'Mountain Resort' },\r
        { id: 3, clientId: 'usr-client-001', title: 'Annual Client Appreciation Dinner', type: 'Corporate', date: '2026-07-10', guests: 120, budget: 18000, status: 'in_review', desc: 'Formal black-tie dinner for top 120 clients. Need premium venue, 5-course dinner, live entertainment.', created: '2026-03-25', organizer: 'usr-org-001', venue: 'Five Star Restaurant & Event Hall' },\r
        { id: 4, clientId: 'usr-client-001', title: 'Sales Training Conference', type: 'Conference', date: '2026-07-20', guests: 200, budget: 15000, status: 'rejected', desc: 'Two-day sales training conference with industry speakers and breakout sessions.', created: '2026-03-28', venue: 'City Conference Center' },\r
      ],\r
      reports: [\r
        { id: 'rpt-emp-001', eventId: 105, fileName: 'healthcare-biotech-final-report.pdf', submittedBy: 'usr-staff-001', submittedAt: '2026-03-26 16:45' },\r
        { id: 'rpt-emp-002', eventId: 103, fileName: 'cybersecurity-workshop-summary.docx', submittedBy: 'usr-emp-001', submittedAt: '2026-07-06 11:20' },\r
      ],\r
      employeeChangeRequests: [\r
        { id: 'chg-emp-001', type: 'event', targetId: 103, targetName: 'Cybersecurity & Zero Trust Workshop', requester: 'Michael Torres', requestedChange: 'Move the event date to 2026-07-12 and increase capacity to 100 attendees.', status: 'pending', submittedAt: 'Today, 9:20 AM' },\r
        { id: 'chg-emp-002', type: 'user', targetId: 'usr-client-001', targetName: 'Michael Torres', requester: 'Michael Torres', requestedChange: 'Update phone number and company details on the user profile.', status: 'pending', submittedAt: 'Yesterday, 4:10 PM' },\r
        { id: 'chg-emp-003', type: 'event', targetId: 105, targetName: 'Healthcare & Biotech Forum 2026', requester: 'James Wilson', requestedChange: 'Add the final attendance count to the event record.', status: 'approved', submittedAt: '2 days ago' },\r
      ],\r
      registrations: [\r
        { id: 101, attendeeId: 'usr-attendee-001', eventId: 101, date: '2026-03-01', ticketId: 'TKT-EMP-101', status: 'confirmed', payment: 'paid', amount: 200, checkedIn: false, seat: 'VIP-12', verificationStatus: 'Verified', verified: true, docType: 'Govt Aadhaar ID', docRef: 'ID-8849-XXXX-1029', notes: 'Verified via Govt ID submission.' },\r
        { id: 102, attendeeId: 'usr-client-001', eventId: 102, date: '2026-03-05', ticketId: 'TKT-EMP-102', status: 'confirmed', payment: 'paid', amount: 350, checkedIn: false, seat: 'A-01', verificationStatus: 'Verified', verified: true, docType: 'Corporate Access Badge', docRef: 'CORP-TC-9941', notes: 'Executive corporate verification completed.' },\r
        { id: 103, attendeeId: 'usr-attendee-001', eventId: 103, date: '2026-03-08', ticketId: 'TKT-EMP-103', status: 'confirmed', payment: 'paid', amount: 120, checkedIn: true, seat: 'Lab-04', verificationStatus: 'Verified', verified: true, docType: 'Passport Verification', docRef: 'PASS-Z992014', notes: 'Workshop credentials verified.' },\r
        { id: 104, attendeeId: 8, eventId: 104, date: '2026-03-12', ticketId: 'TKT-EMP-104', status: 'pending', payment: 'paid', amount: 0, checkedIn: false, seat: 'Desk-22', verificationStatus: 'Pending Review', verified: false, docType: 'Student University ID', docRef: 'UNI-STU-4820', notes: 'Student ID photo blur — pending manual review.' },\r
        { id: 105, attendeeId: 9, eventId: 105, date: '2026-03-15', ticketId: 'TKT-EMP-105', status: 'confirmed', payment: 'paid', amount: 250, checkedIn: true, seat: 'Hall-55', verificationStatus: 'Verified', verified: true, docType: 'Govt Driving License', docRef: 'DL-MH-04-2024009', notes: 'Healthcare delegate identity confirmed.' },\r
        { id: 1, attendeeId: 5, eventId: 1, date: '2026-03-01', ticketId: 'TKT-2026-001', status: 'pending', payment: 'paid', amount: 150, checkedIn: false, seat: 'A-042', verificationStatus: 'Pending Review', verified: false, docType: 'Govt Aadhaar ID', docRef: 'ID-4421-XXXX-9912', notes: 'Identity proof uploaded, awaiting approval.' },\r
        { id: 2, attendeeId: 5, eventId: 2, date: '2026-03-05', ticketId: 'TKT-2026-002', status: 'confirmed', payment: 'paid', amount: 250, checkedIn: false, seat: 'T-015', verificationStatus: 'Verified', verified: true, docType: 'Corporate Invite Pass', docRef: 'GALA-INV-0192', notes: 'Gala guest verification confirmed.' },\r
        { id: 3, attendeeId: 8, eventId: 1, date: '2026-03-02', ticketId: 'TKT-2026-003', status: 'pending', payment: 'paid', amount: 150, checkedIn: true, seat: 'A-043', verificationStatus: 'Flagged', verified: false, docType: 'Company ID Card', docRef: 'EMP-ID-MISSING', flagReason: 'Company ID badge image missing back side.', notes: 'Flagged for re-upload.' },\r
        { id: 4, attendeeId: 5, eventId: 3, date: '2026-03-10', ticketId: 'TKT-2026-004', status: 'confirmed', payment: 'paid', amount: 75, checkedIn: false, seat: 'GA', verificationStatus: 'Verified', verified: true, docType: 'E-Ticket Pass', docRef: 'TKT-FEST-8819', notes: 'Festival online registration verified.' },\r
        { id: 5, attendeeId: 9, eventId: 1, date: '2026-03-03', ticketId: 'TKT-2026-005', status: 'pending', payment: 'paid', amount: 150, checkedIn: true, seat: 'A-044', verificationStatus: 'Pending Review', verified: false, docType: 'Govt Aadhaar ID', docRef: 'ID-1102-XXXX-7741', notes: 'Online verification pending.' },\r
        { id: 6, attendeeId: 8, eventId: 3, date: '2026-03-12', ticketId: 'TKT-2026-006', status: 'confirmed', payment: 'paid', amount: 75, checkedIn: false, seat: 'GA', verificationStatus: 'Verified', verified: true, docType: 'E-Ticket Pass', docRef: 'TKT-FEST-8820', notes: 'Pass verified.' },\r
        { id: 7, attendeeId: 2, eventId: 1, date: '2026-03-14', ticketId: 'TKT-2026-007', status: 'confirmed', payment: 'paid', amount: 150, checkedIn: false, seat: 'A-045', verificationStatus: 'Verified', verified: true, docType: 'Organizer VIP Access', docRef: 'ORG-VIP-002', notes: 'Organizer VIP pass verified.' },\r
        { id: 8, attendeeId: 3, eventId: 1, date: '2026-03-15', ticketId: 'TKT-2026-008', status: 'confirmed', payment: 'paid', amount: 150, checkedIn: false, seat: 'A-046', verificationStatus: 'Verified', verified: true, docType: 'Client Pass', docRef: 'CLT-PASS-104', notes: 'Client registration verified.' },\r
      ],\r
      userQueries: [\r
        { id: 'UQR-501', userId: 'usr-attendee-001', userName: 'Priya Patel', userEmail: 'attendee@example.com', type: 'Account Deletion', subject: 'Request to delete duplicate attendee account', detail: 'User requested deletion of duplicate account created during Summit registration.', source: 'User Request', status: 'Pending', date: 'Today, 10:30 AM' },\r
        { id: 'UQR-502', userId: 'usr-client-001', userName: 'Michael Torres', userEmail: 'client@example.com', type: 'Email Change', subject: 'Update profile email address to corporate domain', detail: 'Requested email update from client@example.com to m.torres@techcorp.com.', source: 'User Request', status: 'In Progress', date: 'Yesterday, 4:15 PM' },\r
        { id: 'UQR-503', userId: 8, userName: 'Lisa Zhang', userEmail: 'lisa@eventflow.com', type: 'Escalated Support', subject: 'Verification failed for Hackathon registration badge', detail: 'Escalated by Customer Support (Employee 3): Student ID upload unreadable, needs re-verification.', source: 'Employee 3 Escalation', status: 'Pending', date: '2 days ago' },\r
        { id: 'UQR-504', userId: 9, userName: 'Robert Singh', userEmail: 'robert@eventflow.com', type: 'Profile Update', subject: 'Contact phone number correction & name spelling', detail: 'Requested phone update to +91 9876543209 and correction on badge name.', source: 'User Request', status: 'Resolved', date: '2026-08-26' },\r
        { id: 'UQR-505', userId: 5, userName: 'Priya Patel (Secondary)', userEmail: 'attendee@example.com', type: 'Escalated Support', subject: 'Duplicate ticket registration merge inquiry', detail: 'Escalated by Employee 3: User registered twice for Tech Summit under different tickets.', source: 'Employee 3 Escalation', status: 'Pending', date: 'Today, 8:45 AM' }\r
      ],\r
      staffAssignments: [\r
        { id: 101, staffId: 'usr-staff-001', eventId: 101, role: 'Lead Event Photographer', status: 'accepted', fee: 1200, notes: 'Full photo coverage for keynote hall and exhibition pavilion.' },\r
        { id: 102, staffId: 'usr-staff-003', eventId: 102, role: 'AV & Sound Director', status: 'accepted', fee: 1500, notes: 'Manage stage audio, wireless mic frequencies, and live projection.' },\r
        { id: 103, staffId: 'usr-staff-002', eventId: 101, role: 'Catering & Banquet Coordinator', status: 'pending', fee: 1800, notes: 'Oversee lunch buffets and VIP lounge refreshments for 600 delegates.' },\r
        { id: 104, staffId: 'usr-staff-004', eventId: 103, role: 'Registration & Badge Host', status: 'accepted', fee: 800, notes: 'Handle QR scanner check-ins and attendee badge printing at registration desk.' },\r
        { id: 105, staffId: 'usr-staff-005', eventId: 104, role: 'Live Stream Videographer', status: 'pending', fee: 1100, notes: 'Operate roving 4K camera for hackathon teams and project demos.' },\r
        { id: 1, staffId: 'usr-staff-001', eventId: 1, role: 'Lead Photographer', status: 'accepted', fee: 800, notes: 'Capture keynotes and networking sessions' },\r
        { id: 2, staffId: 7, eventId: 1, role: 'Catering Head', status: 'pending', fee: 1200, notes: 'Manage lunch and coffee breaks for 500 attendees' },\r
        { id: 3, staffId: 'usr-staff-001', eventId: 6, role: 'Event Photographer', status: 'accepted', fee: 600, notes: 'Completed — full gallery delivered to organizer.' },\r
        { id: 4, staffId: 10, eventId: 2, role: 'AV & Sound Engineer', status: 'accepted', fee: 950, notes: 'Full AV setup and management throughout the gala' },\r
        { id: 5, staffId: 7, eventId: 2, role: 'Catering Coordinator', status: 'pending', fee: 1500, notes: '5-course dinner service for 200 guests' },\r
        { id: 6, staffId: 'usr-staff-001', eventId: 2, role: 'Photographer & Videographer', status: 'pending', fee: 1100, notes: 'Full photo & video coverage of the gala including red carpet arrivals and award ceremony' },\r
        { id: 7, staffId: 'usr-staff-001', eventId: 3, role: 'Stage Photographer', status: 'pending', fee: 750, notes: 'Capture live performances, artist backstage moments, and crowd energy shots' },\r
        { id: 8, staffId: 'usr-staff-001', eventId: 5, role: 'Event Documentarian', status: 'pending', fee: 500, notes: 'Document startup pitches, judge reactions, and networking moments for social media' },\r
        /* ── Mock data: Active Assignments for James Wilson (usr-staff-001) ── */\r
        { id: 201, staffId: 'usr-staff-001', eventId: 101, role: 'Official Summit Photographer', status: 'accepted', fee: 1400, notes: 'Primary shooter for keynote stage, exhibition floor, and speaker portraits. Deliver edited gallery within 48 hrs.' },\r
        { id: 202, staffId: 'usr-staff-001', eventId: 4, role: 'Workshop Documentarian', status: 'accepted', fee: 850, notes: 'Capture full-day Digital Marketing Workshop — classroom activities, presenter slides, and attendee highlights for post-event content.' },\r
        { id: 203, staffId: 'usr-staff-001', eventId: 8, role: 'Wedding Videographer', status: 'accepted', fee: 2200, notes: 'Cinematic wedding video for Rajesh Grand Wedding — ceremony reel, reception highlights, and raw footage hand-off.' },\r
        /* ── Mock data: Pending Event Requests for James Wilson (usr-staff-001) ── */\r
        { id: 204, staffId: 'usr-staff-001', eventId: 102, role: 'Executive Portrait Photographer', status: 'pending', fee: 1600, notes: 'Capture executive headshots and candid networking moments during the FinTech Leaders Conclave dinner session.' },\r
        { id: 205, staffId: 'usr-staff-001', eventId: 104, role: 'Hackathon Coverage Photographer', status: 'pending', fee: 950, notes: 'Document 36-hour hackathon teams, project demos, and prize ceremony. Deliver 200+ edited shots within 72 hrs.' },\r
      ],\r
      staffRequests: [\r
        /* ── Mock data: Direct staff requests for James Wilson (usr-staff-001) ── */\r
        { id: 1, staffId: 'usr-staff-001', organizerId: 'usr-org-001', type: 'Photography', date: '2026-06-15', hours: 8, fee: 1200, details: 'Need a professional photographer for our Tech Innovation Summit 2026 — covering keynote sessions, panel discussions, and evening networking reception. Full edited gallery required.', status: 'pending', createdAt: '2026-08-28' },\r
        { id: 2, staffId: 'usr-staff-001', organizerId: 6, type: 'Videography', date: '2026-05-01', hours: 10, fee: 900, details: 'Spring Music Festival requires an experienced videographer for full day coverage — stage performances, crowd atmosphere, and a 3-minute highlight reel for social media release.', status: 'pending', createdAt: '2026-08-29' },\r
        { id: 3, staffId: 'usr-staff-001', organizerId: 11, type: 'Photography & Videography', date: '2026-08-15', hours: 12, fee: 2500, details: 'Grand wedding celebration — bridal entry, ceremony rites, reception, and family portraits. Drone footage and cinematic edit required. Previous work portfolio requested.', status: 'accepted', acceptedAt: '2026-08-20', createdAt: '2026-08-18' },\r
      ],\r
      notifications: [\r
        { id: 101, title: 'New Event Proposal', msg: 'Michael Torres submitted "Torres Tech Q3 Product Launch" with ₹35,000 budget.', time: '10 mins ago', read: false, type: 'info', icon: '📋' },\r
        { id: 102, title: 'Staff Accepted Assignment', msg: 'James Wilson accepted Lead Photographer for Global AI & Cloud Summit 2026.', time: '1 hr ago', read: false, type: 'success', icon: '✅' },\r
        { id: 103, title: 'Capacity Milestone Reached', msg: 'Cybersecurity Workshop reached 100% capacity (80/80 registered).', time: '3 hrs ago', read: true, type: 'warning', icon: '🎟️' },\r
        { id: 104, title: 'Event Request Approved', msg: 'Annual Leadership Strategy Retreat proposal was approved by the client.', time: '1 day ago', read: true, type: 'success', icon: '🎉' },\r
        { id: 1, title: 'New Event Request', msg: 'Michael Torres submitted: "Product Launch Event" — ?25,000 budget', time: '2 hrs ago', read: false, type: 'info', icon: '📋' },\r
        { id: 2, title: 'Registration Confirmed', msg: 'Priya Patel registered for Tech Innovation Summit 2026', time: '4 hrs ago', read: false, type: 'success', icon: '✅' },\r
        { id: 3, title: 'Staff Assignment Pending', msg: 'Catering Head assignment for Tech Innovation Summit still pending response', time: '6 hrs ago', read: false, type: 'warning', icon: '⚠️' },\r
        { id: 4, title: 'Event Plan Submitted', msg: 'Team Building Retreat plan submitted to client for review', time: '1 day ago', read: true, type: 'info', icon: '📤' },\r
        { id: 5, title: 'Event Approved', msg: 'Corporate Annual Gala 2026 has been approved and is now live', time: '2 days ago', read: true, type: 'success', icon: '🎉' },\r
        { id: 6, title: 'Attendee Checked In', msg: '3 attendees checked in at Healthcare Innovation Forum', time: '3 days ago', read: true, type: 'success', icon: '✅' },\r
        { id: 7, title: 'New Assignment', msg: 'Sarah Johnson assigned you as Photographer & Videographer for Corporate Annual Gala 2026 — ?1,100 fee', time: '1 hr ago', read: false, type: 'warning', icon: '📸' },\r
        { id: 8, title: 'New Assignment', msg: 'Sarah Johnson assigned you as Stage Photographer for Spring Music Festival — ?750 fee', time: '3 hrs ago', read: false, type: 'warning', icon: '🎵' },\r
        { id: 9, title: 'New Assignment', msg: 'Assigned as Event Documentarian for Startup Pitch Night — ?500 fee', time: '5 hrs ago', read: false, type: 'warning', icon: '🚀' },\r
        { id: 'sf-notif-001', employeeType: 'SUPPORT_FINANCE', title: 'New Support Request', msg: 'Michael Torres requested a payment receipt for Global AI & Cloud Summit 2026.', time: '12 mins ago', read: false, type: 'info', icon: '📩' },\r
        { id: 'sf-notif-002', employeeType: 'SUPPORT_FINANCE', title: 'Refund Awaiting Review', msg: 'Refund REF-2026-001 for ₹350 is ready for finance review.', time: '28 mins ago', read: false, type: 'warning', icon: '↩️' },\r
        { id: 'sf-notif-003', employeeType: 'SUPPORT_FINANCE', title: 'Transaction Completed', msg: 'Transaction TXN-2026-005 was completed successfully for Michael Torres.', time: '1 hr ago', read: true, type: 'success', icon: '💳' },\r
        { id: 'sf-notif-004', employeeType: 'SUPPORT_FINANCE', title: 'Report Reviewed', msg: 'August service operations was reviewed by Super Admin.', time: 'Yesterday', read: true, type: 'success', icon: '📊' },\r
      ],\r
      staffAvailability: {\r
        "4": ["2026-04-02", "2026-04-03", "2026-04-05", "2026-04-08", "2026-04-09", "2026-04-10", "2026-04-12", "2026-04-14", "2026-04-15", "2026-04-16", "2026-04-19", "2026-04-22", "2026-04-23", "2026-04-26", "2026-04-28", "2026-04-30", "2026-05-02", "2026-05-05", "2026-05-07", "2026-05-09"],\r
        "7": ["2026-04-01", "2026-04-04", "2026-04-06", "2026-04-07", "2026-04-11", "2026-04-13", "2026-04-17", "2026-04-18", "2026-04-20", "2026-04-21", "2026-04-24", "2026-04-25", "2026-04-27", "2026-04-29", "2026-05-01", "2026-05-03", "2026-05-06", "2026-05-08", "2026-05-10"],\r
        "10": ["2026-04-02", "2026-04-04", "2026-04-07", "2026-04-09", "2026-04-11", "2026-04-14", "2026-04-16", "2026-04-18", "2026-04-21", "2026-04-23", "2026-04-25", "2026-04-28", "2026-04-30", "2026-05-02", "2026-05-04", "2026-05-06", "2026-05-09", "2026-05-11"]\r
      }, // {staffId: [dates]} - e.g., {"4": ["2026-03-15", "2026-03-16"]}\r
      attendanceReports: {}, // {eventId: {total, checked, pending, report}}\r
      supportRequests: [\r
        { id: 'sup-001', userId: 'usr-client-001', eventId: 101, subject: 'Payment receipt needed', message: 'Please resend the receipt for my summit registration.', status: 'Pending', response: '', created: today(), updated: '10 mins ago' },\r
        { id: 'sup-002', userId: 'usr-attendee-001', eventId: 103, subject: 'Unable to download ticket', message: 'My payment is complete but the ticket link is not opening.', status: 'In Progress', response: 'We are checking your ticket record now.', created: '2026-08-27', updated: '1 hr ago' },\r
        { id: 'sup-003', userId: 'usr-client-001', eventId: 102, subject: 'Refund request', message: 'Two registrations were made by mistake. Please refund one.', status: 'Resolved', response: 'Your refund request has been forwarded to finance.', created: '2026-08-26', updated: 'Yesterday' },\r
        { id: 'sup-004', userId: 'usr-attendee-001', eventId: 104, subject: 'Event location question', message: 'Could you confirm the venue entrance details?', status: 'Closed', response: 'Venue instructions were sent to your email.', created: '2026-08-25', updated: '2 days ago' },\r
      ],\r
      financeTransactions: [\r
        { id: 'TXN-2026-001', userId: 'usr-attendee-001', eventId: 101, amount: 200, status: 'Successful', date: today() },\r
        { id: 'TXN-2026-002', userId: 'usr-client-001', eventId: 102, amount: 350, status: 'Successful', date: today() },\r
        { id: 'TXN-2026-005', userId: 'usr-client-001', eventId: 101, amount: 200, status: 'Successful', date: today() },\r
        { id: 'TXN-2026-003', userId: 'usr-attendee-001', eventId: 103, amount: 120, status: 'Pending', date: '2026-08-27' },\r
        { id: 'TXN-2026-004', userId: 'usr-client-001', eventId: 104, amount: 0, status: 'Failed', date: '2026-08-26' },\r
      ],\r
      financeRefunds: [\r
        { id: 'REF-2026-001', userId: 'usr-client-001', eventId: 102, amount: 350, reason: 'Duplicate registration', status: 'Requested', date: today() },\r
        { id: 'REF-2026-002', userId: 'usr-attendee-001', eventId: 103, amount: 120, reason: 'Event schedule conflict', status: 'Processing', date: '2026-08-27' },\r
        { id: 'REF-2026-003', userId: 'usr-attendee-001', eventId: 101, amount: 200, reason: 'Cancelled attendance', status: 'Completed', date: '2026-08-25' },\r
        { id: 'REF-2026-004', userId: 'usr-client-001', eventId: 104, amount: 0, reason: 'Invalid request', status: 'Rejected', date: '2026-08-24' },\r
      ],\r
      operationalReports: [\r
        { id: 'OPR-001', type: 'Support Report', title: 'Weekly support queue', owner: 'Marcus Vance', status: 'Draft', updated: 'Today' },\r
        { id: 'OPR-002', type: 'Finance Report', title: 'Transaction reconciliation', owner: 'Marcus Vance', status: 'Submitted', updated: 'Yesterday' },\r
        { id: 'OPR-003', type: 'Combined Operational Report', title: 'August service operations', owner: 'Maya Lin', status: 'Reviewed', updated: '2026-08-25' },\r
      ],\r
      eventOperationsTasks: [\r
        { id: 'EOP-101', eventId: 101, eventTitle: 'Global AI & Cloud Summit 2026', type: 'Venue & Capacity Review', priority: 'High', status: 'In Progress', description: 'Verify Hall A seating capacity for 600 attendees and check AV setup.', updated: '15 mins ago' },\r
        { id: 'EOP-102', eventId: 102, eventTitle: 'FinTech Leaders Executive Conclave', type: 'Schedule Conflict', priority: 'Medium', status: 'Pending', description: 'Review ballroom entrance timeline to avoid setup overlap with hotel guest event.', updated: '1 hr ago' },\r
        { id: 'EOP-103', eventId: 103, eventTitle: 'Cybersecurity & Zero Trust Workshop', type: 'Equipment & Tech Check', priority: 'Low', status: 'Resolved', description: 'Simulated threat modeling server and projector connection verified.', updated: 'Yesterday' },\r
        { id: 'EOP-104', eventId: 104, eventTitle: 'National Web3 & AI Hackathon 2026', type: 'Security & Access Audit', priority: 'High', status: 'Pending', description: 'Confirm overnight security pass authorizations and 24-hour venue access.', updated: '3 hrs ago' },\r
        { id: 'EOP-105', eventId: 105, eventTitle: 'Torres Tech Q3 Product Launch', type: 'Information Correction', priority: 'Medium', status: 'In Progress', description: 'Correct banner imagery resolution and VIP guest list count.', updated: 'Today' }\r
      ],\r
      eventOpsReports: [\r
        { id: 'EOR-001', type: 'Event Performance Report', title: 'Event Performance Summary — Q2 Summit & Conclave', scope: 'Global AI & Cloud Summit 2026', period: 'Q2 2026', owner: 'Elena Rostova', status: 'Reviewed', fileName: 'Q2_Performance_Summary.pdf', updated: '2026-08-25' },\r
        { id: 'EOR-002', type: 'Event Operations Report', title: 'Venue & Logistics Operations Report', scope: 'Main Convention Center', period: 'August 2026', owner: 'Elena Rostova', status: 'Pending Review', fileName: 'Logistics_Audit_Report.docx', updated: 'Yesterday' },\r
        { id: 'EOR-003', type: 'Event Activity Report', title: 'Monthly Event Activity Report — August 2026', scope: 'Platform Wide', period: 'August 2026', owner: 'Elena Rostova', status: 'Reviewed', fileName: 'August_Activity_Log.xlsx', updated: '2026-08-22' },\r
        { id: 'EOR-004', type: 'Event Operations Report', title: 'Schedule & Venue Audit Report', scope: 'FinTech Leaders Executive Conclave', period: 'August 2026', owner: 'Elena Rostova', status: 'Draft', fileName: null, updated: 'Today' },\r
        { id: 'EOR-005', type: 'Event Performance Report', title: 'Event Issue Resolution & Operations Report', scope: 'All Q3 Events', period: 'Q3 2026', owner: 'Elena Rostova', status: 'Submitted', fileName: 'Issue_Resolution_Q3.pdf', updated: '2 days ago' },\r
        { id: 'EOR-006', type: 'Event Activity Report', title: 'National Hackathon Operations & Equipment Log', scope: 'National Web3 & AI Hackathon 2026', period: 'August Week 4', owner: 'Elena Rostova', status: 'Submitted', fileName: 'Hackathon_Ops_Log.xlsx', updated: '3 days ago' },\r
      ],\r
      eventOpsRequests: [\r
        { id: 'EOR-REQ-001', eventId: 101, eventTitle: 'Global AI & Cloud Summit 2026', issue: 'Venue capacity insufficient — attendee count exceeds Hall A limit by 85 seats. Requesting overflow arrangement.', source: 'User (Direct)', raisedBy: 'Priya Mehta', priority: 'High', status: 'In Progress', date: '2026-08-30 · 9:14 AM', notes: '' },\r
        { id: 'EOR-REQ-002', eventId: 102, eventTitle: 'FinTech Leaders Executive Conclave', issue: 'Schedule conflict reported — keynote session overlaps with hotel ballroom booking. Attendees facing confusion.', source: 'Escalated by Emp 3', raisedBy: 'Customer Support', priority: 'High', status: 'Pending', date: '2026-08-30 · 8:45 AM', notes: '' },\r
        { id: 'EOR-REQ-003', eventId: 103, eventTitle: 'Cybersecurity & Zero Trust Workshop', issue: 'Event banner shows wrong venue floor. Requesting information correction on registration confirmation emails.', source: 'User (Direct)', raisedBy: 'Ravi Kumar', priority: 'Medium', status: 'Pending', date: '2026-08-29 · 4:32 PM', notes: '' },\r
        { id: 'EOR-REQ-004', eventId: 104, eventTitle: 'National Web3 & AI Hackathon 2026', issue: 'Cancellation request raised by team lead — team unable to attend due to visa delays. Refund and slot reallocation required.', source: 'Escalated by Emp 3', raisedBy: 'Customer Support', priority: 'High', status: 'Pending', date: '2026-08-29 · 2:10 PM', notes: '' },\r
        { id: 'EOR-REQ-005', eventId: 105, eventTitle: 'Torres Tech Q3 Product Launch', issue: 'VIP seating arrangement request — 3 executives require reserved front-row access and separate registration check-in.', source: 'User (Direct)', raisedBy: 'Ananya Sharma', priority: 'Medium', status: 'Resolved', date: '2026-08-28 · 11:05 AM', notes: 'VIP arrangement confirmed with venue coordinator.' },\r
        { id: 'EOR-REQ-006', eventId: 106, eventTitle: 'Global Health & MedTech Expo 2026', issue: 'AV equipment malfunction reported during rehearsal — projectors in Hall B not syncing with laptop output.', source: 'Escalated by Emp 3', raisedBy: 'Customer Support', priority: 'High', status: 'In Progress', date: '2026-08-28 · 9:30 AM', notes: '' },\r
        { id: 'EOR-REQ-007', eventId: 107, eventTitle: 'Women in Leadership Summit', issue: 'Schedule update needed — opening ceremony moved 30 mins earlier. Attendees need updated confirmation with new timings.', source: 'User (Direct)', raisedBy: 'Meera Iyer', priority: 'Medium', status: 'Resolved', date: '2026-08-27 · 3:18 PM', notes: 'Updated schedule sent to all registered attendees.' },\r
        { id: 'EOR-REQ-008', eventId: 108, eventTitle: 'Renewable Energy Innovation Forum', issue: 'Capacity oversubscription — event sold 20% over venue limit due to system error. Waiting list and capacity review needed.', source: 'Escalated by Emp 3', raisedBy: 'Customer Support', priority: 'High', status: 'Closed', date: '2026-08-26 · 10:50 AM', notes: 'Capacity expanded to secondary hall. Waitlisted attendees notified.' },\r
        { id: 'EOR-REQ-009', eventId: 101, eventTitle: 'Global AI & Cloud Summit 2026', issue: 'Parking arrangement inquiry — group of 40 attendees from outstation require dedicated parking slots near venue entrance.', source: 'User (Direct)', raisedBy: 'Sameer Joshi', priority: 'Low', status: 'Pending', date: '2026-08-30 · 7:00 AM', notes: '' },\r
        { id: 'EOR-REQ-010', eventId: 103, eventTitle: 'Cybersecurity & Zero Trust Workshop', issue: 'Speaker travel logistics — confirmed keynote speaker requires airport pickup and hotel arrangement from organizer side.', source: 'User (Direct)', raisedBy: 'Organizing Team', priority: 'Medium', status: 'In Progress', date: '2026-08-29 · 6:45 PM', notes: '' },\r
      ],\r
      regReports: [\r
        { id: 'RVR-001', type: 'Registration Report', title: 'Monthly Online Registration & Conversion Audit — August 2026', owner: 'Arjun Kapoor', status: 'Reviewed', period: 'August 2026', fileName: 'Monthly_Registration_Audit_Aug2026.pdf', updated: '2026-08-25' },\r
        { id: 'RVR-002', type: 'User Management Report', title: 'Duplicate Account Detection & Resolution Summary — Q2 2026', owner: 'Arjun Kapoor', status: 'Submitted', period: 'Q2 2026 (Apr–Jun)', fileName: 'Duplicate_Account_Resolution_Q2_2026.docx', updated: 'Yesterday' },\r
        { id: 'RVR-003', type: 'Registration Activity Report', title: 'Q2 Attendee Registration Activity & Demographics Analysis', owner: 'Arjun Kapoor', status: 'Reviewed', period: 'Q2 2026 (Apr–Jun)', fileName: 'Q2_Registration_Activity_Demographics.xlsx', updated: '2026-08-20' },\r
        { id: 'RVR-004', type: 'Registration Report', title: 'Tech Summit 2026 — Online Registration Status & Completion Report', owner: 'Arjun Kapoor', status: 'Submitted', period: 'July 2026', fileName: 'TechSummit_Registration_Report.pdf', updated: '2 days ago' },\r
        { id: 'RVR-005', type: 'User Management Report', title: 'User Account Deactivation & Access Audit — July 2026', owner: 'Arjun Kapoor', status: 'Draft', period: 'July 2026', fileName: null, updated: 'Today' },\r
        { id: 'RVR-006', type: 'Registration Activity Report', title: 'Pending & Flagged Registrations Weekly Summary — Wk 34', owner: 'Arjun Kapoor', status: 'Draft', period: 'August Week 4', fileName: null, updated: 'Today' },\r
      ],\r
      _nextId: { users: 14, events: 9, reqs: 5, regs: 9, assignments: 5, staffReqs: 1, notifs: 10 },\r
    };\r
\r
    // ════════════════════════════════════════════════\r
    //  DATA PERSISTENCE (LOCALSTORAGE)\r
    // ════════════════════════════════════════════════\r
    function saveDB() {\r
      try {\r
        localStorage.setItem('ffsd_db', JSON.stringify(DB));\r
      } catch (e) { console.log('Storage quota exceeded or private mode'); }\r
    }\r
    // \`persist\` is disabled for storage events so receiving tabs do not write the\r
    // same data back and trigger another refresh in every open session.\r
    function loadDB(persist = true) {\r
      try {\r
        const saved = localStorage.getItem('ffsd_db');\r
        if (saved) {\r
          const parsed = JSON.parse(saved);\r
          const initialUsers = [...DB.users];\r
          const initialEvents = [...DB.events];\r
          const initialRequests = [...DB.eventRequests];\r
          const initialRegs = [...DB.registrations];\r
          const initialAssigns = [...DB.staffAssignments];\r
          const initialNotifs = [...DB.notifications];\r
          const initialReports = [...(DB.reports || [])];\r
          const initialChangeRequests = [...(DB.employeeChangeRequests || [])];\r
          const initialStaffReqs = [...(DB.staffRequests || [])];\r
          const initialSupportRequests = [...(DB.supportRequests || [])];\r
          const initialFinanceTransactions = [...(DB.financeTransactions || [])];\r
          const initialFinanceRefunds = [...(DB.financeRefunds || [])];\r
          const initialOperationalReports = [...(DB.operationalReports || [])];\r
          const initialEventOperationsTasks = [...(DB.eventOperationsTasks || [])];\r
          const initialEventOpsReports = [...(DB.eventOpsReports || [])];\r
          const initialUserQueries = [...(DB.userQueries || [])];\r
\r
          Object.assign(DB, parsed);\r
\r
          // Ensure optional arrays exist\r
          if (!DB.staffRequests) DB.staffRequests = [];\r
          if (!DB.reports) DB.reports = [];\r
          if (!DB.employeeChangeRequests) DB.employeeChangeRequests = [];\r
          if (!DB.attendanceReports) DB.attendanceReports = {};\r
          if (!DB.supportRequests) DB.supportRequests = [];\r
          if (!DB.financeTransactions) DB.financeTransactions = [];\r
          if (!DB.financeRefunds) DB.financeRefunds = [];\r
          if (!DB.operationalReports) DB.operationalReports = [];\r
          if (!DB.eventOperationsTasks) DB.eventOperationsTasks = [];\r
          if (!DB.eventOpsReports) DB.eventOpsReports = [];\r
          if (!DB.eventOpsRequests) DB.eventOpsRequests = [];\r
          if (!DB.userQueries) DB.userQueries = [];\r
          if (!DB.routedRequests) DB.routedRequests = [];\r
          if (!DB.staffBooked) DB.staffBooked = {};\r
\r
          // Sync all demo/seed users and passwords from latest build\r
          initialUsers.forEach(initU => {\r
            const existing = DB.users.find(u => (u.email && u.email.toLowerCase() === initU.email.toLowerCase()) || u.id === initU.id);\r
            if (!existing) {\r
              DB.users.push(initU);\r
            } else {\r
              existing.password = initU.password;\r
              existing.status = 'active';\r
              if (initU.role) existing.role = initU.role;\r
              if (initU.name) existing.name = initU.name;\r
              if (initU.avatarImage) existing.avatarImage = initU.avatarImage;\r
              if (initU.avatar) existing.avatar = initU.avatar;\r
              if (initU.service) existing.service = initU.service;\r
              if (initU.bio) existing.bio = initU.bio;\r
              if (initU.color) existing.color = initU.color;\r
            }\r
          });\r
\r
          // Always restore missing mock events (ensuring employee events are always populated)\r
          initialEvents.forEach(ev => {\r
            const existing = DB.events.find(e => String(e.id) === String(ev.id));\r
            if (!existing) {\r
              DB.events.push(ev);\r
            } else {\r
              if (ev.image) existing.image = ev.image;\r
              if (ev.color) existing.color = ev.color;\r
              if (ev.emoji) existing.emoji = ev.emoji;\r
            }\r
          });\r
\r
          // Always restore missing mock event requests & migrate legacy client IDs\r
          initialRequests.forEach(req => {\r
            const existing = DB.eventRequests.find(r => String(r.id) === String(req.id));\r
            if (!existing) {\r
              DB.eventRequests.push(req);\r
            } else if (existing.clientId === 3 || existing.clientId === '3' || !DB.users.find(u => String(u.id) === String(existing.clientId))) {\r
              existing.clientId = 'usr-client-001';\r
            }\r
          });\r
          DB.eventRequests.forEach(r => {\r
            if (r.clientId === 3 || r.clientId === '3' || !DB.users.find(u => String(u.id) === String(r.clientId))) {\r
              r.clientId = 'usr-client-001';\r
            }\r
          });\r
\r
          // Always restore missing mock registrations and sync verification statuses\r
          initialRegs.forEach(reg => {\r
            const existing = DB.registrations.find(r => String(r.id) === String(reg.id));\r
            if (!existing) {\r
              DB.registrations.push(reg);\r
            } else {\r
              if (reg.verificationStatus && !existing.verificationStatus) existing.verificationStatus = reg.verificationStatus;\r
              if (reg.docType && !existing.docType) existing.docType = reg.docType;\r
              if (reg.docRef && !existing.docRef) existing.docRef = reg.docRef;\r
            }\r
          });\r
\r
          // Always restore userQueries\r
          initialUserQueries.forEach(query => {\r
            const existing = DB.userQueries.find(q => String(q.id) === String(query.id));\r
            if (!existing) DB.userQueries.push(query);\r
          });\r
\r
          // Always restore missing mock staff assignments\r
          initialAssigns.forEach(asgn => {\r
            if (!DB.staffAssignments.find(a => String(a.id) === String(asgn.id))) {\r
              DB.staffAssignments.push(asgn);\r
            }\r
          });\r
\r
          // Fix legacy orphaned staff assignments\r
          DB.staffAssignments.forEach(a => { if (a.staffId === 4) a.staffId = 'usr-staff-001'; });\r
\r
          // Always restore missing mock notifications\r
          initialNotifs.forEach(notif => {\r
            if (!DB.notifications.find(n => String(n.id) === String(notif.id))) {\r
              DB.notifications.push(notif);\r
            }\r
          });\r
\r
          // Always restore missing staff requests\r
          initialStaffReqs.forEach(req => {\r
            if (!DB.staffRequests.find(r => String(r.id) === String(req.id))) {\r
              DB.staffRequests.push(req);\r
            }\r
          });\r
\r
          // Always restore missing mock event reports\r
          initialReports.forEach(report => {\r
            if (!DB.reports.find(r => String(r.id) === String(report.id))) {\r
              DB.reports.push(report);\r
            }\r
          });\r
\r
          initialChangeRequests.forEach(request => {\r
            if (!DB.employeeChangeRequests.find(r => String(r.id) === String(request.id))) {\r
              DB.employeeChangeRequests.push(request);\r
            }\r
          });\r
\r
          initialSupportRequests.forEach(request => {\r
            const existing = DB.supportRequests.find(r => String(r.id) === String(request.id));\r
            if (!existing) DB.supportRequests.push(request);\r
          });\r
          initialFinanceTransactions.forEach(transaction => {\r
            const existing = DB.financeTransactions.find(item => String(item.id) === String(transaction.id));\r
            if (!existing) DB.financeTransactions.push(transaction);\r
            else if (['TXN-2026-001', 'TXN-2026-002', 'TXN-2026-005'].includes(transaction.id)) existing.date = transaction.date;\r
          });\r
          initialFinanceRefunds.forEach(refund => {\r
            const existing = DB.financeRefunds.find(item => String(item.id) === String(refund.id));\r
            if (!existing) DB.financeRefunds.push(refund);\r
            else if (['REF-2026-001'].includes(refund.id)) existing.date = refund.date;\r
          });\r
          initialOperationalReports.forEach(report => {\r
            if (!DB.operationalReports.find(item => String(item.id) === String(report.id))) DB.operationalReports.push(report);\r
          });\r
          initialEventOperationsTasks.forEach(task => {\r
            if (!DB.eventOperationsTasks.find(item => String(item.id) === String(task.id))) DB.eventOperationsTasks.push(task);\r
          });\r
          initialEventOpsReports.forEach(report => {\r
            if (!DB.eventOpsReports.find(item => String(item.id) === String(report.id))) DB.eventOpsReports.push(report);\r
          });\r
          (DB._initialEventOpsRequests || DB.eventOpsRequests.slice()).forEach(() => { });\r
          // Restore event ops requests from seed\r
          if (typeof initialEventOpsRequests !== 'undefined') {\r
            initialEventOpsRequests.forEach(req => {\r
              if (!DB.eventOpsRequests.find(item => String(item.id) === String(req.id))) DB.eventOpsRequests.push(req);\r
            });\r
          }\r
\r
          // SAFETY: Sync _nextId with actual data max IDs to prevent collisions\r
          const _maxId = (arr, key) => arr.length ? Math.max(0, ...arr.map(x => isNaN(x[key]) ? 0 : parseInt(x[key]))) : 0;\r
          DB._nextId.users = Math.max(DB._nextId.users || 0, _maxId(DB.users, 'id') + 1);\r
          DB._nextId.events = Math.max(DB._nextId.events || 0, _maxId(DB.events, 'id') + 1);\r
          DB._nextId.regs = Math.max(DB._nextId.regs || 0, _maxId(DB.registrations, 'id') + 1);\r
          DB._nextId.assignments = Math.max(DB._nextId.assignments || 0, _maxId(DB.staffAssignments, 'id') + 1);\r
          DB._nextId.reqs = Math.max(DB._nextId.reqs || 0, _maxId(DB.eventRequests, 'id') + 1);\r
\r
          // Persist seed-data migrations only for local loads. A storage event\r
          // must remain read-only to avoid a cross-tab update loop.\r
          if (persist) saveDB();\r
        }\r
      } catch (e) { console.log('Could not load DB from storage'); }\r
    }\r
\r
    function saveAvailability(staffId, dates) {\r
      DB.staffAvailability[staffId] = dates;\r
      saveDB();\r
    }\r
    function getAvailability(staffId) {\r
      return DB.staffAvailability[staffId] || [];\r
    }\r
    function toggleAvailable(staffId, date) {\r
      const avail = getAvailability(staffId);\r
      const idx = avail.indexOf(date);\r
      if (idx > -1) avail.splice(idx, 1);\r
      else avail.push(date);\r
      saveAvailability(staffId, avail);\r
    }\r
    function isAvailable(staffId, date) {\r
      return getAvailability(staffId).includes(date);\r
    }\r
    function saveAttendanceReport(eventId, report) {\r
      DB.attendanceReports[eventId] = report;\r
      saveDB();\r
    }\r
    function getAttendanceReport(eventId) {\r
      return DB.attendanceReports[eventId] || null;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  STATE\r
    // ════════════════════════════════════════════════\r
    let CU = null; // current user\r
    let _confirmCb = null;\r
    let _currentPage = 'dashboard';\r
\r
    const ROLE_LABELS = { superuser: 'Super Administrator', organizer: 'Event Organizer', client: 'Client', staff: 'Event Staff', attendee: 'Attendee' };\r
    const ROLE_COLORS = { superuser: 'red', organizer: 'purple', client: 'yellow', staff: 'green', attendee: 'blue' };\r
    const DEMO_CREDS = {\r
      employee: { email: 'employee@example.com', pw: 'Employee@123' },\r
      organizer: { email: 'organizer@example.com', pw: 'Organizer@123' },\r
      client: { email: 'client@example.com', pw: 'Client@123' },\r
      staff: { email: 'staff@example.com', pw: 'Staff@123' },\r
      attendee: { email: 'attendee@example.com', pw: 'Attendee@123' },\r
      superuser: { email: 'superadmin@example.com', pw: 'Admin@123' },\r
    };\r
\r
    function isEmployeeAccount() {\r
      return (CU?.email || '').toLowerCase() === DEMO_CREDS.employee.email;\r
    }\r
\r
    // New department-based Employee 1/2/3 accounts. Legacy staff accounts have no employeeType.\r
    function isDepartmentEmployee() {\r
      return CU?.role === 'staff' && !!CU?.employeeType;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  PAGE SWITCHING\r
    // ════════════════════════════════════════════════\r
    function showPage(p) {\r
      document.getElementById('landing').style.display = p === 'landing' ? 'block' : 'none';\r
      document.getElementById('login').style.display = p === 'login' ? 'flex' : 'none';\r
      document.getElementById('find-events').style.display = p === 'find-events' ? 'block' : 'none';\r
      document.getElementById('gallery').style.display = p === 'gallery' ? 'block' : 'none';\r
      document.getElementById('about').style.display = p === 'about' ? 'block' : 'none';\r
      document.getElementById('contact').style.display = p === 'contact' ? 'block' : 'none';\r
      document.getElementById('app').style.display = p === 'app' ? 'block' : 'none';\r
    }\r
    function gotoLogin(role) {\r
      showPage('login');\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  AUTH\r
    // ════════════════════════════════════════════════\r
\r
    function fillLogin(email, pass) {\r
      for (const [id, value] of [['l-email', email], ['l-pass', pass]]) {\r
        const input = g(id);\r
        if (!input) continue;\r
        input.value = value;\r
        input.dispatchEvent(new Event('input', { bubbles: true }));\r
      }\r
      toast('Demo credentials loaded: ' + email, 'info');\r
    }\r
    function doLogin() {\r
      const email = g('l-email').value.trim();\r
      const pass = g('l-pass').value.trim();\r
      let ok = true;\r
      if (!email || !email.includes('@')) { showErr('l-email-err'); ok = false; } else hideErr('l-email-err');\r
      if (!pass || pass.length < 3) { showErr('l-pass-err'); ok = false; } else hideErr('l-pass-err');\r
      if (!ok) return;\r
\r
      const btn = document.querySelector('#login .btn-primary');\r
      if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }\r
\r
      // Try backend first, with instant fallback to local DB if backend is offline\r
      apiLogin(email, pass).then(function (userData) {\r
        const roleMap = {\r
          SUPER_ADMIN: 'superuser', super_admin: 'superuser',\r
          CLIENT: 'client', client: 'client',\r
          EVENT_ORGANIZER: 'organizer', event_organizer: 'organizer',\r
          EVENT_STAFF: 'staff', event_staff: 'staff',\r
          ATTENDEE: 'attendee', attendee: 'attendee',\r
        };\r
        const frontendRole = roleMap[userData.role || userData.userRole] || (userData.role || '').toLowerCase();\r
\r
        CU = {\r
          id: userData.userId,\r
          userId: userData.userId,\r
          name: userData.name,\r
          email: userData.email,\r
          token: userData.token,\r
          role: frontendRole,\r
          userRole: userData.role || userData.userRole,\r
          employeeType: userData.employeeType,\r
          status: userData.status,\r
          avatar: (userData.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),\r
        };\r
\r
        try { sessionStorage.setItem('ef_cu', JSON.stringify(CU)); } catch (e) { }\r
        if (routeToRoleWorkspace(CU)) return;\r
        initApp();\r
        showPage('app');\r
        document.documentElement.classList.remove('restoring-session');\r
        toast(\`Welcome back, \${CU.name}! 👋\`, 'success');\r
      }).catch(function (err) {\r
        // Check local DB if offline or if password matches demo aliases\r
        const localUser = DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());\r
        const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');\r
        const inNorm = norm(pass);\r
        const stNorm = localUser ? norm(localUser.password) : '';\r
\r
        const localMatches = localUser && (\r
          localUser.password === pass ||\r
          localUser.password.toLowerCase() === pass.toLowerCase() ||\r
          inNorm === stNorm ||\r
          inNorm === 'staff123' || inNorm === 'staff' ||\r
          inNorm === 'employee123' || inNorm === 'employee' ||\r
          inNorm === 'organizer123' || inNorm === 'org123' || inNorm === 'organizer' ||\r
          inNorm === 'client123' || inNorm === 'client' ||\r
          inNorm === 'attendee123' || inNorm === 'att123' || inNorm === 'attendee' ||\r
          inNorm === 'admin123' || inNorm === 'admin'\r
        );\r
\r
        if (localMatches) {\r
          CU = {\r
            id: localUser.id || localUser.userId,\r
            userId: localUser.userId || localUser.id,\r
            name: localUser.name,\r
            email: localUser.email,\r
            role: localUser.role,\r
            userRole: localUser.userRole || localUser.role,\r
            employeeType: localUser.employeeType,\r
            status: localUser.status || 'active',\r
            avatar: (localUser.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),\r
          };\r
          try { sessionStorage.setItem('ef_cu', JSON.stringify(CU)); } catch (e) { }\r
          if (routeToRoleWorkspace(CU)) return;\r
          initApp();\r
          showPage('app');\r
          document.documentElement.classList.remove('restoring-session');\r
          toast(\`Welcome back, \${CU.name}! 👋\`, 'success');\r
        } else {\r
          const msg = err.message || 'Invalid email or password';\r
          toast(msg, 'error');\r
          showErr('l-pass-err');\r
          g('l-pass-err').textContent = msg;\r
        }\r
      }).finally(function () {\r
        if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }\r
      });\r
    }\r
\r
    function doLogout() {\r
      CU = null;\r
      try { sessionStorage.removeItem('ef_cu'); } catch (e) { }\r
      document.documentElement.classList.remove('restoring-session');\r
      if (window.EventFlowRole?.key !== 'landing') {\r
        window.location.replace('/landing');\r
        return;\r
      }\r
      showPage('landing');\r
      toast('Signed out successfully', 'info');\r
    }\r
    function openRegisterModal() {\r
      openModal('Create New Account', \`\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="rg-name" placeholder="John Doe"></div>\r
      <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="rg-email" type="email" placeholder="you@example.com"></div>\r
    </div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Password *</label><input class="form-control" id="rg-pass" type="password" placeholder="Min 6 characters"></div>\r
      <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="rg-phone" placeholder="+91 9876543200"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Register As *</label>\r
      <select class="form-control" id="rg-role">\r
        <option value="attendee">🎟️ Attendee</option>\r
        <option value="client">💼 Client</option>\r
        <option value="staff">👷 Event Staff</option>\r
        <option value="organizer">🎯 Event Organizer</option>\r
      </select>\r
    </div>\r
    <div class="form-group" id="rg-service-grp" style="display:none"><label class="form-label">Service / Specialty</label><input class="form-control" id="rg-service" placeholder="e.g. Photography, Catering"></div>\r
  \`, [{ lbl: 'Create Account', cls: 'btn-primary', fn: 'submitRegister()' }], false);\r
      g('rg-role').addEventListener('change', function () { g('rg-service-grp').style.display = this.value === 'staff' ? '' : 'none'; });\r
    }\r
    function submitRegister() {\r
      const name = v('rg-name'), email = v('rg-email'), pass = v('rg-pass'), phone = v('rg-phone'), role = v('rg-role'), service = v('rg-service');\r
      if (!name) { toast('Name is required', 'error'); return; }\r
      if (!email || !email.includes('@')) { toast('Valid email is required', 'error'); return; }\r
      if (!pass || pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }\r
      if (DB.users.find(u => u.email === email)) { toast('Email already registered', 'error'); return; }\r
      const initials = (name.split(' ').map(n => n[0]).join('')).toUpperCase().slice(0, 2);\r
      DB.users.push({ id: DB._nextId.users++, name, email, password: pass, role, phone, avatar: initials, status: 'active', joined: today(), service });\r
      closeModal();\r
      toast('Account created! You can now sign in.', 'success');\r
      g('l-email').value = email;\r
      g('l-pass').value = pass;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  APP INIT\r
    // ════════════════════════════════════════════════\r
    const NAV = {\r
      superuser: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '👥', lbl: 'User Reports', pg: 'user-reports' },\r
        { ic: '🗓️', lbl: 'Event Reports', pg: 'event-reports' },\r
        { ic: '💰', lbl: 'Revenue Reports', pg: 'revenue-reports' },\r
      ],\r
      organizer: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '🗓️', lbl: 'Manage Events', pg: 'events' },\r
        { ic: '📋', lbl: 'Event Requests', pg: 'event-requests' },\r
        { ic: '👷', lbl: 'Staff Management', pg: 'staff' },\r
        { ic: '👥', lbl: 'Attendee Management', pg: 'attendees' },\r
        { ic: '📈', lbl: 'Event Reports', pg: 'reports' },\r
      ],\r
      employee: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '📈', lbl: 'Reports', pg: 'reports' },\r
        { ic: '👤', lbl: 'Profile', pg: 'profile' },\r
      ],\r
      client: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '🔍', lbl: 'Find Organizers', pg: 'find-organizers' },\r
        { ic: '▶️', lbl: 'Ongoing Events', pg: 'ongoing-events' },\r
        { ic: '✅', lbl: 'Completed Events', pg: 'completed-events' },\r
        { ic: '📋', lbl: 'Request Status', pg: 'request-status' },\r
      ],\r
      staff: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '📅', lbl: 'Manage Events', pg: 'assignments' },\r
        { ic: '📋', lbl: 'Reports', pg: 'staff-reports' },\r
        { ic: '📆', lbl: 'Availability', pg: 'staff-availability' },\r
        { ic: '✅', lbl: 'Attendee Verification', pg: 'attendeeVerification' },\r
      ],\r
      attendee: [\r
        { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
        { ic: '🔍', lbl: 'Browse Events', pg: 'browse-events' },\r
        { ic: '🎟️', lbl: 'My Tickets', pg: 'my-tickets' },\r
      ],\r
    };\r
\r
    // ════════════════════════════════════════════════\r
    //  ADMIN: Employee Stats & Management (superuser)\r
    // ════════════════════════════════════════════════\r
    function buildGroupedAnalyticsBars(groups, height, legend) {\r
      let max = 1;\r
      groups.forEach(g => {\r
        (g.bars || []).forEach(b => { if ((b.value || 0) > max) max = b.value; });\r
      });\r
      const chartHeight = height || 200;\r
      return \`\r
  <div style="display:flex;flex-direction:column;gap:10px">\r
    \${legend ? \`\r
    <div style="display:flex;justify-content:flex-end;gap:16px;font-size:12px;color:var(--text2);margin-bottom:4px">\r
      \${legend.map(l => \`<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:\${l.color}"></span>\${l.label}</span>\`).join('')}\r
    </div>\` : ''}\r
    <div style="display:flex;align-items:flex-end;gap:16px;height:\${chartHeight}px;padding-top:16px;border-bottom:1px solid var(--border)">\r
      \${groups.map(group => {\r
        return \`\r
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%">\r
          <div style="display:flex;align-items:flex-end;gap:5px;width:100%;height:100%;justify-content:center">\r
            \${group.bars.map(bar => {\r
          const barHeight = Math.max(8, Math.round(((bar.value || 0) / max) * Math.max(chartHeight - 52, 40)));\r
          return \`\r
              <div style="flex:1;max-width:26px;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px">\r
                <div style="font-size:10px;font-weight:700;color:var(--text3)">\${bar.value}</div>\r
                <div style="width:100%;height:\${barHeight}px;flex-shrink:0;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--green),#15803d);box-shadow:0 8px 16px rgba(15,23,42,.12)" title="\${bar.label || ''}: \${bar.value}"></div>\r
              </div>\`;\r
        }).join('')}\r
          </div>\r
          <div style="font-size:11px;font-weight:600;color:var(--text2);text-align:center;line-height:1.2;margin-top:4px">\${group.label}</div>\r
        </div>\`;\r
      }).join('')}\r
    </div>\r
  </div>\`;\r
    }\r
    function buildAnalyticsBars(items, height) {\r
      const max = Math.max(1, ...items.map(item => item.value || 0));\r
      const chartHeight = height || 180;\r
      return \`\r
  <div style="display:flex;align-items:flex-end;gap:14px;height:\${chartHeight}px;padding-top:12px">\r
    \${items.map(item => {\r
        const barHeight = Math.max(8, Math.round(((item.value || 0) / max) * Math.max(chartHeight - 52, 40)));\r
        return \`\r
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px">\r
        <div style="font-size:11px;color:var(--text3)">\${item.value}</div>\r
        <div style="width:100%;max-width:58px;height:\${barHeight}px;flex-shrink:0;border-radius:18px 18px 8px 8px;background:linear-gradient(180deg,var(--green),#15803d);box-shadow:0 16px 28px rgba(15,23,42,.18)"></div>\r
        <div style="font-size:11px;color:var(--text2);text-align:center;line-height:1.35">\${item.label}</div>\r
      </div>\`;\r
      }).join('')}\r
  </div>\`;\r
    }\r
    function buildAnalyticsProgress(items) {\r
      const total = items.reduce((sum, item) => sum + (item.value || 0), 0) || 1;\r
      return \`<div style="display:flex;flex-direction:column;gap:14px">\r
    \${items.map(item => {\r
        const pct = Math.round(((item.value || 0) / total) * 100);\r
        return \`<div>\r
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">\r
        <span style="font-size:12px;color:var(--text2)">\${item.label}</span>\r
        <span style="font-size:12px;color:var(--text)">\${item.value} · \${pct}%</span>\r
      </div>\r
      <div style="height:10px;border-radius:999px;background:var(--surface3);overflow:hidden">\r
        <div style="width:\${pct}%;height:100%;border-radius:999px;background:\${item.color}"></div>\r
      </div>\r
    </div>\`;\r
      }).join('')}\r
  </div>\`;\r
    }\r
    async function pageEmployeeStats() {\r
      const employees = DB.users.filter(u => u.role === 'staff');\r
      const totalEmployees = employees.length;\r
      const activeEmployees = employees.filter(e => e.status === 'active').length;\r
      const inactiveEmployees = Math.max(totalEmployees - activeEmployees, 0);\r
      const revenue = DB.registrations.reduce((s, r) => s + (r.amount || 0), 0);\r
      const assignmentStats = {\r
        accepted: (DB.staffAssignments || []).filter(a => a.status === 'accepted').length,\r
        pending: (DB.staffAssignments || []).filter(a => a.status === 'pending').length,\r
        declined: (DB.staffAssignments || []).filter(a => a.status === 'declined').length,\r
        completed: (DB.staffAssignments || []).filter(a => a.status === 'completed').length,\r
      };\r
      const serviceCounts = {};\r
      employees.forEach(employee => {\r
        const label = employee.service || 'General Staff';\r
        serviceCounts[label] = (serviceCounts[label] || 0) + 1;\r
      });\r
      const serviceBars = Object.entries(serviceCounts)\r
        .sort((a, b) => b[1] - a[1])\r
        .slice(0, 5)\r
        .map(([label, value], idx) => ({\r
          label,\r
          value,\r
          color: ['linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #ef4444, #b91c1c)', 'linear-gradient(180deg, #14b8a6, #0f766e)'][idx % 5],\r
        }));\r
\r
      let serverStats = null;\r
      if (typeof apiGetStaffStatistics === 'function') {\r
        try { serverStats = await apiGetStaffStatistics(); } catch (e) { serverStats = null; }\r
      }\r
\r
      const totalEmployeesVal = serverStats && serverStats.totalStaff !== undefined ? serverStats.totalStaff : totalEmployees;\r
      const availableEmployeesVal = serverStats && serverStats.availableStaff !== undefined ? serverStats.availableStaff : activeEmployees;\r
      const totalAssignmentsVal = serverStats && serverStats.totalAssignments !== undefined ? serverStats.totalAssignments : assignmentStats.accepted;\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Employee Statistics</div><div class="page-sub">Read-only workforce analytics for the admin panel.</div></div>\r
  </div>\r
  <div class="grid-4 mb-20">\r
    <div class="stat-card"><div class="stat-icon">👔</div><div class="stat-value" style="color:var(--accent)">\${totalEmployeesVal}</div><div class="stat-label">Total Employees</div><div class="stat-sub neutral">\${availableEmployeesVal} available</div></div>\r
    <div class="stat-card"><div class="stat-icon">📌</div><div class="stat-value" style="color:var(--green)">\${totalAssignmentsVal}</div><div class="stat-label">Accepted Assignments</div><div class="stat-sub neutral">\${assignmentStats.pending} pending</div></div>\r
    <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" style="color:var(--yellow)">\${Math.round((activeEmployees / (totalEmployees || 1)) * 100)}%</div><div class="stat-label">Active Workforce</div><div class="stat-sub neutral">\${activeEmployees} active employees</div></div>\r
    <div class="stat-card"><div class="stat-icon">💼</div><div class="stat-value" style="color:var(--orange)">₹\${revenue.toLocaleString()}</div><div class="stat-label">Revenue Footprint</div><div class="stat-sub neutral">Registration-driven revenue</div></div>\r
  </div>\r
  <div class="grid-2 mb-20">\r
    <div class="card">\r
      <div class="h4 mb-12">Workforce Status</div>\r
      \${buildAnalyticsBars([\r
        { label: 'Active', value: activeEmployees, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Inactive', value: inactiveEmployees, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' },\r
        { label: 'Available', value: availableEmployeesVal, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
      ], 210)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">Assignment Pipeline</div>\r
      \${buildAnalyticsProgress([\r
        { label: 'Accepted', value: assignmentStats.accepted, color: 'linear-gradient(90deg, #22c55e, #16a34a)' },\r
        { label: 'Pending', value: assignmentStats.pending, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },\r
        { label: 'Completed', value: assignmentStats.completed, color: 'linear-gradient(90deg, #3b82f6, #2563eb)' },\r
        { label: 'Declined', value: assignmentStats.declined, color: 'linear-gradient(90deg, #ef4444, #dc2626)' },\r
      ])}\r
    </div>\r
  </div>\r
  <div class="grid-2">\r
    <div class="card">\r
      <div class="h4 mb-12">Service Mix</div>\r
      \${buildAnalyticsBars(serviceBars.length ? serviceBars : [\r
        { label: 'No Services', value: 0, color: 'linear-gradient(180deg, #64748b, #475569)' },\r
      ], 210)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">Employee Share Of Platform</div>\r
      \${buildAnalyticsProgress([\r
        { label: 'Employees', value: totalEmployees, color: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' },\r
        { label: 'Other Users', value: Math.max(DB.users.length - totalEmployees, 0), color: 'linear-gradient(90deg, #14b8a6, #0f766e)' },\r
      ])}\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function initApp() {\r
      const r = CU.role;\r
      const navRole = isDepartmentEmployee() ? 'employee' : r;\r
      const displayRole = isDepartmentEmployee() ? EMPLOYEE_TYPE_LABELS[CU.employeeType] : (ROLE_LABELS[r] || r);\r
      g('sb-name').textContent = isDepartmentEmployee() ? displayRole : CU.name;\r
      g('sb-role-lbl').textContent = isDepartmentEmployee() ? 'Employee workspace' : displayRole;\r
      if (CU.avatarImage) {\r
        g('sb-av').innerHTML = \`<img src="\${CU.avatarImage}" alt="\${CU.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='\${CU.avatar || CU.name.charAt(0)}'">\`;\r
      } else {\r
        g('sb-av').textContent = CU.avatar || CU.name.charAt(0);\r
      }\r
      updateNotifDot();\r
      buildNav(navRole);\r
      if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType);\r
      goNav('dashboard');\r
    }\r
\r
    function buildEmployeeNav(employeeType) {\r
      const nav = {\r
        REGISTRATION_VERIFICATION: [\r
          { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' },\r
          { ic: '📝', lbl: 'Registrations', pg: 'registrations' },\r
          { ic: '👥', lbl: 'User Management', pg: 'attendees' },\r
          { ic: '📄', lbl: 'Reports', pg: 'reports' },\r
        ],\r
        EVENT_OPERATIONS: [\r
          { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' }, { ic: '📅', lbl: 'Events', pg: 'events' },\r
          { ic: '⚙️', lbl: 'Event Operations', pg: 'event-requests' }, { ic: '📄', lbl: 'Reports', pg: 'reports' },\r
        ],\r
        SUPPORT_FINANCE: [\r
          { ic: '📊', lbl: 'Dashboard', pg: 'dashboard' }, { ic: '📩', lbl: 'Support Center', pg: 'support-center' },\r
          { ic: '💳', lbl: 'Finance', pg: 'finance' }, { ic: '📋', lbl: 'Reports', pg: 'reports' },\r
        ],\r
      }[employeeType] || [];\r
      const unread = visibleNotifications().filter(n => !n.read).length;\r
      g('sb-nav').innerHTML = \`<div class="sb-section-lbl">Menu</div>\` + nav.map(i => \`<div class="sb-item" data-pg="\${i.pg}" onclick="goNav('\${i.pg}')"><span class="ic">\${i.ic}</span><span>\${i.lbl}</span>\${i.badge && unread > 0 ? '<span class="badge-dot"></span>' : ''}</div>\`).join('');\r
    }\r
\r
    function sendContactMessage() {\r
      const name = document.getElementById('contact-name').value.trim();\r
      const email = document.getElementById('contact-email').value.trim();\r
      const message = document.getElementById('contact-message').value.trim();\r
\r
      if (!name) { toast('Please enter your name', 'error'); return; }\r
      if (!email) { toast('Please enter your email', 'error'); return; }\r
\r
      // Email validation regex - checks for valid email format\r
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\r
      if (!emailRegex.test(email)) { toast('Please enter a valid email address', 'error'); return; }\r
\r
      if (!message) { toast('Please enter a message', 'error'); return; }\r
\r
      // If all validations pass, show success and clear form\r
      toast('Thank you! We will be in touch soon.', 'success');\r
      document.getElementById('contact-name').value = '';\r
      document.getElementById('contact-email').value = '';\r
      document.getElementById('contact-message').value = '';\r
    }\r
\r
    function buildNav(role) {\r
      const items = NAV[role] || [];\r
      const unread = DB.notifications.filter(n => !n.read).length;\r
      g('sb-nav').innerHTML = \`<div class="sb-section-lbl">Menu</div>\` +\r
        items.map(i => \`<div class="sb-item" data-pg="\${i.pg}" onclick="goNav('\${i.pg}')">\r
      <span class="ic">\${i.ic}</span>\r
      <span>\${i.lbl}</span>\r
      \${i.badge && unread > 0 ? \`<span class="badge-dot"></span>\` : ''}\r
    </div>\`).join('');\r
    }\r
    function updateNotifDot() {\r
      const unread = visibleNotifications().filter(n => !n.read).length;\r
      const dot = g('notif-count-dot');\r
      if (dot) dot.style.display = unread > 0 ? 'block' : 'none';\r
    }\r
\r
    const PAGE_TITLES = {\r
      'user-reports': 'User Reports & Analytics',\r
      'event-reports': 'Event Reports & Analytics',\r
      'revenue-reports': 'Revenue Reports & Analytics',\r
      dashboard: 'Dashboard', 'users': 'User Statistics', 'events': 'Events', 'browse-events': 'Browse Events',\r
      'my-tickets': 'My Tickets', 'assignments': 'Manage Events', 'staff': 'Staff Management', 'staff-admin': 'Staff Overview', 'staff-availability': 'My Availability', 'staff-event-requests': 'Event Requests',\r
      attendees: 'Attendee Management', 'reports': 'Reports & Analytics', 'notifications': 'Notifications', 'attendeeVerification': 'Attendee Verification',\r
      'employee-stats': 'Employee Statistics',\r
      registrations: 'Registrations',\r
      'find-organizers': 'Find Event Organisers', 'upcoming-events': 'Upcoming Events', 'completed-events': 'Completed Events', 'ongoing-events': 'Ongoing Events',\r
      settings: 'Account Settings', 'pending-plans': 'Pending Plans', 'request-status': 'Request Status',\r
      'new-request': 'New Event Request', 'profile': 'My Profile', 'event-requests': 'Event Requests',\r
      'support-center': 'Support Center', 'finance': 'Finance',\r
    };\r
    function updateHeaderUser() {\r
      if (!CU) return;\r
      const displayRole = isDepartmentEmployee()\r
        ? EMPLOYEE_TYPE_LABELS[CU.employeeType]\r
        : (ROLE_LABELS[CU.role] || CU.role || 'User');\r
      const header = g('topbar-title');\r
      if (!header) return;\r
      header.textContent = CU.name ? \`\${CU.name} · \${displayRole}\` : displayRole;\r
      header.title = header.textContent;\r
    }\r
\r
    function goNav(pg) {\r
      _currentPage = pg;\r
      // Keep event-request tabs associated with their parent sidebar section.\r
      const sidebarPage = pg === 'staff-event-requests'\r
        ? (isDepartmentEmployee() ? 'event-requests' : 'assignments')\r
        : pg;\r
      document.querySelectorAll('.sb-item').forEach(el => el.classList.toggle('active', el.dataset.pg === sidebarPage));\r
      updateHeaderUser();\r
      // Read the latest shared data without writing it back. Writing during\r
      // navigation broadcasts a storage event and forces other open tabs to\r
      // rebuild their current page.\r
      loadDB(false);\r
      // renderPage may be async for pages that fetch backend data\r
      renderPage(pg).catch(err => console.error('Render error', err));\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  PAGE ROUTER\r
    // ════════════════════════════════════════════════\r
    async function renderPage(pg) {\r
      const previousPage = _currentPage;\r
      const active = document.activeElement;\r
      const searchInput = active instanceof HTMLInputElement\r
        && active.id\r
        && active.hasAttribute('oninput')\r
        && /search/i.test(\`\${active.id} \${active.placeholder}\`)\r
        ? active\r
        : null;\r
      const restoreSearchInput = () => {\r
        if (searchInput && previousPage === pg && !searchInput.isConnected) {\r
          const replacement = g(searchInput.id);\r
          if (replacement) {\r
            replacement.replaceWith(searchInput);\r
            searchInput.focus({ preventScroll: true });\r
          }\r
        }\r
      };\r
      const render = renderPageContent(pg);\r
      restoreSearchInput();\r
      return render.finally(restoreSearchInput);\r
    }\r
\r
    async function renderPageContent(pg) {\r
      _currentPage = pg;\r
      const el = g('page-content');\r
      const r = CU.role;\r
\r
      if (isDepartmentEmployee()) {\r
        const allowed = {\r
          REGISTRATION_VERIFICATION: ['dashboard', 'registrations', 'attendees', 'attendeeVerification', 'reports', 'profile', 'settings', 'notifications'],\r
          EVENT_OPERATIONS: ['dashboard', 'events', 'event-requests', 'staff-event-requests', 'reports', 'profile', 'settings', 'notifications'],\r
          SUPPORT_FINANCE: ['dashboard', 'support-center', 'finance', 'reports', 'profile', 'settings', 'notifications'],\r
        }[CU.employeeType] || [];\r
        if (!allowed.includes(pg)) { el.innerHTML = \`<div class="empty"><div class="empty-title">Access restricted</div><p class="empty-desc">This department does not have access to this area.</p></div>\`; return; }\r
      }\r
\r
      // Restrict superuser to only the 3 analytical subpages\r
      if (r === 'superuser') {\r
        if (pg === 'dashboard') {\r
          el.innerHTML = dashAdmin();\r
          return;\r
        } else if (pg === 'event-reports' || pg === 'events') {\r
          el.innerHTML = pageEventReports();\r
          return;\r
        } else if (pg === 'revenue-reports' || pg === 'reports' || pg === 'staff-reports' || pg === 'employee-stats') {\r
          el.innerHTML = pageRevenueReports();\r
          return;\r
        } else {\r
          el.innerHTML = pageUserReports();\r
          return;\r
        }\r
      }\r
\r
      switch (pg) {\r
        case 'dashboard':\r
          el.innerHTML = isDepartmentEmployee()\r
            ? dashDepartmentEmployee()\r
            : ({ organizer: dashOrganizer, client: dashClient, staff: dashStaff, attendee: dashAttendee }[r] || dashAttendee)();\r
          break;\r
        case 'registrations':\r
          el.innerHTML = pageRegistrationsForEmployee();\r
          break;\r
        case 'events':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS' ? pageEventOpsEvents() : pageEvents();\r
          break;\r
        case 'event-requests':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS' ? pageEventOperationsWorkspace() : pageEventRequests();\r
          break;\r
        case 'support-center':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE' ? pageSupportCenter() : pageEventRequests();\r
          break;\r
        case 'finance':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE' ? pageFinanceCenter() : pageRevenueReports();\r
          break;\r
        case 'request-status':\r
          el.innerHTML = pageRequestStatus();\r
          break;\r
        case 'staff':\r
        case 'find-staff':\r
          el.innerHTML = pageStaffCombined();\r
          break;\r
        case 'attendees':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'REGISTRATION_VERIFICATION' ? pageUserManagement() : pageAttendees();\r
          break;\r
        case 'attendeeVerification':\r
          el.innerHTML = pageAttendeeVerification();\r
          break;\r
        case 'reports':\r
          el.innerHTML = isDepartmentEmployee() && CU.employeeType === 'REGISTRATION_VERIFICATION' ? pageRegVerificationReports() : (isDepartmentEmployee() && CU.employeeType === 'EVENT_OPERATIONS' ? pageEventOpsReports() : (isDepartmentEmployee() && CU.employeeType === 'SUPPORT_FINANCE' ? pageOperationalReports() : pageReports()));\r
          break;\r
        case 'staff-reports':\r
          el.innerHTML = pageStaffReports();\r
          break;\r
        case 'staff-availability':\r
          el.innerHTML = pageStaffAvailability();\r
          break;\r
        case 'assignments':\r
          el.innerHTML = pageAssignments();\r
          break;\r
        case 'staff-event-requests':\r
          el.innerHTML = pageStaffEventRequests();\r
          break;\r
        case 'staff-requests':\r
          el.innerHTML = pageStaffRequests();\r
          break;\r
        case 'browse-events':\r
          el.innerHTML = pageBrowseEvents();\r
          break;\r
        case 'my-tickets':\r
          el.innerHTML = pageMyTickets();\r
          break;\r
        case 'find-organizers':\r
          el.innerHTML = pageFindOrganizers();\r
          break;\r
        case 'upcoming-events':\r
          el.innerHTML = pageUpcomingEvents();\r
          break;\r
        case 'completed-events':\r
          el.innerHTML = pageCompletedEvents();\r
          break;\r
        case 'ongoing-events':\r
          el.innerHTML = pageOngoingEvents();\r
          break;\r
        case 'notifications':\r
          el.innerHTML = pageNotifications();\r
          break;\r
        case 'profile':\r
          el.innerHTML = pageProfile();\r
          break;\r
        case 'settings':\r
          el.innerHTML = pageSettings();\r
          break;\r
        case 'users':\r
          el.innerHTML = pageUsers();\r
          break;\r
        case 'employee-stats':\r
          el.innerHTML = await pageEmployeeStats();\r
          break;\r
        default:\r
          el.innerHTML = \`<div class="empty"><div class="empty-icon">🚧</div><div class="empty-title">Page not found</div><p class="empty-desc">The requested page "\${pg}" could not be loaded.</p></div>\`;\r
      }\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  DASHBOARDS\r
    // ════════════════════════════════════════════════\r
    function dashAdmin() {\r
      const totalUsers = DB.users.length, totalEvents = DB.events.length, totalRegs = DB.registrations.length;\r
      const revenue = DB.registrations.reduce((s, r) => s + (r.amount || 0), 0);\r
      const pendingReqs = DB.eventRequests.filter(r => r.status === 'pending').length;\r
      const roleCounts = {\r
        superuser: DB.users.filter(u => u.role === 'superuser').length,\r
        organizer: DB.users.filter(u => u.role === 'organizer').length,\r
        client: DB.users.filter(u => u.role === 'client').length,\r
        staff: DB.users.filter(u => u.role === 'staff').length,\r
        attendee: DB.users.filter(u => u.role === 'attendee').length,\r
      };\r
      const eventStatusCounts = {\r
        upcoming: DB.events.filter(e => e.status === 'upcoming' || e.status === 'published').length,\r
        ongoing: DB.events.filter(e => e.status === 'ongoing').length,\r
        completed: DB.events.filter(e => e.status === 'completed').length,\r
        draft: DB.events.filter(e => e.status === 'draft').length,\r
      };\r
      const requestStatusCounts = {\r
        pending: DB.eventRequests.filter(r => r.status === 'pending').length,\r
        approved: DB.eventRequests.filter(r => r.status === 'approved').length,\r
        rejected: DB.eventRequests.filter(r => r.status === 'rejected').length,\r
      };\r
      const employeeAssignmentCounts = {\r
        accepted: DB.staffAssignments.filter(a => a.status === 'accepted').length,\r
        pending: DB.staffAssignments.filter(a => a.status === 'pending').length,\r
        declined: DB.staffAssignments.filter(a => a.status === 'declined').length,\r
      };\r
\r
      // Fetch real analytics from backend asynchronously and update stat cards\r
      apiGetDashboard().then(function (resp) {\r
        const d = resp && resp.data ? resp.data : resp;\r
        const patch = [\r
          ['adm-stat-users', d.users ? d.users.total : totalUsers],\r
          ['adm-stat-events', d.events ? d.events.total : totalEvents],\r
          ['adm-stat-regs', d.registrations ? d.registrations.total : totalRegs],\r
          ['adm-stat-rev', '₹' + ((d.payments ? d.payments.totalRevenue : revenue) / 1000).toFixed(1) + 'K'],\r
        ];\r
        patch.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });\r
        const pending = document.getElementById('adm-stat-pending');\r
        if (pending) pending.textContent = (d.eventRequests ? d.eventRequests.pending : pendingReqs) + ' req(s) pending';\r
      }).catch(function () { /* silently keep local stats */ });\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">System Overview</div><div class="page-sub">Welcome back, \${CU.name}. Here's the platform at a glance.</div></div>\r
    <div class="page-hd-right">\r
      <button class="btn btn-ghost" onclick="goNav('users')">User Statistics</button>\r
      <button class="btn btn-primary mt-4" style="margin-left: 8px;" onclick="goNav('employee-stats')">Employee Analytics</button>\r
    </div>\r
  </div>\r
  <div class="grid-4 mb-20">\r
    <div class="stat-card"><div class="glow" style="background:var(--accent)"></div><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div><div class="stat-value" id="adm-stat-users" style="color:var(--accent)">\${totalUsers}</div><div class="stat-label">Total Users</div><div class="stat-sub up">↑ 12% this month</div></div>\r
    <div class="stat-card"><div class="glow" style="background:var(--green)"></div><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">🗓️</div><div class="stat-value" id="adm-stat-events" style="color:var(--green)">\${totalEvents}</div><div class="stat-label">Total Events</div><div class="stat-sub up">↑ 3 new this week</div></div>\r
    <div class="stat-card"><div class="glow" style="background:var(--yellow)"></div><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">🎟️</div><div class="stat-value" id="adm-stat-regs" style="color:var(--yellow)">\${totalRegs}</div><div class="stat-label">Registrations</div><div class="stat-sub up">↑ 8% this week</div></div>\r
    <div class="stat-card"><div class="glow" style="background:var(--orange)"></div><div class="stat-icon" style="background:var(--orange-dim);color:var(--orange)">💰</div><div class="stat-value" id="adm-stat-rev" style="color:var(--orange)">₹\${(revenue / 1000).toFixed(1)}K</div><div class="stat-label">Total Revenue</div><div class="stat-sub neutral" id="adm-stat-pending">\${pendingReqs} req(s) pending</div></div>\r
  </div>\r
  <div class="grid-2" style="gap:20px;align-items:start">\r
    <div class="card">\r
      <div class="flex justify-between items-center mb-16"><span class="h4">Platform Role Split</span><button class="btn btn-ghost btn-xs" onclick="goNav('users')">Open User Analytics</button></div>\r
      \${buildAnalyticsBars([\r
        { label: 'Admins', value: roleCounts.superuser, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' },\r
        { label: 'Organizers', value: roleCounts.organizer, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
        { label: 'Clients', value: roleCounts.client, color: 'linear-gradient(180deg, #f59e0b, #d97706)' },\r
        { label: 'Employees', value: roleCounts.staff, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Attendees', value: roleCounts.attendee, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },\r
      ], 160)}\r
    </div>\r
    <div class="card" style="padding:16px">\r
      <div class="flex justify-between items-center mb-12"><span class="h4">Request Pipeline <span class="small" style="color:var(--text3);font-weight:500">(\${requestStatusCounts.pending + requestStatusCounts.approved + requestStatusCounts.rejected} total)</span></span><button class="btn btn-ghost btn-xs" onclick="goNav('reports')">Open Reports</button></div>\r
      \${buildAnalyticsProgress([\r
        { label: 'Pending', value: requestStatusCounts.pending, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },\r
        { label: 'Approved', value: requestStatusCounts.approved, color: 'linear-gradient(90deg, #22c55e, #15803d)' },\r
        { label: 'Rejected', value: requestStatusCounts.rejected, color: 'linear-gradient(90deg, #ef4444, #b91c1c)' },\r
      ])}\r
    </div>\r
  </div>\r
  <div class="grid-2 mt-20" style="gap:20px;align-items:start">\r
    <div class="card" style="padding:16px">\r
      <div class="h4 mb-12">Employee Capacity <span class="small" style="color:var(--text3);font-weight:500">(\${employeeAssignmentCounts.accepted + employeeAssignmentCounts.pending + employeeAssignmentCounts.declined} assignments)</span></div>\r
      \${buildAnalyticsProgress([\r
        { label: 'Accepted Assignments', value: employeeAssignmentCounts.accepted, color: 'linear-gradient(90deg, #22c55e, #16a34a)' },\r
        { label: 'Pending Assignments', value: employeeAssignmentCounts.pending, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },\r
        { label: 'Declined Assignments', value: employeeAssignmentCounts.declined, color: 'linear-gradient(90deg, #ef4444, #dc2626)' },\r
      ])}\r
    </div>\r
    <div class="card" style="padding:16px">\r
      <div class="h4 mb-12">Event Coverage</div>\r
      \${buildAnalyticsBars([\r
        { label: 'Published', value: eventStatusCounts.upcoming, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Ongoing', value: eventStatusCounts.ongoing, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
        { label: 'Completed', value: eventStatusCounts.completed, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },\r
        { label: 'Draft', value: eventStatusCounts.draft, color: 'linear-gradient(180deg, #64748b, #475569)' },\r
      ], 160)}\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function dashEmployee() {\r
      const changesQuery = (sessionStorage.getItem('employee_changes_search') || '').toLowerCase();\r
      const changes = DB.notifications.filter(item => {\r
        const text = \`\${item.title || ''} \${item.msg || ''} \${item.time || ''}\`.toLowerCase();\r
        return !changesQuery || text.includes(changesQuery);\r
      }).slice(0, 12);\r
      const requests = (DB.employeeChangeRequests || []).filter(request => request.status === 'pending');\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Employee Dashboard</div><div class="page-sub">Track recent changes and review requests from users.</div></div>\r
  </div>\r
  <div class="grid-3 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🔄</div><div class="stat-value" style="color:var(--accent)">\${changes.length}</div><div class="stat-label">Recent Changes</div><div class="stat-sub neutral">Matching activity</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📩</div><div class="stat-value" style="color:var(--yellow)">\${requests.length}</div><div class="stat-label">Change Requests</div><div class="stat-sub neutral">Awaiting review</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">\${DB.users.filter(user => user.role !== 'superuser').length}</div><div class="stat-label">Managed Users</div><div class="stat-sub neutral">Account records</div></div>\r
  </div>\r
  <div class="grid-2" style="gap:20px;align-items:start">\r
    <div>\r
      <div class="h4 mb-12">Recent Changes</div>\r
      <div class="search-box input-group" style="margin-bottom:14px"><span class="input-icon">🔍</span><input class="form-control" id="employee-changes-search" placeholder="Search recent changes…" value="\${changesQuery}" oninput="searchEmployeeChanges(this.value)"></div>\r
      <div id="employee-recent-changes" style="display:flex;flex-direction:column;gap:10px;max-height:520px;overflow-y:auto;padding-right:6px">\${buildEmployeeChanges(changes)}</div>\r
    </div>\r
    <div>\r
      <div class="h4 mb-12">Requests To Change Details</div>\r
      <div style="display:flex;flex-direction:column;gap:12px">\r
        \${requests.length === 0 ? \`<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">No pending requests</div><p class="empty-desc">Requests to change event or user details will appear here.</p></div>\` : requests.map(request => \`<div class="card" style="border-left:3px solid var(--yellow)">\r
          <div class="flex justify-between items-start gap-8"><div><div style="font-weight:700;color:var(--text)">\${request.type === 'event' ? '📅 Event Details' : '👤 User Details'}</div><div class="small" style="margin-top:4px">\${request.targetName}</div></div><span class="badge badge-yellow">Pending</span></div>\r
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin:12px 0">\${request.requestedChange}</div>\r
          <div class="small" style="color:var(--text3);margin-bottom:12px">Requested by \${request.requester} · \${request.submittedAt}</div>\r
          <button class="btn btn-success btn-sm" onclick="completeEmployeeChangeRequest('\${request.id}')">✓ Mark Done</button>\r
        </div>\`).join('')}\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function dashDepartmentEmployee() {\r
      const type = CU.employeeType;\r
      if (type === 'SUPPORT_FINANCE') return dashSupportFinance();\r
      if (type === 'EVENT_OPERATIONS') return dashEventOperations();\r
      if (type === 'REGISTRATION_VERIFICATION') return dashRegistrationVerification();\r
      return \`<div class="page-hd"><div class="page-hd-left"><div class="page-title">Employee Dashboard</div></div></div>\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  EMPLOYEE 1: REGISTRATION & VERIFICATION EXECUTIVE\r
    // ════════════════════════════════════════════════\r
\r
    function dashRegistrationVerification() {\r
      const regs = DB.registrations || [];\r
      const users = DB.users || [];\r
      const userQueries = DB.userQueries || [];\r
\r
      const totalRegs = regs.length;\r
      const pendingRegs = regs.filter(r => r.status === 'pending' || r.verificationStatus === 'Pending Review' || r.verificationStatus === 'Pending' || !r.verified).length;\r
      const confirmedRegs = regs.filter(r => r.status === 'confirmed' || r.verificationStatus === 'Verified').length;\r
      const registeredUsers = users.filter(u => u.role !== 'superuser').length;\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Registration &amp; User Management Dashboard</div>\r
            <div class="page-sub">Online attendee registration, user account management, and support request tracking for \${CU.name}.</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-4 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📝</div>\r
            <div class="stat-value" style="color:var(--accent)">\${totalRegs}</div>\r
            <div class="stat-label">Total Registrations</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>\r
            <div class="stat-value" style="color:var(--yellow)">\${pendingRegs}</div>\r
            <div class="stat-label">Pending Registrations</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>\r
            <div class="stat-value" style="color:var(--green)">\${confirmedRegs}</div>\r
            <div class="stat-label">Confirmed Registrations</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">👥</div>\r
            <div class="stat-value" style="color:var(--blue)">\${registeredUsers}</div>\r
            <div class="stat-label">Registered Users</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-2 gap-20">\r
          <div class="card">\r
            <div class="flex justify-between items-center mb-14">\r
              <div class="h4">Recent Online Registrations</div>\r
              <button class="btn btn-ghost btn-xs" onclick="goNav('registrations')">View All →</button>\r
            </div>\r
            <div style="display:flex;flex-direction:column;gap:10px">\r
              \${regs.slice(0, 5).map(r => {\r
        const u = users.find(user => String(user.id) === String(r.attendeeId)) || { name: 'Attendee' };\r
        const e = DB.events.find(ev => String(ev.id) === String(r.eventId)) || { title: 'Event' };\r
        const verifStatus = r.verificationStatus || (r.status === 'confirmed' ? 'Verified' : 'Pending Review');\r
        return \`\r
                  <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center">\r
                    <div>\r
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${u.name}</div>\r
                      <div class="small muted">\${e.title} · \${r.ticketId || r.id}</div>\r
                    </div>\r
                    <span class="badge badge-\${verifStatus === 'Verified' ? 'green' : verifStatus === 'Flagged' ? 'yellow' : 'purple'}">\${verifStatus}</span>\r
                  </div>\r
                \`;\r
      }).join('') || '<div class="empty">No registrations found</div>'}\r
            </div>\r
          </div>\r
\r
          <div class="card">\r
            <div class="flex justify-between items-center mb-14">\r
              <div class="h4">User Queries &amp; Support Escalations</div>\r
              <button class="btn btn-ghost btn-xs" onclick="openUserQueriesModal()">Manage Requests →</button>\r
            </div>\r
            <div style="display:flex;flex-direction:column;gap:10px">\r
              \${userQueries.slice(0, 5).map(q => \`\r
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center gap-10">\r
                  <div class="flex items-center gap-10" style="flex:1;min-width:0">\r
                    <span style="font-size:18px">\${q.type === 'Account Deletion' ? '🗑️' : q.type === 'Email Change' ? '✉️' : q.type === 'Escalated Support' ? '🎧' : '👤'}</span>\r
                    <div style="flex:1;min-width:0">\r
                      <div class="flex items-center gap-6 mb-2">\r
                        <span style="font-weight:700;font-size:13px;color:var(--text)" class="truncate">\${q.userName}</span>\r
                        <span class="badge badge-\${q.type === 'Account Deletion' ? 'red' : q.type === 'Email Change' ? 'blue' : q.type === 'Escalated Support' ? 'purple' : 'gray'}" style="font-size:10px;padding:1px 6px">\${q.type}</span>\r
                      </div>\r
                      <div class="small muted truncate">\${q.subject}</div>\r
                    </div>\r
                  </div>\r
                  <div class="flex items-center gap-8" style="flex-shrink:0">\r
                    <span class="badge badge-\${q.status === 'Resolved' ? 'green' : q.status === 'In Progress' ? 'purple' : 'yellow'}">\${q.status}</span>\r
                    <button class="btn btn-ghost btn-xs" onclick="openQueryActionModal('\${q.id}')">Review</button>\r
                  </div>\r
                </div>\r
              \`).join('') || '<div class="empty">No user queries or support escalations</div>'}\r
            </div>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function openUserQueriesModal() {\r
      const userQueries = DB.userQueries || [];\r
      openModal('Manage User Requests & Support Escalations', \`\r
        <div class="small muted mb-14">Review user profile queries, account modification/deletion requests, and escalated tickets from Employee 3 (Customer Support).</div>\r
        <div style="display:flex;flex-direction:column;gap:12px;max-height:420px;overflow-y:auto;padding-right:4px">\r
          \${userQueries.map(q => \`\r
            <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface2)">\r
              <div class="flex justify-between items-start mb-6">\r
                <div>\r
                  <div style="font-weight:700;font-size:14px;color:var(--text)">\${q.userName} <span class="small muted">(\${q.userEmail})</span></div>\r
                  <div class="small muted">Source: <strong>\${q.source}</strong> · \${q.date}</div>\r
                </div>\r
                <span class="badge badge-\${q.status === 'Resolved' ? 'green' : q.status === 'In Progress' ? 'purple' : 'yellow'}">\${q.status}</span>\r
              </div>\r
              <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:4px">🏷️ \${q.type}: \${q.subject}</div>\r
              <p style="font-size:12.5px;color:var(--text2);margin-bottom:10px;line-height:1.5">\${q.detail}</p>\r
              <div class="flex justify-between items-center">\r
                <div class="small mono muted">ID: \${q.id}</div>\r
                <div class="flex gap-6">\r
                  \${q.status !== 'Resolved' ? \`\r
                    <button class="btn btn-success btn-xs" onclick="closeModal();resolveQueryDirect('\${q.id}')">✓ Mark Solved</button>\r
                    <button class="btn btn-danger btn-xs" onclick="closeModal();rejectQueryDirect('\${q.id}')">✕ Reject</button>\r
                  \` : '<span class="small muted">Resolved</span>'}\r
                </div>\r
              </div>\r
            </div>\r
          \`).join('') || '<div class="empty">No user queries found.</div>'}\r
        </div>\r
      \`, []);\r
    }\r
\r
    function openQueryActionModal(queryId) {\r
      const q = (DB.userQueries || []).find(item => item.id === queryId);\r
      if (!q) return;\r
      openModal(\`Request \${q.id}: \${q.type}\`, \`\r
        <div class="info-row"><span class="info-label">User Name</span><span class="info-value"><strong>\${q.userName}</strong></span></div>\r
        <div class="info-row"><span class="info-label">Email Address</span><span class="info-value">\${q.userEmail}</span></div>\r
        <div class="info-row"><span class="info-label">Source</span><span class="info-value">\${q.source}</span></div>\r
        <div class="info-row"><span class="info-label">Request Type</span><span class="info-value"><span class="badge badge-purple">\${q.type}</span></span></div>\r
        <div class="info-row"><span class="info-label">Current Status</span><span class="info-value"><span class="badge badge-\${q.status === 'Resolved' ? 'green' : 'yellow'}">\${q.status}</span></span></div>\r
        <div class="info-row"><span class="info-label">Submitted On</span><span class="info-value">\${q.date}</span></div>\r
        <div class="mt-14">\r
          <div class="label mb-6">Request Description / Escalation Notes</div>\r
          <p style="font-size:13.5px;color:var(--text2);line-height:1.6;background:var(--surface2);padding:12px;border-radius:8px;border:1px solid var(--border)">\r
            \${q.detail}\r
          </p>\r
        </div>\r
      \`, q.status !== 'Resolved' ? [\r
        { lbl: 'Mark Solved / Resolve', cls: 'btn-success', fn: \`closeModal();resolveQueryDirect('\${q.id}')\` },\r
        { lbl: 'Reject Request', cls: 'btn-danger', fn: \`closeModal();rejectQueryDirect('\${q.id}')\` }\r
      ] : []);\r
    }\r
\r
    function resolveQueryDirect(queryId) {\r
      const q = (DB.userQueries || []).find(item => item.id === queryId);\r
      if (!q) return;\r
      q.status = 'Resolved';\r
      saveDB();\r
      renderPage('dashboard');\r
      toast('User request marked as solved and resolved!', 'success');\r
    }\r
\r
    function rejectQueryDirect(queryId) {\r
      confirm2('Reject Request', 'Are you sure you want to reject this request?', () => {\r
        const q = (DB.userQueries || []).find(item => item.id === queryId);\r
        if (!q) return;\r
        q.status = 'Rejected';\r
        saveDB();\r
        renderPage('dashboard');\r
        toast('User request rejected.', 'info');\r
      });\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  EVENT OPERATIONS EXECUTIVE (EMPLOYEE 2)\r
    // ════════════════════════════════════════════════\r
\r
    function dashEventOperations() {\r
      const events = DB.events || [];\r
      const tasks = DB.eventOperationsTasks || [];\r
      const reports = DB.eventOpsReports || [];\r
      const todayStr = new Date().toISOString().split('T')[0];\r
\r
      const totalEvents = events.length;\r
\r
      // Active events: published/active/ongoing/upcoming AND not cancelled/completed\r
      const activeEvents = events.filter(e => {\r
        const st = (e.status || '').toLowerCase();\r
        return ['published', 'active', 'ongoing', 'upcoming'].includes(st);\r
      }).length;\r
\r
      // Pending events: pending or draft\r
      const pendingEvents = events.filter(e => {\r
        const st = (e.status || '').toLowerCase();\r
        return st === 'pending' || st === 'draft';\r
      }).length;\r
\r
      // Upcoming events list: active/upcoming events sorted by date\r
      const upcomingEventsList = events.filter(e => {\r
        const st = (e.status || '').toLowerCase();\r
        return ['upcoming', 'published', 'active', 'ongoing'].includes(st);\r
      });\r
\r
      // Realistic mix of activities\r
      const eventActivities = events.map(e => ({\r
        title: \`Event Approved / Status: \${formatEventStatus(e.status)}\`,\r
        detail: \`\${e.title || e.name} · Category: \${e.category || 'General'} · Date: \${e.date}\`,\r
        icon: '🗓️',\r
        time: 'Recently'\r
      }));\r
\r
      const taskActivities = tasks.map(t => ({\r
        title: \`Operational Issue \${t.id}: \${t.type}\`,\r
        detail: \`\${t.eventTitle} · Status: \${t.status} · Priority: \${t.priority}\`,\r
        icon: '⚙️',\r
        time: t.updated\r
      }));\r
\r
      const reportActivities = reports.map(r => ({\r
        title: \`Report Submitted: \${r.title}\`,\r
        detail: \`\${r.type} · Status: \${r.status} · File: \${r.fileName || 'Report.pdf'}\`,\r
        icon: '📄',\r
        time: r.updated\r
      }));\r
\r
      const recentActivity = [\r
        eventActivities[0],\r
        taskActivities[0],\r
        reportActivities[0],\r
        taskActivities[1],\r
        eventActivities[1]\r
      ].filter(Boolean);\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Event Operations Dashboard</div>\r
            <div class="page-sub">Operational overview and event management for \${CU.name}.</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-4 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div>\r
            <div class="stat-value" style="color:var(--accent)">\${totalEvents}</div>\r
            <div class="stat-label">Total Events</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">▶️</div>\r
            <div class="stat-value" style="color:var(--green)">\${activeEvents}</div>\r
            <div class="stat-label">Active Events</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>\r
            <div class="stat-value" style="color:var(--yellow)">\${pendingEvents}</div>\r
            <div class="stat-label">Pending Events</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📅</div>\r
            <div class="stat-value" style="color:var(--blue)">\${upcomingEventsList.length}</div>\r
            <div class="stat-label">Upcoming Events</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-2 gap-20">\r
          <div class="card">\r
            <div class="flex justify-between items-center mb-14">\r
              <div class="h4">Upcoming Events (\${upcomingEventsList.length})</div>\r
              <button class="btn btn-ghost btn-xs" onclick="goNav('events')">View All Events →</button>\r
            </div>\r
            <div style="display:flex;flex-direction:column;gap:12px;max-height:420px;overflow-y:auto;padding-right:4px">\r
              \${upcomingEventsList.slice(0, 6).map(e => {\r
        const isFull = (e.registered || 0) >= (e.capacity || 100);\r
        return \`\r
                  <div style="padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface2)">\r
                    <div class="flex justify-between items-start mb-6">\r
                      <div style="font-weight:700;font-size:14px;color:var(--text)">\${e.title || e.name}</div>\r
                      <span class="badge badge-\${eventOpsStatusBadge(e.status)}">\${formatEventStatus(e.status)}</span>\r
                    </div>\r
                    <div class="small muted mb-8">📍 \${e.venue || e.location || 'TBD'} (\${e.city || 'Main Hall'}) · 📅 \${e.date} · 🏷️ \${e.category || 'General'}</div>\r
                    <div class="flex justify-between items-center">\r
                      <div class="small">Capacity: <strong>\${e.registered || 0}/\${e.capacity || 100}</strong> \${isFull ? '<span class="badge badge-yellow" style="font-size:10px;padding:2px 6px;margin-left:4px">Registration Full</span>' : ''}</div>\r
                      <button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')">View Details</button>\r
                    </div>\r
                  </div>\r
                \`;\r
      }).join('') || '<div class="empty">No upcoming events found</div>'}\r
            </div>\r
          </div>\r
\r
          <div class="card">\r
            <div class="h4 mb-14">Recent Event Activity</div>\r
            <div style="display:flex;flex-direction:column;gap:10px">\r
              \${recentActivity.map(act => \`\r
                <div class="flex items-center gap-10" style="padding:10px 0;border-bottom:1px solid var(--border)">\r
                  <span style="font-size:20px">\${act.icon}</span>\r
                  <div style="flex:1">\r
                    <div style="font-weight:600;font-size:13px">\${act.title}</div>\r
                    <div class="small muted">\${act.detail}</div>\r
                  </div>\r
                  <span class="small muted" style="white-space:nowrap">\${act.time}</span>\r
                </div>\r
              \`).join('') || '<div class="empty">No recent activity</div>'}\r
            </div>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function pageEventOpsEvents() {\r
      const query = (sessionStorage.getItem('eventops_events_query') || '').toLowerCase();\r
      const statusFilter = sessionStorage.getItem('eventops_events_status') || '';\r
      const categoryFilter = sessionStorage.getItem('eventops_events_category') || '';\r
\r
      const events = DB.events || [];\r
\r
      const filtered = events.filter(e => {\r
        const title = (e.title || e.name || '').toLowerCase();\r
        const venue = (e.venue || e.location || '').toLowerCase();\r
        const city = (e.city || '').toLowerCase();\r
        const cat = (e.category || '').toLowerCase();\r
        const matchesQuery = !query || title.includes(query) || venue.includes(query) || city.includes(query) || cat.includes(query);\r
\r
        let st = formatEventStatus(e.status).toLowerCase();\r
        let normFilter = statusFilter.toLowerCase();\r
        let matchesStatus = !normFilter || st === normFilter;\r
\r
        const matchesCat = !categoryFilter || e.category === categoryFilter;\r
\r
        return matchesQuery && matchesStatus && matchesCat;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Events Management</div>\r
            <div class="page-sub">Review pending events, edit details, and update operational statuses.</div>\r
          </div>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="eventops-q" placeholder="Search events by title, venue, city..." value="\${query}" oninput="refreshEventOpsEvents()">\r
          </div>\r
          <select class="form-control filter-select" id="eventops-st" onchange="refreshEventOpsEvents()">\r
            <option value="">All Statuses</option>\r
            <option value="Pending" \${statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>\r
            <option value="Active" \${statusFilter === 'Active' ? 'selected' : ''}>Active</option>\r
            <option value="Completed" \${statusFilter === 'Completed' ? 'selected' : ''}>Completed</option>\r
            <option value="Cancelled" \${statusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>\r
          </select>\r
          <select class="form-control filter-select" id="eventops-cat" onchange="refreshEventOpsEvents()">\r
            <option value="">All Categories</option>\r
            <option value="Technology" \${categoryFilter === 'Technology' ? 'selected' : ''}>Technology</option>\r
            <option value="Conference" \${categoryFilter === 'Conference' ? 'selected' : ''}>Conference</option>\r
            <option value="Corporate" \${categoryFilter === 'Corporate' ? 'selected' : ''}>Corporate</option>\r
            <option value="Finance" \${categoryFilter === 'Finance' ? 'selected' : ''}>Finance</option>\r
            <option value="Workshop" \${categoryFilter === 'Workshop' ? 'selected' : ''}>Workshop</option>\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Event</th>\r
                  <th>Category</th>\r
                  <th>Date &amp; Venue</th>\r
                  <th>Capacity</th>\r
                  <th>Status</th>\r
                  <th>Change Status</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.map(e => {\r
        const currentStatus = formatEventStatus(e.status);\r
        const isPending = currentStatus === 'Pending';\r
        const isFull = (e.registered || 0) >= (e.capacity || 100);\r
\r
        return \`\r
                    <tr>\r
                      <td>\r
                        <div style="font-weight:700;font-size:14px;color:var(--text)">\${e.title || e.name}</div>\r
                        <div class="small muted">ID: \${e.id}</div>\r
                      </td>\r
                      <td><span class="badge badge-purple">\${e.category || 'General'}</span></td>\r
                      <td>\r
                        <div>📅 \${e.date || 'TBD'}</div>\r
                        <div class="small muted">📍 \${e.venue || e.location || 'TBD'} (\${e.city || 'India'})</div>\r
                      </td>\r
                      <td>\r
                        <div><strong>\${e.registered || 0}</strong> / \${e.capacity || 100}</div>\r
                        <div class="small muted">\${isFull ? '<span style="color:var(--yellow);font-weight:600">Registration Full</span>' : (e.price ? '₹' + e.price : 'Free')}</div>\r
                      </td>\r
                      <td>\r
                        <span class="badge badge-\${eventOpsStatusBadge(e.status)}">\${currentStatus}</span>\r
                      </td>\r
                      <td>\r
                        <select class="form-control form-control-sm" style="padding:4px 8px;font-size:12px" onchange="setEventOpsStatus('\${e.id}', this.value)">\r
                          <option value="Pending" \${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>\r
                          <option value="Active" \${currentStatus === 'Active' ? 'selected' : ''}>Active</option>\r
                          <option value="Completed" \${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>\r
                          <option value="Cancelled" \${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>\r
                        </select>\r
                      </td>\r
                      <td>\r
                        <div class="flex items-center gap-6">\r
                          <button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')" title="View Details">👁️</button>\r
                          <button class="btn btn-ghost btn-xs" onclick="openEditEventModal('\${e.id}')" title="Edit Event">✏️</button>\r
                          <button class="btn btn-xs btn-danger" onclick="deleteEventOps('\${e.id}')" title="Delete Event">🗑️</button>\r
                          \${isPending ? \`\r
                            <button class="btn btn-success btn-xs" onclick="approveEventOpsDirect('\${e.id}')" title="Approve Event">✓</button>\r
                            <button class="btn btn-danger btn-xs" onclick="rejectEventOpsDirect('\${e.id}')" title="Reject Event">✕</button>\r
                          \` : ''}\r
                        </div>\r
                      </td>\r
                    </tr>\r
                  \`;\r
      }).join('') || '<tr><td colspan="7" class="text-center py-20">No matching events found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function deleteEventOps(eventId) {\r
      confirm2('Delete Event', 'Are you sure you want to delete this event record?', () => {\r
        DB.events = DB.events.filter(e => String(e.id) !== String(eventId));\r
        saveDB();\r
        renderPage('events');\r
        toast('Event deleted successfully', 'info');\r
      });\r
    }\r
\r
    function refreshEventOpsEvents() {\r
      sessionStorage.setItem('eventops_events_query', v('eventops-q'));\r
      sessionStorage.setItem('eventops_events_status', v('eventops-st'));\r
      sessionStorage.setItem('eventops_events_category', v('eventops-cat'));\r
      renderPage('events');\r
    }\r
\r
    function eventOpsStatusBadge(status) {\r
      const st = (status || '').toLowerCase();\r
      if (st === 'pending' || st === 'draft') return 'yellow';\r
      if (st === 'active' || st === 'ongoing' || st === 'published' || st === 'upcoming') return 'green';\r
      if (st === 'completed') return 'purple';\r
      if (st === 'cancelled') return 'red';\r
      return 'gray';\r
    }\r
\r
    function formatEventStatus(status) {\r
      const st = (status || '').toLowerCase();\r
      if (st === 'pending' || st === 'draft') return 'Pending';\r
      if (st === 'active' || st === 'ongoing' || st === 'published' || st === 'upcoming') return 'Active';\r
      if (st === 'completed') return 'Completed';\r
      if (st === 'cancelled') return 'Cancelled';\r
      return 'Active';\r
    }\r
\r
    function setEventOpsStatus(eventId, newStatus) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId));\r
      if (!e) return;\r
      const statusMap = {\r
        'Pending': 'pending',\r
        'Active': 'published',\r
        'Completed': 'completed',\r
        'Cancelled': 'cancelled'\r
      };\r
      e.status = statusMap[newStatus] || newStatus.toLowerCase();\r
      saveDB();\r
      renderPage('events');\r
      toast(\`Event status updated to \${newStatus}\`, 'success');\r
    }\r
\r
    function approveEventOpsDirect(eventId) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId));\r
      if (!e) return;\r
      e.status = 'published';\r
      saveDB();\r
      renderPage('events');\r
      toast('Event approved and set to Active!', 'success');\r
    }\r
\r
    function rejectEventOpsDirect(eventId) {\r
      confirm2('Reject Event', 'Are you sure you want to cancel/reject this pending event?', () => {\r
        const e = DB.events.find(ev => String(ev.id) === String(eventId));\r
        if (!e) return;\r
        e.status = 'cancelled';\r
        saveDB();\r
        renderPage('events');\r
        toast('Event has been rejected/cancelled.', 'info');\r
      });\r
    }\r
\r
    function pageEventOperationsWorkspace() {\r
      const query = (sessionStorage.getItem('eventops_tasks_query') || '').toLowerCase();\r
      const statusFilter = sessionStorage.getItem('eventops_tasks_status') || '';\r
      const priorityFilter = sessionStorage.getItem('eventops_tasks_priority') || '';\r
\r
      const tasks = DB.eventOperationsTasks || [];\r
\r
      const filtered = tasks.filter(t => {\r
        const matchesQuery = !query || t.eventTitle.toLowerCase().includes(query) || t.type.toLowerCase().includes(query) || t.id.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);\r
        const matchesStatus = !statusFilter || t.status === statusFilter;\r
        const matchesPriority = !priorityFilter || t.priority === priorityFilter;\r
        return matchesQuery && matchesStatus && matchesPriority;\r
      });\r
\r
      const pendingCount = tasks.filter(t => t.status === 'Pending').length;\r
      const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;\r
      const resolvedCount = tasks.filter(t => t.status === 'Resolved').length;\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Event Operations Workspace</div>\r
            <div class="page-sub">Review venue issues, schedule conflicts, info corrections, and operational tasks.</div>\r
          </div>\r
          <div class="page-hd-right">\r
            <button class="btn btn-primary" onclick="openCreateEventOpTaskModal()">➕ Add Operational Issue</button>\r
          </div>\r
        </div>\r
\r
        <div class="grid-4 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">⚙️</div>\r
            <div class="stat-value" style="color:var(--accent)">\${tasks.length}</div>\r
            <div class="stat-label">Total Issues</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>\r
            <div class="stat-value" style="color:var(--yellow)">\${pendingCount}</div>\r
            <div class="stat-label">Pending Reviews</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🔄</div>\r
            <div class="stat-value" style="color:var(--purple)">\${inProgressCount}</div>\r
            <div class="stat-label">In Progress</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>\r
            <div class="stat-value" style="color:var(--green)">\${resolvedCount}</div>\r
            <div class="stat-label">Resolved Issues</div>\r
          </div>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="taskops-q" placeholder="Search operational issues or events..." value="\${query}" oninput="refreshEventOpTasks()">\r
          </div>\r
          <select class="form-control filter-select" id="taskops-st" onchange="refreshEventOpTasks()">\r
            <option value="">All Statuses</option>\r
            <option value="Pending" \${statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>\r
            <option value="In Progress" \${statusFilter === 'In Progress' ? 'selected' : ''}>In Progress</option>\r
            <option value="Resolved" \${statusFilter === 'Resolved' ? 'selected' : ''}>Resolved</option>\r
          </select>\r
          <select class="form-control filter-select" id="taskops-pr" onchange="refreshEventOpTasks()">\r
            <option value="">All Priorities</option>\r
            <option value="High" \${priorityFilter === 'High' ? 'selected' : ''}>High</option>\r
            <option value="Medium" \${priorityFilter === 'Medium' ? 'selected' : ''}>Medium</option>\r
            <option value="Low" \${priorityFilter === 'Low' ? 'selected' : ''}>Low</option>\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Issue ID</th>\r
                  <th>Event Title</th>\r
                  <th>Issue Type</th>\r
                  <th>Priority</th>\r
                  <th>Status</th>\r
                  <th>Updated</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.map(t => \`\r
                  <tr>\r
                    <td class="mono"><strong>\${t.id}</strong></td>\r
                    <td>\r
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${t.eventTitle}</div>\r
                      <div class="small muted">\${t.description}</div>\r
                    </td>\r
                    <td><span class="badge badge-blue">\${t.type}</span></td>\r
                    <td>\r
                      <span class="badge badge-\${t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'yellow' : 'gray'}">\${t.priority}</span>\r
                    </td>\r
                    <td>\r
                      <span class="badge badge-\${t.status === 'Pending' ? 'yellow' : t.status === 'In Progress' ? 'purple' : 'green'}">\${t.status}</span>\r
                    </td>\r
                    <td class="small muted">\${t.updated}</td>\r
                    <td>\r
                      <div class="flex items-center gap-6">\r
                        <button class="btn btn-ghost btn-xs" onclick="openEventOpTaskModal('\${t.id}')">Review &amp; Update</button>\r
                      </div>\r
                    </td>\r
                  </tr>\r
                \`).join('') || '<tr><td colspan="7" class="text-center py-20">No operational issues found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshEventOpTasks() {\r
      sessionStorage.setItem('eventops_tasks_query', v('taskops-q'));\r
      sessionStorage.setItem('eventops_tasks_status', v('taskops-st'));\r
      sessionStorage.setItem('eventops_tasks_priority', v('taskops-pr'));\r
      renderPage('event-requests');\r
    }\r
\r
    function openEventOpTaskModal(taskId) {\r
      const t = DB.eventOperationsTasks.find(item => item.id === taskId);\r
      if (!t) return;\r
      openModal(\`Operational Issue: \${t.id}\`, \`\r
        <div class="info-row"><span class="info-label">Event</span><span class="info-value"><strong>\${t.eventTitle}</strong></span></div>\r
        <div class="info-row"><span class="info-label">Issue Type</span><span class="info-value">\${t.type}</span></div>\r
        <div class="info-row"><span class="info-label">Priority</span><span class="info-value">\${t.priority}</span></div>\r
        <div class="form-group mt-12">\r
          <label class="form-label">Issue Status</label>\r
          <select class="form-control" id="task-edit-status">\r
            <option \${t.status === 'Pending' ? 'selected' : ''}>Pending</option>\r
            <option \${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>\r
            <option \${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Description / Operational Notes</label>\r
          <textarea class="form-control" id="task-edit-desc" rows="4">\${t.description}</textarea>\r
        </div>\r
      \`, [\r
        { lbl: 'Save Changes', cls: 'btn-primary', fn: \`saveEventOpTask('\${t.id}')\` }\r
      ]);\r
    }\r
\r
    function saveEventOpTask(taskId) {\r
      const t = DB.eventOperationsTasks.find(item => item.id === taskId);\r
      if (!t) return;\r
      t.status = v('task-edit-status');\r
      t.description = v('task-edit-desc');\r
      t.updated = 'Just now';\r
      saveDB();\r
      closeModal();\r
      renderPage('event-requests');\r
      toast('Operational issue updated successfully!', 'success');\r
    }\r
\r
    function openCreateEventOpTaskModal() {\r
      const eventsOptions = DB.events.map(e => \`<option value="\${e.id}">\${e.title || e.name}</option>\`).join('');\r
      openModal('Add Operational Issue', \`\r
        <div class="form-group">\r
          <label class="form-label">Select Event *</label>\r
          <select class="form-control" id="newtask-eventid">\${eventsOptions}</select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Issue Type *</label>\r
          <select class="form-control" id="newtask-type">\r
            <option>Venue &amp; Capacity Review</option>\r
            <option>Schedule Conflict</option>\r
            <option>Equipment &amp; Tech Check</option>\r
            <option>Information Correction</option>\r
            <option>Security &amp; Access Audit</option>\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Priority</label>\r
          <select class="form-control" id="newtask-priority">\r
            <option>High</option>\r
            <option selected>Medium</option>\r
            <option>Low</option>\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Description / Issue Details *</label>\r
          <textarea class="form-control" id="newtask-desc" placeholder="Describe the operational issue..."></textarea>\r
        </div>\r
      \`, [\r
        { lbl: 'Add Issue', cls: 'btn-primary', fn: 'saveNewEventOpTask()' }\r
      ]);\r
    }\r
\r
    function saveNewEventOpTask() {\r
      const eventId = v('newtask-eventid');\r
      const type = v('newtask-type');\r
      const priority = v('newtask-priority');\r
      const desc = v('newtask-desc');\r
\r
      if (!desc) { toast('Please enter issue description', 'error'); return; }\r
\r
      const ev = DB.events.find(e => String(e.id) === String(eventId)) || { title: 'General Event' };\r
      const newTask = {\r
        id: \`EOP-\${Date.now().toString().slice(-4)}\`,\r
        eventId: eventId,\r
        eventTitle: ev.title || ev.name,\r
        type: type,\r
        priority: priority,\r
        status: 'Pending',\r
        description: desc,\r
        updated: 'Just now'\r
      };\r
\r
      if (!DB.eventOperationsTasks) DB.eventOperationsTasks = [];\r
      DB.eventOperationsTasks.unshift(newTask);\r
      saveDB();\r
      closeModal();\r
      renderPage('event-requests');\r
      toast('Operational issue created!', 'success');\r
    }\r
\r
    function supportUser(request) { return DB.users.find(user => String(user.id) === String(request.userId)) || { name: 'Unknown User', email: '—', phone: '—' }; }\r
    function supportEvent(request) { return DB.events.find(event => String(event.id) === String(request.eventId)) || { title: 'Unknown Event', date: '—' }; }\r
    function supportStatusBadge(status) { return { Pending: 'yellow', 'In Progress': 'purple', Resolved: 'green', Closed: 'gray' }[status] || 'gray'; }\r
    function dashSupportFinance() {\r
      const requests = DB.supportRequests || [], transactions = DB.financeTransactions || [], refunds = DB.financeRefunds || [], reports = DB.operationalReports || [];\r
      const todayStr = today();\r
      const todayTransactions = transactions.filter(item => item.date === todayStr).length;\r
      const totalTransactions = transactions.length;\r
      const displayTxnCount = todayTransactions > 0 ? todayTransactions : totalTransactions;\r
      const txnLabel = todayTransactions > 0 ? "Today's Transactions" : 'Total Transactions';\r
\r
      // Build balanced activity feed: 1 item per category first, then fill from remaining\r
      const reqActivities = requests.map(item => ({\r
        label: item.subject,\r
        detail: \`Support Request (\${item.id}) · \${item.status} · \${item.updated || item.created}\`,\r
        icon: '📩',\r
        sortKey: 0\r
      }));\r
      const refActivities = refunds.map(item => ({\r
        label: \`Refund \${item.id}\`,\r
        detail: \`Refund · \${item.status} · ₹\${item.amount.toLocaleString('en-IN')} · \${item.reason}\`,\r
        icon: '↩️',\r
        sortKey: 1\r
      }));\r
      const txnActivities = transactions.map(item => ({\r
        label: \`Transaction \${item.id}\`,\r
        detail: \`Payment · \${item.status} · ₹\${item.amount.toLocaleString('en-IN')} · \${item.date === todayStr ? 'Today' : item.date}\`,\r
        icon: '💳',\r
        sortKey: 2\r
      }));\r
      const rptActivities = reports.map(item => ({\r
        label: \`Report: \${item.title}\`,\r
        detail: \`\${item.type} · \${item.status} · \${item.updated}\`,\r
        icon: '📊',\r
        sortKey: 3\r
      }));\r
\r
      // Take 1 from each category first (balanced), then fill up to 6 with remaining\r
      const activity = [\r
        reqActivities[0], refActivities[0], txnActivities[0], rptActivities[0],\r
        reqActivities[1], refActivities[1]\r
      ].filter(Boolean).slice(0, 6);\r
\r
      return \`<div class="page-hd"><div class="page-hd-left"><div class="page-title">Customer Support &amp; Finance Dashboard</div><div class="page-sub">Operational overview for \${CU.name}.</div></div></div><div class="grid-4 mb-20">\${[\r
        ['📩', requests.filter(item => !['Resolved', 'Closed'].includes(item.status)).length, 'Open Support Requests', 'var(--accent)'],\r
        ['⚠️', requests.filter(item => item.status === 'Pending').length, 'Pending Issues', 'var(--yellow)'],\r
        ['💳', displayTxnCount, txnLabel, 'var(--green)'],\r
        ['↩️', refunds.filter(item => item.status === 'Requested' || item.status === 'Processing').length, 'Pending Refunds', 'var(--blue)']\r
      ].map(card => \`<div class="stat-card"><div class="stat-icon">\${card[0]}</div><div class="stat-value" style="color:\${card[3]}">\${card[1]}</div><div class="stat-label">\${card[2]}</div></div>\`).join('')}</div><div class="card"><div class="h4 mb-12">Recent Support &amp; Finance Activity</div><div style="display:flex;flex-direction:column;gap:10px">\${activity.map(item => \`<div class="flex items-center gap-10" style="padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:20px">\${item.icon}</span><div><div style="font-weight:600;font-size:13px">\${item.label}</div><div class="small">\${item.detail}</div></div></div>\`).join('') || '<div class="empty">No recent activity</div>'}</div></div>\`;\r
    }\r
\r
    function pageSupportCenter() {\r
      const query = (sessionStorage.getItem('support_query') || '').toLowerCase();\r
      const status = sessionStorage.getItem('support_status') || '';\r
      const requests = (DB.supportRequests || []).filter(item => {\r
        const user = supportUser(item), event = supportEvent(item);\r
        return (!status || item.status === status) && (!query || \`\${item.id} \${item.subject} \${item.message} \${user.name} \${user.email} \${event.title}\`.toLowerCase().includes(query));\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Support Center</div>\r
            <div class="page-sub">Manage user support requests with event and payment context. Route unresolvable issues to the appropriate department.</div>\r
          </div>\r
          <div class="page-hd-right">\r
            <button class="btn btn-primary" onclick="openRouteRequestModal()">🔀 Route Request</button>\r
          </div>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="support-query" placeholder="Search requests, users, or events..." value="\${query}" oninput="refreshSupportCenter()">\r
          </div>\r
          <select class="form-control filter-select" id="support-status" onchange="refreshSupportCenter()">\r
            <option value="">All Statuses</option>\r
            \${['Pending', 'In Progress', 'Resolved', 'Closed'].map(item => \`<option \${status === item ? 'selected' : ''}>\${item}</option>\`).join('')}\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Request</th>\r
                  <th>User</th>\r
                  <th>Event / Payment</th>\r
                  <th>Status</th>\r
                  <th>Updated</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${requests.map(item => {\r
        const user = supportUser(item), event = supportEvent(item);\r
        return \`\r
                    <tr>\r
                      <td>\r
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${item.subject}</div>\r
                        <div class="small muted">\${item.message}</div>\r
                      </td>\r
                      <td>\r
                        <div style="font-weight:600">\${user.name}</div>\r
                        <div class="small muted">\${user.email}</div>\r
                      </td>\r
                      <td>\r
                        <div style="font-weight:600">\${event.title}</div>\r
                        <div class="small muted">\${event.date} · Related transaction available</div>\r
                      </td>\r
                      <td><span class="badge badge-\${supportStatusBadge(item.status)}">\${item.status}</span></td>\r
                      <td class="small muted">\${item.updated}</td>\r
                      <td>\r
                        <div class="flex gap-6">\r
                          <button class="btn btn-ghost btn-xs" onclick="openSupportRequest('\${item.id}')">View / Respond</button>\r
                          <button class="btn btn-ghost btn-xs" style="border-color:var(--purple);color:var(--purple)" onclick="openRouteRequestModal('\${item.id}')">🔀 Route</button>\r
                        </div>\r
                      </td>\r
                    </tr>\r
                  \`;\r
      }).join('') || '<tr><td colspan="6" class="text-center py-20 muted">No support requests found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function openRouteRequestModal(prefillId) {\r
      const supportReqs = DB.supportRequests || [];\r
      const reqOptions = supportReqs.map(r => {\r
        const u = supportUser(r);\r
        return \`<option value="\${r.id}" \${prefillId === r.id ? 'selected' : ''}>\${r.id} — \${r.subject} (\${u.name})</option>\`;\r
      }).join('');\r
\r
      // Determine prefill values if a request ID was passed\r
      let prefillUser = '', prefillEmail = '', prefillDesc = '', prefillEvent = '';\r
      let autoRouteTo = '';\r
      if (prefillId) {\r
        const item = supportReqs.find(r => r.id === prefillId);\r
        if (item) {\r
          const u = supportUser(item);\r
          const e = supportEvent(item);\r
          prefillUser = u.name || '';\r
          prefillEmail = u.email || '';\r
          prefillDesc = item.message || '';\r
          prefillEvent = e.title && e.title !== 'Unknown Event' ? e.title : '';\r
          // Auto-suggest route based on subject keywords\r
          const subjectLow = (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();\r
          const emp1Keywords = ['registration', 'account', 'duplicate', 'verification', 'user', 'profile', 'email', 'login', 'password', 'access'];\r
          const emp2Keywords = ['event', 'venue', 'schedule', 'location', 'capacity', 'slot', 'cancel', 'speaker', 'av', 'equipment'];\r
          if (emp2Keywords.some(k => subjectLow.includes(k))) autoRouteTo = 'Employee 2 – Event Operations Executive';\r
          else if (emp1Keywords.some(k => subjectLow.includes(k))) autoRouteTo = 'Employee 1 – Registration & Verification Executive';\r
        }\r
      }\r
\r
      openModal('🔀 Route Support Request', \`\r
        <div style="background:var(--surface2);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text2);border-left:3px solid var(--purple)">\r
          <strong style="color:var(--purple)">Routing Policy:</strong> Route <strong>user/account/registration/verification</strong> issues to Employee 1. Route <strong>event/venue/schedule/operational</strong> issues to Employee 2. Finance/payment issues are handled directly by you.\r
        </div>\r
\r
        <div class="form-group">\r
          <label class="form-label">Select Request ID (optional)</label>\r
          <select class="form-control" id="route-req-id" onchange="prefillRouteForm(this.value)">\r
            <option value="">— New / Manual Route —</option>\r
            \${reqOptions}\r
          </select>\r
        </div>\r
\r
        <div class="grid-2 gap-12">\r
          <div class="form-group">\r
            <label class="form-label">User Name *</label>\r
            <input class="form-control" id="route-user-name" placeholder="Full name" value="\${prefillUser}">\r
          </div>\r
          <div class="form-group">\r
            <label class="form-label">User Email *</label>\r
            <input class="form-control" id="route-user-email" placeholder="user@email.com" value="\${prefillEmail}">\r
          </div>\r
        </div>\r
\r
        <div class="form-group">\r
          <label class="form-label">Request Category *</label>\r
          <select class="form-control" id="route-category">\r
            <option>User Account Issue</option>\r
            <option>Duplicate Account / Merge</option>\r
            <option>Registration Problem</option>\r
            <option>Identity Verification Issue</option>\r
            <option>Event Information Query</option>\r
            <option>Venue / Location Issue</option>\r
            <option>Schedule Conflict / Change</option>\r
            <option>Event Capacity / Slot Issue</option>\r
            <option>Event Cancellation / Update Request</option>\r
            <option>Operational Issue</option>\r
            <option>Other</option>\r
          </select>\r
        </div>\r
\r
        <div class="form-group">\r
          <label class="form-label">Request Description *</label>\r
          <textarea class="form-control" id="route-description" rows="3" placeholder="Describe the issue in detail...">\${prefillDesc}</textarea>\r
        </div>\r
\r
        <div class="form-group">\r
          <label class="form-label">Related Event (if applicable)</label>\r
          <input class="form-control" id="route-event" placeholder="Event name or ID" value="\${prefillEvent}">\r
        </div>\r
\r
        <div class="grid-2 gap-12">\r
          <div class="form-group">\r
            <label class="form-label">Priority *</label>\r
            <select class="form-control" id="route-priority">\r
              <option value="Low">🟢 Low</option>\r
              <option value="Medium" selected>🟡 Medium</option>\r
              <option value="High">🔴 High</option>\r
            </select>\r
          </div>\r
          <div class="form-group">\r
            <label class="form-label">Route To *</label>\r
            <select class="form-control" id="route-to">\r
              <option value="Employee 1 – Registration &amp; Verification Executive" \${autoRouteTo === 'Employee 1 – Registration & Verification Executive' ? 'selected' : ''}>Employee 1 – Registration &amp; Verification Executive</option>\r
              <option value="Employee 2 – Event Operations Executive" \${autoRouteTo === 'Employee 2 – Event Operations Executive' ? 'selected' : ''}>Employee 2 – Event Operations Executive</option>\r
            </select>\r
          </div>\r
        </div>\r
\r
        <div class="form-group">\r
          <label class="form-label">Internal Note (visible to recipient)</label>\r
          <textarea class="form-control" id="route-note" rows="2" placeholder="Add context for the receiving department..."></textarea>\r
        </div>\r
      \`, [\r
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },\r
        { lbl: '🔀 Route Request', cls: 'btn-primary', fn: 'saveRouteRequest()' }\r
      ]);\r
    }\r
\r
    window.prefillRouteForm = function (reqId) {\r
      if (!reqId) return;\r
      const item = (DB.supportRequests || []).find(r => r.id === reqId);\r
      if (!item) return;\r
      const u = supportUser(item);\r
      const e = supportEvent(item);\r
      const nameEl = document.getElementById('route-user-name');\r
      const emailEl = document.getElementById('route-user-email');\r
      const descEl = document.getElementById('route-description');\r
      const eventEl = document.getElementById('route-event');\r
      const routeToEl = document.getElementById('route-to');\r
      if (nameEl) nameEl.value = u.name || '';\r
      if (emailEl) emailEl.value = u.email || '';\r
      if (descEl) descEl.value = item.message || '';\r
      if (eventEl && e.title && e.title !== 'Unknown Event') eventEl.value = e.title;\r
      // Auto-suggest routing\r
      if (routeToEl) {\r
        const subjectLow = (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();\r
        const emp2Keywords = ['event', 'venue', 'schedule', 'location', 'capacity', 'slot', 'cancel', 'speaker', 'av', 'equipment'];\r
        const emp1Keywords = ['registration', 'account', 'duplicate', 'verification', 'user', 'profile', 'email', 'login', 'password'];\r
        if (emp2Keywords.some(k => subjectLow.includes(k))) routeToEl.value = 'Employee 2 – Event Operations Executive';\r
        else if (emp1Keywords.some(k => subjectLow.includes(k))) routeToEl.value = 'Employee 1 – Registration & Verification Executive';\r
      }\r
    };\r
\r
    function saveRouteRequest() {\r
      const userName = v('route-user-name');\r
      const userEmail = v('route-user-email');\r
      const category = v('route-category');\r
      const description = v('route-description');\r
      const priority = v('route-priority');\r
      const routeTo = v('route-to');\r
      const note = v('route-note');\r
      const relatedEvent = v('route-event');\r
      const reqId = v('route-req-id');\r
\r
      if (!userName) { toast('Please enter the user name', 'error'); return; }\r
      if (!description) { toast('Please enter a request description', 'error'); return; }\r
\r
      const routedId = 'RT-' + Date.now().toString().slice(-6);\r
      const isEmp2 = routeTo.includes('Employee 2');\r
      const isEmp1 = routeTo.includes('Employee 1');\r
\r
      // Build the routed request record\r
      const routedReq = {\r
        id: routedId,\r
        linkedRequestId: reqId || null,\r
        userName: userName,\r
        userEmail: userEmail,\r
        category: category,\r
        description: description,\r
        relatedEvent: relatedEvent || null,\r
        priority: priority,\r
        routeTo: routeTo,\r
        note: note,\r
        source: 'Escalated by Emp 3',\r
        raisedBy: 'Customer Support (Emp 3)',\r
        status: 'Pending',\r
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) + ' · ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),\r
        routedAt: 'Just now'\r
      };\r
\r
      if (!DB.routedRequests) DB.routedRequests = [];\r
      DB.routedRequests.unshift(routedReq);\r
\r
      // Make visible to Employee 1 (userQueries) if routed to Emp 1\r
      if (isEmp1) {\r
        if (!DB.userQueries) DB.userQueries = [];\r
        DB.userQueries.unshift({\r
          id: routedId,\r
          userId: null,\r
          userName: userName,\r
          userEmail: userEmail,\r
          type: category,\r
          subject: \`[Routed by Emp 3] \${category}\`,\r
          detail: description + (note ? '\\n\\nInternal Note: ' + note : '') + (relatedEvent ? '\\nRelated Event: ' + relatedEvent : ''),\r
          source: 'Employee 3 Escalation',\r
          status: 'Pending',\r
          priority: priority,\r
          date: routedReq.date\r
        });\r
      }\r
\r
      // Make visible to Employee 2 (eventOpsRequests) if routed to Emp 2\r
      if (isEmp2) {\r
        if (!DB.eventOpsRequests) DB.eventOpsRequests = [];\r
        // find matching eventId if possible\r
        const matchedEvent = relatedEvent ? (DB.events || []).find(e => (e.title || e.name || '').toLowerCase().includes(relatedEvent.toLowerCase())) : null;\r
        DB.eventOpsRequests.unshift({\r
          id: routedId,\r
          eventId: matchedEvent ? matchedEvent.id : null,\r
          eventTitle: relatedEvent || 'N/A',\r
          issue: description + (note ? '\\n\\nInternal Note: ' + note : ''),\r
          source: 'Escalated by Emp 3',\r
          raisedBy: \`\${userName} (via Customer Support)\`,\r
          priority: priority,\r
          status: 'Pending',\r
          date: routedReq.date,\r
          notes: note || ''\r
        });\r
      }\r
\r
      // Mark linked support request as In Progress if selected\r
      if (reqId) {\r
        const linked = (DB.supportRequests || []).find(r => r.id === reqId);\r
        if (linked && linked.status === 'Pending') {\r
          linked.status = 'In Progress';\r
          linked.response = \`Routed to \${routeTo} on \${routedReq.date}. Awaiting resolution.\`;\r
          linked.updated = 'Just now';\r
        }\r
      }\r
\r
      saveDB();\r
      closeModal();\r
      renderPage('support-center');\r
      toast(\`Request routed to \${isEmp2 ? 'Employee 2 (Event Operations)' : 'Employee 1 (Registration & Verification)'} successfully!\`, 'success');\r
    }\r
\r
    function refreshSupportCenter() {\r
      sessionStorage.setItem('support_query', v('support-query'));\r
      sessionStorage.setItem('support_status', v('support-status'));\r
      renderPage('support-center');\r
    }\r
    function openSupportRequest(id) {\r
      const item = DB.supportRequests.find(request => request.id === id);\r
      if (!item) return;\r
      const user = supportUser(item), event = supportEvent(item), transaction = (DB.financeTransactions || []).find(record => String(record.userId) === String(item.userId) && String(record.eventId) === String(item.eventId));\r
      openModal(\`Support Request \${item.id}\`, \`\r
        <div class="info-row"><span class="info-label">User</span><span class="info-value">\${user.name} · \${user.email}</span></div>\r
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">\${event.title} · \${event.date}</span></div>\r
        <div class="info-row"><span class="info-label">Payment</span><span class="info-value">\${transaction ? \`\${transaction.id} · ₹\${transaction.amount} · \${transaction.status}\` : 'No matching transaction'}</span></div>\r
        <div class="info-row"><span class="info-label">Request</span><span class="info-value">\${item.subject}</span></div>\r
        <p class="muted" style="line-height:1.6;margin:16px 0">\${item.message}</p>\r
        <div class="form-group">\r
          <label class="form-label">Status</label>\r
          <select class="form-control" id="support-edit-status">\r
            \${['Pending', 'In Progress', 'Resolved', 'Closed'].map(value => \`<option \${value === item.status ? 'selected' : ''}>\${value}</option>\`).join('')}\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Response</label>\r
          <textarea class="form-control" id="support-response" rows="4">\${item.response || ''}</textarea>\r
        </div>\r
      \`, [\r
        { lbl: '🔀 Route This Request', cls: 'btn-ghost', fn: \`closeModal();openRouteRequestModal('\${id}')\` },\r
        { lbl: 'Save Response', cls: 'btn-primary', fn: \`saveSupportRequest('\${id}')\` }\r
      ]);\r
    }\r
    function saveSupportRequest(id) {\r
      const item = DB.supportRequests.find(request => request.id === id);\r
      if (!item) return;\r
      item.status = v('support-edit-status');\r
      item.response = v('support-response');\r
      item.updated = 'Just now';\r
      saveDB();\r
      closeModal();\r
      renderPage('support-center');\r
      toast('Support request updated', 'success');\r
    }\r
\r
    function financeStatusBadge(status) { return { Successful: 'green', Pending: 'yellow', Failed: 'red', Requested: 'yellow', Processing: 'purple', Completed: 'green', Rejected: 'red' }[status] || 'gray'; }\r
    function pageFinanceCenter() {\r
      const tab = sessionStorage.getItem('finance_tab') || 'transactions';\r
      const query = (sessionStorage.getItem('finance_query') || '').toLowerCase();\r
      const commissionRate = 0.15;\r
      const allTransactions = Array.isArray(DB.financeTransactions) ? DB.financeTransactions : [];\r
      const refundRecords = Array.isArray(DB.financeRefunds) ? DB.financeRefunds : [];\r
      const paidRegistrations = (DB.registrations || []).filter(reg => String(reg.payment || '').toLowerCase() === 'paid' && ['confirmed', 'verified'].includes(String(reg.status || '').toLowerCase()));\r
      const successfulTransactions = paidRegistrations.length ? paidRegistrations : allTransactions.filter(tx => String(tx.status || '').toLowerCase() === 'successful' && Number(tx.amount || 0) > 0);\r
      const totalRevenue = successfulTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);\r
      const platformCommission = totalRevenue * commissionRate;\r
      const organizerPayout = totalRevenue - platformCommission;\r
\r
      const records = tab === 'transactions' ? allTransactions : refundRecords;\r
      const filtered = records.filter(item => {\r
        const user = DB.users.find(u => String(u.id) === String(item.userId)) || {};\r
        const event = DB.events.find(e => String(e.id) === String(item.eventId)) || {};\r
        const text = \`\${item.id || ''} \${user.name || ''} \${user.email || ''} \${event.title || ''} \${item.status || ''} \${item.reason || ''}\`.toLowerCase();\r
        return !query || text.includes(query);\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Finance &amp; Revenue</div>\r
            <div class="page-sub">Track registration revenue, platform commission, organizer payouts, and customer payment activity.</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-4 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>\r
            <div class="stat-value" style="color:var(--green)">₹\${totalRevenue.toLocaleString('en-IN')}</div>\r
            <div class="stat-label">Total Registration Revenue</div>\r
            <div class="stat-sub neutral">Successful attendee payments</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>\r
            <div class="stat-value" style="color:var(--accent)">₹\${platformCommission.toLocaleString('en-IN')}</div>\r
            <div class="stat-label">Platform Commission</div>\r
            <div class="stat-sub neutral">Fixed 15% fee share</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💸</div>\r
            <div class="stat-value" style="color:var(--yellow)">₹\${organizerPayout.toLocaleString('en-IN')}</div>\r
            <div class="stat-label">Organizer Payouts</div>\r
            <div class="stat-sub neutral">Net payout after commission</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🧾</div>\r
            <div class="stat-value" style="color:var(--purple)">\${successfulTransactions.length}</div>\r
            <div class="stat-label">Successful Transactions</div>\r
            <div class="stat-sub neutral">Monitored payment records</div>\r
          </div>\r
        </div>\r
\r
        <div class="card" style="margin-bottom:20px">\r
          <div class="flex justify-between items-center mb-12">\r
            <div class="h4">Event-wise Revenue &amp; Commission</div>\r
            <div class="small muted">Commission formula: registration fee × 15%</div>\r
          </div>\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Event</th>\r
                  <th>Attendees</th>\r
                  <th>Gross Revenue</th>\r
                  <th>Platform Commission</th>\r
                  <th>Organizer Payout</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${(() => {\r
                  const eventSummary = {};\r
                  successfulTransactions.forEach(tx => {\r
                    const event = DB.events.find(e => String(e.id) === String(tx.eventId)) || { title: 'Unknown Event' };\r
                    const eventKey = String(tx.eventId || event.title);\r
                    if (!eventSummary[eventKey]) {\r
                      eventSummary[eventKey] = {\r
                        eventTitle: event.title,\r
                        attendeeCount: 0,\r
                        revenue: 0\r
                      };\r
                    }\r
                    eventSummary[eventKey].attendeeCount += 1;\r
                    eventSummary[eventKey].revenue += Number(tx.amount || 0);\r
                  });\r
                  const rows = Object.values(eventSummary);\r
                  return rows.length\r
                    ? rows.map(row => {\r
                        const commission = row.revenue * commissionRate;\r
                        const payout = row.revenue - commission;\r
                        return \`\r
                          <tr>\r
                            <td>\${row.eventTitle}</td>\r
                            <td>\${row.attendeeCount}</td>\r
                            <td style="color:var(--green);font-weight:700">₹\${row.revenue}</td>\r
                            <td style="color:var(--accent);font-weight:700">₹\${commission}</td>\r
                            <td style="color:var(--yellow);font-weight:700">₹\${payout}</td>\r
                          </tr>\r
                        \`;\r
                      }).join('')\r
                    : '<tr><td colspan="5" class="text-center py-20">No successful event revenue data found.</td></tr>';\r
                })()}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
\r
        <div style="display:flex;gap:6px;margin-bottom:16px">\r
          <button class="btn \${tab === 'transactions' ? 'btn-primary' : 'btn-ghost'}" onclick="switchFinanceTab('transactions')">💳 Transactions</button>\r
          <button class="btn \${tab === 'refunds' ? 'btn-primary' : 'btn-ghost'}" onclick="switchFinanceTab('refunds')">↩️ Refunds</button>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="finance-query" placeholder="Search finance records..." value="\${query}" oninput="refreshFinanceCenter()">\r
          </div>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                \${tab === 'transactions' ? '<tr><th>Transaction ID</th><th>User</th><th>Event</th><th>Amount</th><th>Payment Status</th><th>Date</th></tr>' : '<tr><th>Refund ID</th><th>User</th><th>Event</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>'}\r
              </thead>\r
              <tbody>\r
                \${filtered.map(item => {\r
                  const user = DB.users.find(u => String(u.id) === String(item.userId)) || { name: 'Unknown' };\r
                  const event = DB.events.find(e => String(e.id) === String(item.eventId)) || { title: 'Unknown Event' };\r
                  return tab === 'transactions'\r
                    ? \`<tr><td class="mono">\${item.id}</td><td>\${user.name}</td><td>\${event.title}</td><td style="color:var(--green);font-weight:700">₹\${item.amount}</td><td><span class="badge badge-\${financeStatusBadge(item.status)}">\${item.status}</span></td><td>\${item.date}</td></tr>\`\r
                    : \`<tr><td class="mono">\${item.id}</td><td>\${user.name}</td><td>\${event.title}</td><td style="color:var(--green);font-weight:700">₹\${item.amount}</td><td>\${item.reason}</td><td><span class="badge badge-\${financeStatusBadge(item.status)}">\${item.status}</span></td><td>\${item.date}</td></tr>\`;\r
                }).join('') || \`<tr><td colspan="\${tab === 'transactions' ? 6 : 7}" class="text-center py-20">No finance records found.</td></tr>\`}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
    function switchFinanceTab(tab) { sessionStorage.setItem('finance_tab', tab); renderPage('finance'); }\r
    function refreshFinanceCenter() { sessionStorage.setItem('finance_query', v('finance-query')); renderPage('finance'); }\r
\r
    function pageRegistrationsForEmployee() {\r
      const query = (sessionStorage.getItem('emp_reg_query') || '').toLowerCase();\r
      const statusFilter = sessionStorage.getItem('emp_reg_status') || '';\r
\r
      const regs = DB.registrations || [];\r
\r
      const filtered = regs.filter(r => {\r
        const attendee = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: '', email: '' };\r
        const event = DB.events.find(e => String(e.id) === String(r.eventId)) || { title: '' };\r
\r
        const searchStr = \`\${r.id} \${r.ticketId || ''} \${attendee.name} \${attendee.email} \${event.title}\`.toLowerCase();\r
        const matchesQuery = !query || searchStr.includes(query);\r
\r
        const st = (r.status || 'confirmed').toLowerCase();\r
        let matchesStatus = true;\r
        if (statusFilter === 'pending') matchesStatus = st === 'pending';\r
        else if (statusFilter === 'confirmed') matchesStatus = st === 'confirmed' || st === 'verified';\r
        else if (statusFilter === 'rejected') matchesStatus = st === 'rejected';\r
\r
        return matchesQuery && matchesStatus;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Registrations Management</div>\r
            <div class="page-sub">View, search, filter, and manage online event registrations.</div>\r
          </div>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="emp-reg-q" placeholder="Search by Ticket ID, Attendee, or Event..." value="\${query}" oninput="refreshEmpRegistrations()">\r
          </div>\r
          <select class="form-control filter-select" id="emp-reg-st" onchange="refreshEmpRegistrations()">\r
            <option value="">All Statuses</option>\r
            <option value="confirmed" \${statusFilter === 'confirmed' ? 'selected' : ''}>Confirmed / Verified</option>\r
            <option value="pending" \${statusFilter === 'pending' ? 'selected' : ''}>Pending</option>\r
            <option value="rejected" \${statusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Ticket / Reg ID</th>\r
                  <th>Attendee</th>\r
                  <th>Event</th>\r
                  <th>Registration Date</th>\r
                  <th>Payment Status</th>\r
                  <th>Status</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.map(reg => {\r
        const attendee = DB.users.find(u => String(u.id) === String(reg.attendeeId)) || { name: 'Unknown User', email: '—' };\r
        const event = DB.events.find(e => String(e.id) === String(reg.eventId)) || { title: 'Unknown Event' };\r
        const isPending = reg.status === 'pending';\r
\r
        return \`\r
                    <tr>\r
                      <td class="mono"><strong>\${reg.ticketId || reg.id}</strong></td>\r
                      <td>\r
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${attendee.name}</div>\r
                        <div class="small muted">\${attendee.email}</div>\r
                      </td>\r
                      <td>\${event.title}</td>\r
                      <td>\${reg.date || 'Today'}</td>\r
                      <td>\r
                        <span class="badge badge-\${reg.payment === 'paid' ? 'green' : 'yellow'}">\${reg.payment === 'paid' ? 'Paid (₹' + (reg.amount || 0) + ')' : 'Pending'}</span>\r
                      </td>\r
                      <td>\r
                        <span class="badge badge-\${reg.status === 'confirmed' ? 'green' : reg.status === 'pending' ? 'yellow' : 'red'}">\${reg.status || 'confirmed'}</span>\r
                      </td>\r
                      <td>\r
                        <div class="flex items-center gap-6">\r
                          <button class="btn btn-ghost btn-xs" onclick="openRegistrationDetailModal('\${reg.id}')">Review</button>\r
                          \${isPending ? \`\r
                            <button class="btn btn-success btn-xs" onclick="approveRegistrationDirect('\${reg.id}')" title="Approve">✓</button>\r
                            <button class="btn btn-danger btn-xs" onclick="rejectRegistrationDirect('\${reg.id}')" title="Reject">✕</button>\r
                          \` : ''}\r
                        </div>\r
                      </td>\r
                    </tr>\r
                  \`;\r
      }).join('') || '<tr><td colspan="7" class="text-center py-20">No matching registrations found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshEmpRegistrations() {\r
      sessionStorage.setItem('emp_reg_query', v('emp-reg-q'));\r
      sessionStorage.setItem('emp_reg_status', v('emp-reg-st'));\r
      renderPage('registrations');\r
    }\r
\r
    function approveRegistrationDirect(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      r.status = 'confirmed';\r
      r.verificationStatus = 'Verified';\r
      r.verified = true;\r
      saveDB();\r
      renderPage('registrations');\r
      toast('Registration approved successfully!', 'success');\r
    }\r
\r
    function rejectRegistrationDirect(regId) {\r
      confirm2('Reject Registration', 'Are you sure you want to reject this online registration?', () => {\r
        const r = DB.registrations.find(item => String(item.id) === String(regId));\r
        if (!r) return;\r
        r.status = 'rejected';\r
        r.verificationStatus = 'Rejected';\r
        saveDB();\r
        renderPage('registrations');\r
        toast('Registration rejected.', 'info');\r
      });\r
    }\r
\r
    function openRegistrationDetailModal(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      const attendee = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: 'Unknown User', email: '—', phone: '—' };\r
      const event = DB.events.find(e => String(e.id) === String(r.eventId)) || { title: 'Unknown Event' };\r
\r
      openModal(\`Registration Details: \${r.ticketId || r.id}\`, \`\r
        <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-value mono">\${r.ticketId || r.id}</span></div>\r
        <div class="info-row"><span class="info-label">Attendee Name</span><span class="info-value"><strong>\${attendee.name}</strong></span></div>\r
        <div class="info-row"><span class="info-label">Attendee Email</span><span class="info-value">\${attendee.email}</span></div>\r
        <div class="info-row"><span class="info-label">Contact Phone</span><span class="info-value">\${attendee.phone || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">\${event.title}</span></div>\r
        <div class="info-row"><span class="info-label">Registration Date</span><span class="info-value">\${r.date || 'Today'}</span></div>\r
        <div class="info-row"><span class="info-label">Payment Amount</span><span class="info-value" style="color:var(--green);font-weight:700">₹\${r.amount || 0} (\${r.payment || 'paid'})</span></div>\r
        <div class="info-row"><span class="info-label">Verification Status</span><span class="info-value"><span class="badge badge-\${r.status === 'confirmed' ? 'green' : 'yellow'}">\${r.verificationStatus || r.status || 'confirmed'}</span></span></div>\r
      \`, [\r
        { lbl: 'Approve', cls: 'btn-success', fn: \`closeModal();approveRegistrationDirect('\${r.id}')\` },\r
        { lbl: 'Reject', cls: 'btn-danger', fn: \`closeModal();rejectRegistrationDirect('\${r.id}')\` }\r
      ]);\r
    }\r
\r
    function pageUserManagement() {\r
      const query = (sessionStorage.getItem('usrmgt_query') || '').toLowerCase();\r
      const roleFilter = sessionStorage.getItem('usrmgt_role') || '';\r
\r
      const users = DB.users || [];\r
\r
      // Detect Duplicate Users by email or phone\r
      const emailCounts = {};\r
      const phoneCounts = {};\r
      users.forEach(u => {\r
        if (u.email) {\r
          const em = u.email.toLowerCase();\r
          emailCounts[em] = (emailCounts[em] || 0) + 1;\r
        }\r
        if (u.phone && u.phone !== '—') {\r
          phoneCounts[u.phone] = (phoneCounts[u.phone] || 0) + 1;\r
        }\r
      });\r
\r
      const duplicateUsers = users.filter(u => {\r
        const em = (u.email || '').toLowerCase();\r
        const ph = u.phone || '';\r
        return (emailCounts[em] > 1) || (ph !== '—' && phoneCounts[ph] > 1);\r
      });\r
\r
      const filtered = users.filter(u => {\r
        const matchesQuery = !query || \`\${u.name} \${u.email} \${u.phone} \${u.role} \${u.id}\`.toLowerCase().includes(query);\r
        const matchesRole = !roleFilter || u.role === roleFilter;\r
        return matchesQuery && matchesRole;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">User Management</div>\r
            <div class="page-sub">View, update, detect duplicate accounts, and safely manage platform users.</div>\r
          </div>\r
        </div>\r
\r
        \${duplicateUsers.length > 0 ? \`\r
          <div style="padding:14px 18px;background:rgba(234,179,8,0.12);border:1px solid var(--yellow);border-radius:10px;margin-bottom:20px" class="flex justify-between items-center">\r
            <div class="flex items-center gap-10">\r
              <span style="font-size:22px">⚠️</span>\r
              <div>\r
                <div style="font-weight:700;color:var(--yellow);font-size:14px">Duplicate Accounts Detected</div>\r
                <div class="small muted">\${duplicateUsers.length} user records share matching email addresses or contact numbers.</div>\r
              </div>\r
            </div>\r
            <button class="btn btn-warning btn-sm" onclick="openDuplicateUsersModal()">🔍 Review &amp; Resolve Duplicates</button>\r
          </div>\r
        \` : ''}\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="usrmgt-q" placeholder="Search users by name, email, phone, role..." value="\${query}" oninput="refreshUserManagement()">\r
          </div>\r
          <select class="form-control filter-select" id="usrmgt-role" onchange="refreshUserManagement()">\r
            <option value="">All Roles</option>\r
            <option value="attendee" \${roleFilter === 'attendee' ? 'selected' : ''}>Attendee</option>\r
            <option value="client" \${roleFilter === 'client' ? 'selected' : ''}>Client</option>\r
            <option value="organizer" \${roleFilter === 'organizer' ? 'selected' : ''}>Organizer</option>\r
            <option value="staff" \${roleFilter === 'staff' ? 'selected' : ''}>Staff</option>\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>User ID &amp; Name</th>\r
                  <th>Contact Info</th>\r
                  <th>Role</th>\r
                  <th>Verification</th>\r
                  <th>Account Status</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.map(u => {\r
        const em = (u.email || '').toLowerCase();\r
        const isDup = emailCounts[em] > 1 || (u.phone && phoneCounts[u.phone] > 1);\r
        const isDeactivated = u.status === 'deactivated' || u.status === 'inactive';\r
\r
        return \`\r
                    <tr style="\${isDup ? 'background:rgba(234,179,8,0.04)' : ''}">\r
                      <td>\r
                        <div class="flex items-center gap-10">\r
                          <div class="av av-xs">\${u.avatar || u.name[0]}</div>\r
                          <div>\r
                            <div style="font-weight:700;font-size:14px;color:var(--text)">\${u.name} \${isDup ? '<span class="badge badge-yellow" style="font-size:10px;padding:1px 5px">Duplicate</span>' : ''}</div>\r
                            <div class="small muted">ID: \${u.id}</div>\r
                          </div>\r
                        </div>\r
                      </td>\r
                      <td>\r
                        <div>\${u.email}</div>\r
                        <div class="small muted">📞 \${u.phone || '—'}</div>\r
                      </td>\r
                      <td><span class="badge badge-purple">\${u.role}</span></td>\r
                      <td>\r
                        <span class="badge badge-\${u.status === 'active' ? 'green' : 'yellow'}">\${u.status === 'active' ? 'Verified' : 'Pending'}</span>\r
                      </td>\r
                      <td>\r
                        <span class="badge badge-\${isDeactivated ? 'red' : 'green'}">\${isDeactivated ? 'Deactivated' : 'Active'}</span>\r
                      </td>\r
                      <td>\r
                        <div class="flex items-center gap-6">\r
                          <button class="btn btn-ghost btn-xs" onclick="openEditUserModal('\${u.id}')" title="Edit Details">✏️ Edit</button>\r
                          <button class="btn btn-ghost btn-xs" onclick="toggleUserStatus('\${u.id}')" title="Deactivate/Activate">\${isDeactivated ? '🔓 Activate' : '🔒 Deactivate'}</button>\r
                          <button class="btn btn-xs btn-danger" onclick="deleteUserOps('\${u.id}')" title="Delete User">🗑️</button>\r
                        </div>\r
                      </td>\r
                    </tr>\r
                  \`;\r
      }).join('') || '<tr><td colspan="6" class="text-center py-20">No matching users found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshUserManagement() {\r
      sessionStorage.setItem('usrmgt_query', v('usrmgt-q'));\r
      sessionStorage.setItem('usrmgt_role', v('usrmgt-role'));\r
      renderPage('attendees');\r
    }\r
\r
    function openEditUserModal(userId) {\r
      const u = DB.users.find(user => String(user.id) === String(userId));\r
      if (!u) return;\r
      openModal(\`Edit User: \${u.name}\`, \`\r
        <div class="form-group">\r
          <label class="form-label">Full Name *</label>\r
          <input class="form-control" id="edit-usr-name" value="\${u.name}">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Email Address *</label>\r
          <input class="form-control" id="edit-usr-email" value="\${u.email}">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Phone Number</label>\r
          <input class="form-control" id="edit-usr-phone" value="\${u.phone || ''}">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">User Role</label>\r
          <select class="form-control" id="edit-usr-role">\r
            <option value="attendee" \${u.role === 'attendee' ? 'selected' : ''}>Attendee</option>\r
            <option value="client" \${u.role === 'client' ? 'selected' : ''}>Client</option>\r
            <option value="organizer" \${u.role === 'organizer' ? 'selected' : ''}>Organizer</option>\r
            <option value="staff" \${u.role === 'staff' ? 'selected' : ''}>Staff</option>\r
          </select>\r
        </div>\r
      \`, [\r
        { lbl: 'Save Changes', cls: 'btn-primary', fn: \`saveEditUser('\${u.id}')\` }\r
      ]);\r
    }\r
\r
    function saveEditUser(userId) {\r
      const u = DB.users.find(user => String(user.id) === String(userId));\r
      if (!u) return;\r
      const name = v('edit-usr-name');\r
      const email = v('edit-usr-email');\r
      if (!name || !email) { toast('Name and email are required', 'error'); return; }\r
      u.name = name;\r
      u.email = email;\r
      u.phone = v('edit-usr-phone');\r
      u.role = v('edit-usr-role');\r
      saveDB();\r
      closeModal();\r
      renderPage('attendees');\r
      toast('User details updated!', 'success');\r
    }\r
\r
    function toggleUserStatus(userId) {\r
      const u = DB.users.find(user => String(user.id) === String(userId));\r
      if (!u) return;\r
      const newStatus = (u.status === 'deactivated' || u.status === 'inactive') ? 'active' : 'deactivated';\r
      u.status = newStatus;\r
      saveDB();\r
      renderPage('attendees');\r
      toast(\`User status changed to \${newStatus}\`, 'info');\r
    }\r
\r
    function deleteUserOps(userId) {\r
      confirm2('Delete User', 'Are you sure you want to permanently delete this user record?', () => {\r
        DB.users = DB.users.filter(u => String(u.id) !== String(userId));\r
        saveDB();\r
        renderPage('attendees');\r
        toast('User deleted successfully', 'info');\r
      });\r
    }\r
\r
    function openDuplicateUsersModal() {\r
      const users = DB.users || [];\r
      const emailCounts = {};\r
      users.forEach(u => {\r
        if (u.email) {\r
          const em = u.email.toLowerCase();\r
          emailCounts[em] = (emailCounts[em] || 0) + 1;\r
        }\r
      });\r
      const dupes = users.filter(u => emailCounts[(u.email || '').toLowerCase()] > 1);\r
\r
      openModal('Review Duplicate Accounts', \`\r
        <div class="small muted mb-14">The following accounts share identical email addresses. You can deactivate secondary duplicate accounts to resolve conflicts.</div>\r
        <div style="display:flex;flex-direction:column;gap:10px">\r
          \${dupes.map(u => \`\r
            <div style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center">\r
              <div>\r
                <div style="font-weight:700;font-size:13.5px">\${u.name} <span class="mono small muted">(\${u.id})</span></div>\r
                <div class="small muted">\${u.email} · Phone: \${u.phone || '—'}</div>\r
              </div>\r
              <button class="btn btn-warning btn-xs" onclick="closeModal();toggleUserStatus('\${u.id}')">Deactivate Secondary</button>\r
            </div>\r
          \`).join('') || '<div class="empty">No duplicate accounts found.</div>'}\r
        </div>\r
      \`, []);\r
    }\r
\r
    function pageAttendeeVerification() {\r
      const query = (sessionStorage.getItem('verif_query') || '').toLowerCase();\r
      const statusFilter = sessionStorage.getItem('verif_status') || '';\r
\r
      const regs = DB.registrations || [];\r
\r
      const filtered = regs.filter(r => {\r
        const attendee = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: '', email: '' };\r
        const event = DB.events.find(e => String(e.id) === String(r.eventId)) || { title: '' };\r
\r
        const searchStr = \`\${r.id} \${r.ticketId || ''} \${attendee.name} \${attendee.email} \${event.title}\`.toLowerCase();\r
        const matchesQuery = !query || searchStr.includes(query);\r
\r
        const verifStatus = r.verificationStatus || (r.status === 'confirmed' ? 'Verified' : 'Pending Review');\r
        let matchesStatus = !statusFilter || verifStatus === statusFilter;\r
\r
        return matchesQuery && matchesStatus;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Online Registration Verification</div>\r
            <div class="page-sub">Review submitted registration details, approve identity verifications online, and flag incomplete submissions.</div>\r
          </div>\r
        </div>\r
\r
        <div style="padding:12px 16px;background:var(--accent-dim);border:1px solid var(--accent);border-radius:8px;margin-bottom:20px;font-size:13px;color:var(--text)" class="flex items-center gap-10">\r
          <span>ℹ️</span>\r
          <span>Online Admin Workspace: Focuses strictly on online identity and registration detail verification. Physical check-in and venue scanning are handled on-site.</span>\r
        </div>\r
\r
        <div class="filter-row">\r
          <div class="search-box input-group">\r
            <span class="input-icon">🔍</span>\r
            <input class="form-control" id="verif-q" placeholder="Search by Ticket ID, Attendee Name, or Event..." value="\${query}" oninput="refreshVerificationPage()">\r
          </div>\r
          <select class="form-control filter-select" id="verif-st" onchange="refreshVerificationPage()">\r
            <option value="">All Verification Statuses</option>\r
            <option value="Pending Review" \${statusFilter === 'Pending Review' ? 'selected' : ''}>Pending Review</option>\r
            <option value="Verified" \${statusFilter === 'Verified' ? 'selected' : ''}>Verified</option>\r
            <option value="Flagged" \${statusFilter === 'Flagged' ? 'selected' : ''}>Flagged / Incomplete</option>\r
            <option value="Rejected" \${statusFilter === 'Rejected' ? 'selected' : ''}>Rejected</option>\r
          </select>\r
        </div>\r
\r
        <div class="card">\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Registration ID</th>\r
                  <th>Attendee Info</th>\r
                  <th>Event</th>\r
                  <th>Submitted Proof / ID Document</th>\r
                  <th>Verification Status</th>\r
                  <th>Actions</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.map(r => {\r
        const attendee = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: 'Unknown User', email: '—', phone: '—' };\r
        const event = DB.events.find(e => String(e.id) === String(r.eventId)) || { title: 'Unknown Event' };\r
        const currentVerif = r.verificationStatus || (r.status === 'confirmed' ? 'Verified' : 'Pending Review');\r
        const isPending = currentVerif === 'Pending Review' || currentVerif === 'Pending';\r
        const docType = r.docType || 'Govt Aadhaar / Passport ID';\r
        const docRef = r.docRef || 'REF-' + String(r.id).padStart(4, '0');\r
\r
        return \`\r
                    <tr>\r
                      <td class="mono"><strong>\${r.ticketId || r.id}</strong></td>\r
                      <td>\r
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${attendee.name}</div>\r
                        <div class="small muted">\${attendee.email}</div>\r
                      </td>\r
                      <td>\${event.title}</td>\r
                      <td>\r
                        <div style="font-weight:600;font-size:13px;color:var(--accent)">📄 \${docType}</div>\r
                        <div class="small mono muted">Ref: \${docRef}</div>\r
                      </td>\r
                      <td>\r
                        <span class="badge badge-\${currentVerif === 'Verified' ? 'green' : currentVerif === 'Flagged' ? 'yellow' : currentVerif === 'Rejected' ? 'red' : 'purple'}">\${currentVerif}</span>\r
                      </td>\r
                      <td>\r
                        <div class="flex items-center gap-6">\r
                          <button class="btn btn-ghost btn-xs" onclick="openVerificationReviewModal('\${r.id}')">Review</button>\r
                          \${isPending ? \`\r
                            <button class="btn btn-success btn-xs" onclick="approveVerificationDirect('\${r.id}')" title="Verify Online">✓ Verify</button>\r
                            <button class="btn btn-warning btn-xs" onclick="flagVerificationModal('\${r.id}')" title="Flag Incomplete">🚩 Flag</button>\r
                          \` : ''}\r
                        </div>\r
                      </td>\r
                    </tr>\r
                  \`;\r
      }).join('') || '<tr><td colspan="6" class="text-center py-20">No registration verification records found.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshVerificationPage() {\r
      sessionStorage.setItem('verif_query', v('verif-q'));\r
      sessionStorage.setItem('verif_status', v('verif-st'));\r
      renderPage('attendeeVerification');\r
    }\r
\r
    function approveVerificationDirect(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      r.verificationStatus = 'Verified';\r
      r.status = 'confirmed';\r
      r.verified = true;\r
      saveDB();\r
      renderPage('attendeeVerification');\r
      toast('Online registration verified successfully!', 'success');\r
    }\r
\r
    function flagVerificationModal(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      openModal(\`Flag Registration Details: \${r.ticketId || r.id}\`, \`\r
        <div class="form-group">\r
          <label class="form-label">Flag Reason / Missing Details *</label>\r
          <textarea class="form-control" id="flag-reason" rows="4" placeholder="Specify incomplete or incorrect registration information..."></textarea>\r
        </div>\r
      \`, [\r
        { lbl: 'Submit Flag', cls: 'btn-warning', fn: \`saveFlagVerification('\${r.id}')\` }\r
      ]);\r
    }\r
\r
    function saveFlagVerification(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      const reason = v('flag-reason');\r
      if (!reason) { toast('Please enter a flag reason', 'error'); return; }\r
      r.verificationStatus = 'Flagged';\r
      r.flagReason = reason;\r
      saveDB();\r
      closeModal();\r
      renderPage('attendeeVerification');\r
      toast('Registration flagged for review!', 'warning');\r
    }\r
\r
    function openVerificationReviewModal(regId) {\r
      const r = DB.registrations.find(item => String(item.id) === String(regId));\r
      if (!r) return;\r
      const attendee = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: 'Unknown User', email: '—', phone: '—' };\r
      const event = DB.events.find(e => String(e.id) === String(r.eventId)) || { title: 'Unknown Event' };\r
      const docType = r.docType || 'Govt Aadhaar / Passport ID';\r
      const docRef = r.docRef || 'REF-' + String(r.id).padStart(4, '0');\r
\r
      openModal(\`Verification Review: \${r.ticketId || r.id}\`, \`\r
        <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-value mono">\${r.ticketId || r.id}</span></div>\r
        <div class="info-row"><span class="info-label">Attendee Name</span><span class="info-value"><strong>\${attendee.name}</strong></span></div>\r
        <div class="info-row"><span class="info-label">Attendee Email</span><span class="info-value">\${attendee.email}</span></div>\r
        <div class="info-row"><span class="info-label">Contact Phone</span><span class="info-value">\${attendee.phone || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">\${event.title}</span></div>\r
        <div class="info-row"><span class="info-label">Submitted Document</span><span class="info-value" style="color:var(--accent);font-weight:700">📄 \${docType} (\${docRef})</span></div>\r
        <div class="info-row"><span class="info-label">Verification Status</span><span class="info-value"><span class="badge badge-purple">\${r.verificationStatus || 'Pending Review'}</span></span></div>\r
        \${r.notes ? \`<div class="mt-12"><div class="label mb-6">Verification Notes</div><div style="padding:10px;background:var(--surface2);border-radius:8px;font-size:13px">\${r.notes}</div></div>\` : ''}\r
        \${r.flagReason ? \`<div class="mt-12"><div class="label mb-6">Flag Reason / Missing Details</div><div style="padding:10px;background:var(--surface2);border-radius:8px;color:var(--yellow);font-size:13px">\${r.flagReason}</div></div>\` : ''}\r
      \`, [\r
        { lbl: 'Approve & Verify', cls: 'btn-success', fn: \`closeModal();approveVerificationDirect('\${r.id}')\` },\r
        { lbl: 'Flag Information', cls: 'btn-warning', fn: \`closeModal();flagVerificationModal('\${r.id}')\` }\r
      ]);\r
    }\r
\r
    function pageRegVerificationReports() {\r
      const reports = DB.regReports || [];\r
      const typeFilter = sessionStorage.getItem('rvr_type') || '';\r
      const statusFilter = sessionStorage.getItem('rvr_status') || '';\r
\r
      const totalSubmitted = reports.filter(r => r.status === 'Submitted' || r.status === 'Reviewed').length;\r
      const pendingReports = reports.filter(r => r.status === 'Draft').length;\r
      const reviewedReports = reports.filter(r => r.status === 'Reviewed').length;\r
\r
      const filtered = reports.filter(r => {\r
        const matchType = !typeFilter || r.type === typeFilter;\r
        const matchStatus = !statusFilter || r.status === statusFilter;\r
        return matchType && matchStatus;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Registration &amp; User Management Reports</div>\r
            <div class="page-sub">Submit, view, and track registration and user management reports. Reports are submitted to Super Admin for review.</div>\r
          </div>\r
          <div class="page-hd-right">\r
            <button class="btn btn-primary" onclick="openCreateRegReportModal()">📤 Submit Report</button>\r
          </div>\r
        </div>\r
\r
        <div class="grid-3 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">📤</div>\r
            <div class="stat-value" style="color:var(--green)">\${totalSubmitted}</div>\r
            <div class="stat-label">Reports Submitted</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📝</div>\r
            <div class="stat-value" style="color:var(--yellow)">\${pendingReports}</div>\r
            <div class="stat-label">Draft / Pending</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">✅</div>\r
            <div class="stat-value" style="color:var(--accent)">\${reviewedReports}</div>\r
            <div class="stat-label">Reviewed by Admin</div>\r
          </div>\r
        </div>\r
\r
        <div class="card">\r
          <div class="flex justify-between items-center mb-16">\r
            <div class="h4">All Reports</div>\r
            <div class="flex gap-8">\r
              <select class="form-control filter-select" id="rvr-type" onchange="refreshRvrPage()" style="width:200px">\r
                <option value="">All Report Types</option>\r
                <option value="Registration Report" \${typeFilter === 'Registration Report' ? 'selected' : ''}>Registration Report</option>\r
                <option value="User Management Report" \${typeFilter === 'User Management Report' ? 'selected' : ''}>User Management Report</option>\r
                <option value="Registration Activity Report" \${typeFilter === 'Registration Activity Report' ? 'selected' : ''}>Registration Activity Report</option>\r
              </select>\r
              <select class="form-control filter-select" id="rvr-status" onchange="refreshRvrPage()" style="width:140px">\r
                <option value="">All Statuses</option>\r
                <option value="Draft" \${statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>\r
                <option value="Submitted" \${statusFilter === 'Submitted' ? 'selected' : ''}>Submitted</option>\r
                <option value="Reviewed" \${statusFilter === 'Reviewed' ? 'selected' : ''}>Reviewed</option>\r
              </select>\r
            </div>\r
          </div>\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Report</th>\r
                  <th>Type</th>\r
                  <th>Period</th>\r
                  <th>Attached File</th>\r
                  <th>Status</th>\r
                  <th>Last Updated</th>\r
                  <th>Action</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.length ? filtered.map(r => \`\r
                  <tr>\r
                    <td>\r
                      <div style="font-weight:700;font-size:13.5px;color:var(--text)">\${r.title}</div>\r
                      <div class="small muted">ID: \${r.id} · By: \${r.owner}</div>\r
                    </td>\r
                    <td>\r
                      <span class="badge badge-\${r.type === 'Registration Report' ? 'purple' : r.type === 'User Management Report' ? 'blue' : 'orange'}">\${r.type}</span>\r
                    </td>\r
                    <td class="small">\${r.period || '—'}</td>\r
                    <td>\r
                      \${r.fileName\r
          ? \`<span style="font-weight:600;color:var(--accent);font-size:12.5px">📄 \${r.fileName}</span>\`\r
          : \`<span class="small muted">No file attached</span>\`\r
        }\r
                    </td>\r
                    <td>\r
                      <span class="badge badge-\${r.status === 'Reviewed' ? 'green' : r.status === 'Submitted' ? 'purple' : 'yellow'}">\${r.status}</span>\r
                    </td>\r
                    <td class="small muted">\${r.updated}</td>\r
                    <td>\r
                      <div class="flex gap-6">\r
                        <button class="btn btn-ghost btn-xs" onclick="viewRegReportModal('\${r.id}')">View Details</button>\r
                        \${r.status === 'Draft' ? \`<button class="btn btn-primary btn-xs" onclick="submitDraftReport('\${r.id}')">📤 Submit</button>\` : ''}\r
                      </div>\r
                    </td>\r
                  </tr>\r
                \`).join('') : '<tr><td colspan="7" class="text-center py-20 muted">No reports found matching your filters.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshRvrPage() {\r
      sessionStorage.setItem('rvr_type', v('rvr-type'));\r
      sessionStorage.setItem('rvr_status', v('rvr-status'));\r
      renderPage('reports');\r
    }\r
\r
    function submitDraftReport(reportId) {\r
      const r = (DB.regReports || []).find(item => item.id === reportId);\r
      if (!r) return;\r
      if (!r.fileName) {\r
        toast('Please attach a file before submitting a draft report.', 'error');\r
        return;\r
      }\r
      r.status = 'Submitted';\r
      r.updated = 'Just now';\r
      saveDB();\r
      renderPage('reports');\r
      toast('Draft report submitted successfully!', 'success');\r
    }\r
\r
    function viewRegReportModal(reportId) {\r
      const r = (DB.regReports || []).find(item => item.id === reportId);\r
      if (!r) return;\r
      openModal(\`Report: \${r.title}\`, \`\r
        <div class="info-row"><span class="info-label">Report ID</span><span class="info-value mono">\${r.id}</span></div>\r
        <div class="info-row"><span class="info-label">Report Type</span><span class="info-value"><span class="badge badge-purple">\${r.type}</span></span></div>\r
        <div class="info-row"><span class="info-label">Reporting Period</span><span class="info-value">\${r.period || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Submitted By</span><span class="info-value">\${r.owner}</span></div>\r
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-\${r.status === 'Reviewed' ? 'green' : r.status === 'Submitted' ? 'purple' : 'yellow'}">\${r.status}</span></span></div>\r
        <div class="info-row"><span class="info-label">Last Updated</span><span class="info-value">\${r.updated}</span></div>\r
        <div class="info-row"><span class="info-label">Attached File</span><span class="info-value" style="color:var(--accent);font-weight:700">\${r.fileName ? '📄 ' + r.fileName : 'No file attached'}</span></div>\r
      \`, r.status === 'Draft' ? [\r
        { lbl: '📤 Submit Report', cls: 'btn-primary', fn: \`closeModal();submitDraftReport('\${r.id}')\` }\r
      ] : []);\r
    }\r
\r
    window.handleRegReportFileSelect = function (input) {\r
      const preview = document.getElementById('rv-file-preview');\r
      if (input.files && input.files[0]) {\r
        const f = input.files[0];\r
        if (preview) {\r
          preview.innerHTML = \`\r
            <div class="flex items-center justify-between" style="background:var(--accent-dim);border-radius:8px;padding:10px 14px">\r
              <div style="font-weight:600;color:var(--accent);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 \${f.name} (\${(f.size / 1024).toFixed(1)} KB)</div>\r
              <button type="button" class="btn btn-danger btn-xs" onclick="event.stopPropagation();resetRegReportFileSelect()">✕ Remove</button>\r
            </div>\r
          \`;\r
        }\r
      }\r
    };\r
\r
    window.resetRegReportFileSelect = function () {\r
      const input = document.getElementById('rv-file');\r
      if (input) input.value = '';\r
      const preview = document.getElementById('rv-file-preview');\r
      if (preview) {\r
        preview.innerHTML = \`\r
          <div style="font-size:24px;margin-bottom:6px">📁</div>\r
          <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>\r
          <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>\r
        \`;\r
      }\r
    };\r
\r
    function openCreateRegReportModal() {\r
      openModal('📤 Submit Registration & User Management Report', \`\r
        <div class="form-group">\r
          <label class="form-label">Report Type *</label>\r
          <select class="form-control" id="rv-type">\r
            <option value="Registration Report">Registration Report</option>\r
            <option value="User Management Report">User Management Report</option>\r
            <option value="Registration Activity Report">Registration Activity Report</option>\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Report Title *</label>\r
          <input class="form-control" id="rv-title" placeholder="e.g. August 2026 Online Registration Completion Report">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Reporting Period *</label>\r
          <input class="form-control" id="rv-period" placeholder="e.g. August 2026, Q3 2026, Week 34">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Upload Report *</label>\r
          <div class="file-upload-box" style="border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;background:var(--surface2);cursor:pointer" onclick="document.getElementById('rv-file').click()">\r
            <input type="file" id="rv-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="handleRegReportFileSelect(this)">\r
            <div id="rv-file-preview">\r
              <div style="font-size:24px;margin-bottom:6px">📁</div>\r
              <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>\r
              <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>\r
            </div>\r
          </div>\r
        </div>\r
      \`, [\r
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },\r
        { lbl: '📤 Submit Report', cls: 'btn-primary', fn: 'saveRegReportSubmit()' }\r
      ]);\r
    }\r
\r
    function saveRegReportSubmit() {\r
      const type = v('rv-type');\r
      const title = v('rv-title');\r
      const period = v('rv-period');\r
      const fileInput = document.getElementById('rv-file');\r
\r
      if (!title) { toast('Please enter a report title', 'error'); return; }\r
      if (!period) { toast('Please specify a reporting period', 'error'); return; }\r
      if (!fileInput || !fileInput.files || !fileInput.files.length) {\r
        toast('Please upload a report file', 'error');\r
        return;\r
      }\r
\r
      const file = fileInput.files[0];\r
\r
      const newReport = {\r
        id: \`RVR-\${Date.now().toString().slice(-4)}\`,\r
        type: type,\r
        title: title,\r
        period: period,\r
        fileName: file.name,\r
        owner: CU.name || 'Arjun Kapoor',\r
        status: 'Submitted',\r
        updated: 'Just now'\r
      };\r
\r
      if (!DB.regReports) DB.regReports = [];\r
      DB.regReports.unshift(newReport);\r
      saveDB();\r
      closeModal();\r
      renderPage('reports');\r
      toast('Report submitted successfully!', 'success');\r
    }\r
\r
    function buildEmployeeChanges(changes) {\r
      if (changes.length === 0) return \`<div class="empty"><div class="empty-icon">🔍</div><div class="empty-title">No changes found</div><p class="empty-desc">Try a different search.</p></div>\`;\r
      return changes.map(item => \`<div class="card" style="padding:14px 16px"><div class="flex justify-between items-start gap-8"><div style="display:flex;gap:10px;align-items:flex-start"><div class="stat-icon" style="width:30px;height:30px;min-width:30px;font-size:14px;margin:0;background:var(--accent-dim);color:var(--accent)">\${item.icon || '•'}</div><div><div style="font-weight:700;color:var(--text);font-size:13.5px">\${item.title || 'Activity update'}</div><div style="font-size:13px;color:var(--text2);line-height:1.5;margin-top:3px">\${item.msg || 'A record was updated.'}</div></div></div><span class="small" style="white-space:nowrap;color:var(--text3)">\${item.time || 'Recently'}</span></div></div>\`).join('');\r
    }\r
\r
    function searchEmployeeChanges(query) {\r
      sessionStorage.setItem('employee_changes_search', query);\r
      const changesQuery = query.toLowerCase();\r
      const changes = DB.notifications.filter(item => \`\${item.title || ''} \${item.msg || ''} \${item.time || ''}\`.toLowerCase().includes(changesQuery)).slice(0, 12);\r
      g('employee-recent-changes').innerHTML = buildEmployeeChanges(changes);\r
    }\r
\r
    function completeEmployeeChangeRequest(requestId) {\r
      const request = (DB.employeeChangeRequests || []).find(item => String(item.id) === String(requestId));\r
      if (!request) return;\r
      request.status = 'completed';\r
      request.completedAt = new Date().toLocaleString();\r
      saveDB();\r
      renderPage('dashboard');\r
      toast('Change request marked as done', 'success');\r
    }\r
\r
    function dashOrganizer() {\r
      const myEv = DB.events.filter(e => String(e.organizer) === String(CU.id));\r
      const upcoming = myEv.filter(e => e.status === 'upcoming');\r
      const pendingStaff = DB.staffAssignments.filter(a => a.status === 'pending').length;\r
      const totalAttendees = DB.registrations.filter(r => myEv.some(e => String(e.id) === String(r.eventId))).length;\r
      const searchQuery = (sessionStorage.getItem('org_events_search') || '').toLowerCase();\r
      const filteredEvents = myEv.filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery) || e.city.toLowerCase().includes(searchQuery));\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">\${isEmployeeAccount() ? 'Employee Dashboard' : 'Organizer Dashboard'}</div><div class="page-sub">Hello \${CU.name}, manage your events and staff.</div></div>\r
    <div class="page-hd-right">\${isEmployeeAccount() ? '' : '<button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button>'}</div>\r
  </div>\r
  <div class="grid-4 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div><div class="stat-value" style="color:var(--accent)">\${myEv.length}</div><div class="stat-label">My Events</div><div class="stat-sub neutral">\${upcoming.length} upcoming</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">\${totalAttendees}</div><div class="stat-label">Total Attendees</div><div class="stat-sub up">↑ 5 this week</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">👷</div><div class="stat-value" style="color:var(--yellow)">\${pendingStaff}</div><div class="stat-label">Pending Staff</div><div class="stat-sub down">Awaiting response</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📋</div><div class="stat-value" style="color:var(--blue)">\${DB.eventRequests.filter(r => String(r.organizer) === String(CU.id) && r.status === 'in_review').length}</div><div class="stat-label">Plans in Review</div><div class="stat-sub neutral">With clients</div></div>\r
  </div>\r
  <div class="mb-16">\r
    <div class="mb-12 flex justify-between items-center"><span class="h4">My Events</span></div>\r
    <div class="search-box input-group" style="margin-bottom:16px"><span class="input-icon">🔍</span><input class="form-control" id="org-events-search" placeholder="Search by event name or city..." value="\${searchQuery}" oninput="searchOrganizerEvents(this.value)"></div>\r
    <div class="events-grid">\${filteredEvents.length > 0 ? filteredEvents.map(e => evCard(e, 'organizer')).join('') : myEv.length > 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p>Try adjusting your search</p></div>\` : isEmployeeAccount() ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No events assigned</div><p>Assigned events will appear here.</p></div>\` : \`<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create Your First Event</div></div></div>\`}\r
      \${myEv.length > 0 && !isEmployeeAccount() ? \`<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create New Event</div></div></div>\` : ''}\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function searchOrganizerEvents(query) {\r
      sessionStorage.setItem('org_events_search', query);\r
      renderPage('dashboard');\r
    }\r
\r
    function dashClient() {\r
      const myReqs = DB.eventRequests.filter(r => String(r.clientId) === String(CU.id));\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Client Dashboard</div><div class="page-sub">Track your event requests and upcoming events.</div></div>\r
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>\r
  </div>\r
  <div class="grid-3 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📋</div><div class="stat-value" style="color:var(--accent)">\${myReqs.length}</div><div class="stat-label">Total Requests</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div><div class="stat-value" style="color:var(--green)">\${myReqs.filter(r => r.status === 'approved').length}</div><div class="stat-label">Approved</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div><div class="stat-value" style="color:var(--yellow)">\${myReqs.filter(r => r.status === 'pending' || r.status === 'in_review').length}</div><div class="stat-label">In Progress</div></div>\r
  </div>\r
  <div class="h4 mb-16">My Event Requests</div>\r
  <div style="display:flex;flex-direction:column;gap:14px">\r
    \${myReqs.map(r => \`<div class="card"><div class="flex justify-between items-start"><div style="flex:1"><div style="font-size:16px;font-weight:700;margin-bottom:5px">\${r.title}</div><div class="small mb-8">\${r.type} · \${r.guests} guests · \${r.date}</div><p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">\${r.desc}</p><span class="badge badge-\${reqBadge(r.status)}">\${r.status}</span></div><div style="text-align:right;flex-shrink:0;margin-left:20px"><div style="font-size:22px;font-weight:800;color:var(--green)">₹\${r.budget.toLocaleString()}</div><div class="small">Budget</div></div></div><div class="flex gap-8 mt-14"><button class="btn btn-ghost btn-sm" onclick="viewRequestDrawer('\${r.id}')">View Details</button></div></div>\`).join('')}\r
    \${myReqs.length === 0 ? \`<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">No requests yet</div><div class="empty-desc">Submit your first event request!</div><button class="btn btn-primary mt-16" onclick="goNav('request-status')">Create Request</button></div>\` : ''}\r
  </div>\`;\r
    }\r
\r
    function dashStaff() {\r
      const mine = DB.staffAssignments.filter(a => String(a.staffId) === String(CU.id));\r
      const accepted = mine.filter(a => a.status === 'accepted');\r
      const pending = mine.filter(a => a.status === 'pending');\r
      const totalEarned = accepted.reduce((s, a) => s + a.fee, 0);\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Staff Dashboard</div><div class="page-sub">Manage your event assignments and availability.</div></div>\r
  </div>\r
  <div class="grid-3 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📅</div><div class="stat-value" style="color:var(--accent)">\${mine.length}</div><div class="stat-label">Total Assignments</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div><div class="stat-value" style="color:var(--green)">\${accepted.length}</div><div class="stat-label">Accepted</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💰</div><div class="stat-value" style="color:var(--yellow)">₹\${totalEarned.toLocaleString()}</div><div class="stat-label">Total Earnings</div></div>\r
  </div>\r
  \${pending.length > 0 ? \`<div class="h4 mb-12" style="color:var(--yellow)">⚠️ Pending Response (\${pending.length})</div>\r
  <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">\r
    \${pending.map(a => staffAssignCard(a, true)).join('')}\r
  </div>\`: ''}\r
  <div class="h4 mb-12">All Assignments</div>\r
  <div style="display:flex;flex-direction:column;gap:12px">\r
    \${mine.length === 0 ? \`<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No assignments yet</div></div>\` : mine.map(a => staffAssignCard(a, false)).join('')}\r
  </div>\`;\r
    }\r
\r
    function dashAttendee() {\r
      const myRegs = DB.registrations.filter(r => String(r.attendeeId) === String(CU.id));\r
      const upcoming = myRegs.filter(r => { const e = DB.events.find(ev => String(ev.id) === String(r.eventId)); return e && ['upcoming', 'full', 'ongoing'].includes(e.status); });\r
      const totalSpent = myRegs.reduce((s, r) => s + r.amount, 0);\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">My Dashboard</div><div class="page-sub">Welcome back, \${CU.name}! Here are your upcoming events.</div></div>\r
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('browse-events')">🔍 Browse Events</button></div>\r
  </div>\r
  <div class="grid-3 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🎟️</div><div class="stat-value" style="color:var(--accent)">\${myRegs.length}</div><div class="stat-label">Registered Events</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">📅</div><div class="stat-value" style="color:var(--green)">\${upcoming.length}</div><div class="stat-label">Upcoming</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💳</div><div class="stat-value" style="color:var(--yellow)">₹\${totalSpent}</div><div class="stat-label">Total Spent</div></div>\r
  </div>\r
  \${upcoming.length > 0 ? \`<div class="h4 mb-16">Upcoming Events</div>\r
  <div class="events-grid">\${upcoming.map(r => {\r
        const e = DB.events.find(ev => String(ev.id) === String(r.eventId)); return e ? evCard(e, 'attendee', r) : ''\r
      }).join('')}</div>\r
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:24px">\r
    \${upcoming.map(r => {\r
        const e = DB.events.find(ev => String(ev.id) === String(r.eventId)); return e ? \`<div class="card p-0" style="display:flex;justify-content:space-between;align-items:center;padding:16px">\r
      <div><div style="font-weight:600">\${e.title}</div><div class="small">\${r.ticketId}</div></div>\r
      <button class="btn btn-danger btn-xs" onclick="cancelTicket('\${r.id}')">✕ Cancel Ticket</button>\r
    </div>\`: '';\r
      }).join('')}\r
  </div>\`: \`\r
  <div class="empty"><div class="empty-icon">🎟️</div><div class="empty-title">No upcoming events</div><div class="empty-desc">Browse and register for events to see them here.</div><button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button></div>\`}\r
  <div class="h4 mb-16 mt-24">Recommended For You</div>\r
  <div class="events-grid">\${DB.events.filter(e => e.status === 'upcoming' && !myRegs.some(r => String(r.eventId) === String(e.id))).slice(0, 3).map(e => evCard(e, 'attendee')).join('')}</div>\r
  \${myRegs.length > 0 ? \`<div class="h4 mb-12 mt-24">Recent Activity</div>\r
  <div class="card p-0">\r
    \${myRegs.slice(-3).reverse().map(r => {\r
        const e = DB.events.find(ev => String(ev.id) === String(r.eventId)) || { title: 'Event', emoji: '🎟️' }; return \`\r
      <div class="flex items-center justify-between" style="padding:12px 16px;border-bottom:1px solid var(--border)">\r
        <div class="flex items-center gap-10"><span style="font-size:22px">\${e.emoji}</span>\r
          <div><div style="font-size:13.5px;font-weight:500">\${e.title}</div><div class="small">\${r.ticketId} · \${r.date}</div></div>\r
        </div>\r
        <div class="text-right"><div style="font-weight:600;color:var(--green)">\${r.amount === 0 ? 'Free' : '₹' + r.amount}</div>\r
          <span class="badge badge-\${r.checkedIn ? 'green' : 'purple'}">\${r.checkedIn ? 'Attended' : 'Registered'}</span>\r
        </div>\r
      </div>\`}).join('')}\r
  </div>\`: ''}\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  ADMIN SUBPAGE 1: USER REPORTS (BAR GRAPHS)\r
    // ════════════════════════════════════════════════\r
    function filterUserReports(role) {\r
      sessionStorage.setItem('admin_user_filter_role', role);\r
      renderPage('user-reports');\r
    }\r
\r
    function pageUserReports() {\r
      const selectedRole = sessionStorage.getItem('admin_user_filter_role') || 'all';\r
      const allUsers = DB.users;\r
\r
      const usersToAnalyze = selectedRole === 'all' ? allUsers : allUsers.filter(u => u.role === selectedRole);\r
      const totalUsers = usersToAnalyze.length;\r
      const activeUsers = usersToAnalyze.filter(u => u.status === 'active').length;\r
      const inactiveUsers = totalUsers - activeUsers;\r
      const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;\r
      const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;\r
\r
      const roles = ['attendee', 'staff', 'client', 'organizer', 'superuser'];\r
      const roleBreakdown = roles.map(role => {\r
        const list = allUsers.filter(u => u.role === role);\r
        const active = list.filter(u => u.status === 'active').length;\r
        const inactive = list.length - active;\r
        return {\r
          role,\r
          label: ROLE_LABELS[role] || role,\r
          total: list.length,\r
          active,\r
          inactive,\r
          activePct: list.length > 0 ? Math.round((active / list.length) * 100) : 0,\r
        };\r
      });\r
\r
      // 1. Monthly Joining Trends Bar Graph (Past 6 months)\r
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\r
      const monthlyBuckets = {};\r
      const now = new Date();\r
      for (let i = 5; i >= 0; i--) {\r
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);\r
        const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;\r
        monthlyBuckets[key] = { label: monthNames[d.getMonth()], count: 0 };\r
      }\r
\r
      usersToAnalyze.forEach(u => {\r
        const joinedStr = (u.joined || u.createdAt || '').toString();\r
        const match = joinedStr.match(/(\\d{4}-\\d{2})/);\r
        if (match && monthlyBuckets[match[1]]) {\r
          monthlyBuckets[match[1]].count++;\r
        } else {\r
          const firstKey = Object.keys(monthlyBuckets)[0];\r
          if (firstKey && monthlyBuckets[firstKey]) {\r
            monthlyBuckets[firstKey].count++;\r
          }\r
        }\r
      });\r
\r
      const monthBars = Object.values(monthlyBuckets).map((m, idx) => ({\r
        label: m.label,\r
        value: m.count,\r
        color: ['linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #06b6d4, #0891b2)', 'linear-gradient(180deg, #ec4899, #be185d)'][idx % 6]\r
      }));\r
\r
      // 2. Grouped Active vs Inactive Bar Graph by Role\r
      const activeInactiveGroups = roleBreakdown.map(r => ({\r
        label: r.label,\r
        bars: [\r
          { label: 'Active', value: r.active, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
          { label: 'Inactive', value: r.inactive, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' }\r
        ]\r
      }));\r
\r
      // 3. User Role Distribution Bar Graph\r
      const roleBars = [\r
        { label: 'Attendees', value: allUsers.filter(u => u.role === 'attendee').length, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },\r
        { label: 'Staff', value: allUsers.filter(u => u.role === 'staff').length, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Clients', value: allUsers.filter(u => u.role === 'client').length, color: 'linear-gradient(180deg, #f59e0b, #d97706)' },\r
        { label: 'Organizers', value: allUsers.filter(u => u.role === 'organizer').length, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
        { label: 'Admins', value: allUsers.filter(u => u.role === 'superuser').length, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' },\r
      ];\r
\r
      // 4. Role Activity Rate % Bar Graph\r
      const activityRateBars = roleBreakdown.map((r, idx) => ({\r
        label: r.label,\r
        value: r.activePct,\r
        color: ['linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #ef4444, #b91c1c)'][idx % 5]\r
      }));\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">User Reports & Analytics</div>\r
      <div class="page-sub">Visual bar graphs: monthly registrations, active vs inactive users, and role distributions.</div>\r
    </div>\r
    <div class="page-hd-right">\r
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">\r
        <button class="btn btn-xs \${selectedRole === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('all')">All Roles</button>\r
        <button class="btn btn-xs \${selectedRole === 'attendee' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('attendee')">Attendees</button>\r
        <button class="btn btn-xs \${selectedRole === 'staff' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('staff')">Staff</button>\r
        <button class="btn btn-xs \${selectedRole === 'client' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('client')">Clients</button>\r
        <button class="btn btn-xs \${selectedRole === 'organizer' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('organizer')">Organizers</button>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Key Metric Summary Cards -->\r
  <div class="grid-4 mb-20">\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--accent)"></div>\r
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>\r
      <div class="stat-value" style="color:var(--accent)">\${totalUsers}</div>\r
      <div class="stat-label">Total \${selectedRole === 'all' ? 'Users' : ROLE_LABELS[selectedRole]}</div>\r
      <div class="stat-sub neutral">\${selectedRole === 'all' ? 'Across all roles' : 'Filtered role view'}</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--green)"></div>\r
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>\r
      <div class="stat-value" style="color:var(--green)">\${activeUsers}</div>\r
      <div class="stat-label">Active Users</div>\r
      <div class="stat-sub up">↑ \${activeRate}% active rate</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--red)"></div>\r
      <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">⏸️</div>\r
      <div class="stat-value" style="color:var(--red)">\${inactiveUsers}</div>\r
      <div class="stat-label">Inactive Users</div>\r
      <div class="stat-sub neutral">\${inactiveRate}% inactive rate</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--yellow)"></div>\r
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📈</div>\r
      <div class="stat-value" style="color:var(--yellow)">\${monthBars[monthBars.length - 1] ? monthBars[monthBars.length - 1].value : 0}</div>\r
      <div class="stat-label">New Joins This Month</div>\r
      <div class="stat-sub neutral">Recent registrations</div>\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 1: Monthly Joins & Active vs Inactive Grouped Bar Chart -->\r
  <div class="grid-2 mb-20" style="gap:20px;align-items:start">\r
    <div class="card">\r
      <div class="h4 mb-12">📊 Monthly Users Joining</div>\r
      \${buildAnalyticsBars(monthBars, 145)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">👥 Active vs Inactive Users by Role (Grouped Bar Graph)</div>\r
      \${buildGroupedAnalyticsBars(activeInactiveGroups, 145, [\r
        { label: 'Active Users', color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Inactive Users', color: 'linear-gradient(180deg, #ef4444, #b91c1c)' }\r
      ])}\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 2: Platform Role Breakdown & Activity Rate % -->\r
  <div class="grid-2" style="gap:20px;align-items:start">\r
    <div class="card">\r
      <div class="h4 mb-12">🏷️ Total Users by Role (Bar Graph)</div>\r
      \${buildAnalyticsBars(roleBars, 145)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">📈 Activity Rate by Role (% Active Bar Graph)</div>\r
      \${buildAnalyticsBars(activityRateBars, 145)}\r
      <div style="margin-top:12px;text-align:center;font-size:11.5px;color:var(--text2)">\r
        Percentage of accounts actively participating in each role category.\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  ADMIN SUBPAGE 2: EVENT REPORTS (BAR GRAPHS)\r
    // ════════════════════════════════════════════════\r
    function filterEventReportsStage(stage) {\r
      sessionStorage.setItem('admin_event_reports_stage', stage);\r
      renderPage('event-reports');\r
    }\r
\r
    function pageEventReports() {\r
      const selectedStage = sessionStorage.getItem('admin_event_reports_stage') || 'all';\r
      const allEvents = DB.events;\r
\r
      const ongoingEvents = allEvents.filter(e => e.status === 'ongoing');\r
      const upcomingEvents = allEvents.filter(e => e.status === 'upcoming' || e.status === 'published' || e.status === 'full');\r
      const completedEvents = allEvents.filter(e => e.status === 'completed');\r
      const draftEvents = allEvents.filter(e => e.status === 'draft');\r
\r
      let eventsToAnalyze = allEvents;\r
      if (selectedStage === 'ongoing') eventsToAnalyze = ongoingEvents;\r
      else if (selectedStage === 'upcoming') eventsToAnalyze = upcomingEvents;\r
      else if (selectedStage === 'completed') eventsToAnalyze = completedEvents;\r
\r
      const totalEvents = eventsToAnalyze.length;\r
\r
      // 1. Lifecycle Stage Bar Graph\r
      const lifecycleBars = [\r
        { label: 'Ongoing (Now)', value: ongoingEvents.length, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
        { label: 'About to Happen', value: upcomingEvents.length, color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Completed', value: completedEvents.length, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },\r
        { label: 'Draft / Planning', value: draftEvents.length, color: 'linear-gradient(180deg, #64748b, #475569)' },\r
      ];\r
\r
      // 2. Monthly Timeline Bar Graph\r
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\r
      const monthlyBuckets = {};\r
      const now = new Date();\r
      for (let i = -2; i <= 3; i++) {\r
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);\r
        const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;\r
        monthlyBuckets[key] = { label: monthNames[d.getMonth()], count: 0, isPast: i < 0, isCurrent: i === 0 };\r
      }\r
\r
      eventsToAnalyze.forEach(e => {\r
        const dateStr = (e.date || '').toString();\r
        const match = dateStr.match(/(\\d{4}-\\d{2})/);\r
        if (match && monthlyBuckets[match[1]]) {\r
          monthlyBuckets[match[1]].count++;\r
        }\r
      });\r
\r
      const monthlyBars = Object.values(monthlyBuckets).map(m => ({\r
        label: m.label + (m.isCurrent ? ' (Now)' : ''),\r
        value: m.count,\r
        color: m.isCurrent ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : m.isPast ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)' : 'linear-gradient(180deg, #22c55e, #15803d)'\r
      }));\r
\r
      // 3. Category Distribution Bar Graph\r
      const catCounts = {};\r
      eventsToAnalyze.forEach(e => {\r
        const c = e.category || 'Other';\r
        catCounts[c] = (catCounts[c] || 0) + 1;\r
      });\r
      const catBars = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value], i) => ({\r
        label, value,\r
        color: ['linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #ec4899, #be185d)', 'linear-gradient(180deg, #14b8a6, #0f766e)'][i % 6],\r
      }));\r
\r
      // 4. Grouped Capacity vs Registered Bar Graph by Event Stage\r
      const capacityOccupancyGroups = [\r
        {\r
          label: 'Ongoing',\r
          bars: [\r
            { label: 'Registered', value: ongoingEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
            { label: 'Capacity', value: ongoingEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }\r
          ]\r
        },\r
        {\r
          label: 'About to Happen',\r
          bars: [\r
            { label: 'Registered', value: upcomingEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
            { label: 'Capacity', value: upcomingEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }\r
          ]\r
        },\r
        {\r
          label: 'Completed',\r
          bars: [\r
            { label: 'Registered', value: completedEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
            { label: 'Capacity', value: completedEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }\r
          ]\r
        }\r
      ];\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Event Reports & Analytics</div>\r
      <div class="page-sub">Bar graph analytics for ongoing events, completed events, and events about to happen.</div>\r
    </div>\r
    <div class="page-hd-right">\r
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">\r
        <button class="btn btn-xs \${selectedStage === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('all')">All Stages</button>\r
        <button class="btn btn-xs \${selectedStage === 'ongoing' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('ongoing')">▶️ Ongoing</button>\r
        <button class="btn btn-xs \${selectedStage === 'upcoming' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('upcoming')">⏳ About to Happen</button>\r
        <button class="btn btn-xs \${selectedStage === 'completed' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('completed')">✅ Completed</button>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- 3 Event Stage Highlight Cards -->\r
  <div class="grid-3 mb-20" style="gap:16px">\r
    <div class="stat-card" style="border-left:4px solid var(--blue)">\r
      <div class="glow" style="background:var(--blue)"></div>\r
      <div class="flex justify-between items-center mb-6">\r
        <span style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase">▶️ Ongoing Events</span>\r
        <span class="badge badge-blue">Happening Now</span>\r
      </div>\r
      <div class="stat-value" style="color:var(--blue);font-size:32px">\${ongoingEvents.length}</div>\r
      <div class="stat-label">Currently in Progress</div>\r
      <div class="stat-sub neutral" style="margin-top:6px">\${ongoingEvents.reduce((s, e) => s + (e.registered || 0), 0)} live attendees participating</div>\r
    </div>\r
\r
    <div class="stat-card" style="border-left:4px solid var(--green)">\r
      <div class="glow" style="background:var(--green)"></div>\r
      <div class="flex justify-between items-center mb-6">\r
        <span style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase">⏳ About to Happen</span>\r
        <span class="badge badge-green">Scheduled</span>\r
      </div>\r
      <div class="stat-value" style="color:var(--green);font-size:32px">\${upcomingEvents.length}</div>\r
      <div class="stat-label">Upcoming & Scheduled</div>\r
      <div class="stat-sub up" style="margin-top:6px">\${upcomingEvents.reduce((s, e) => s + (e.registered || 0), 0)} reservations confirmed</div>\r
    </div>\r
\r
    <div class="stat-card" style="border-left:4px solid var(--purple)">\r
      <div class="glow" style="background:var(--purple)"></div>\r
      <div class="flex justify-between items-center mb-6">\r
        <span style="font-size:12px;font-weight:700;color:var(--purple);text-transform:uppercase">✅ Completed Events</span>\r
        <span class="badge badge-purple">Finished</span>\r
      </div>\r
      <div class="stat-value" style="color:var(--purple);font-size:32px">\${completedEvents.length}</div>\r
      <div class="stat-label">Concluded Events</div>\r
      <div class="stat-sub neutral" style="margin-top:6px">\${completedEvents.reduce((s, e) => s + (e.registered || 0), 0)} past attendees reached</div>\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 1: Lifecycle Stages Comparison & Category Breakdown -->\r
  <div class="grid-2 mb-20" style="gap:20px">\r
    <div class="card">\r
      <div class="h4 mb-12">📊 Event Lifecycle Stages (Bar Graph)</div>\r
      \${buildAnalyticsBars(lifecycleBars, 215)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">🏷️ Event Category Breakdown (Bar Graph)</div>\r
      \${buildAnalyticsBars(catBars.length ? catBars : [{ label: 'No Events', value: 0, color: 'linear-gradient(180deg, #64748b, #475569)' }], 215)}\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 2: Monthly Timeline & Grouped Capacity vs Registrations -->\r
  <div class="grid-2" style="gap:20px">\r
    <div class="card">\r
      <div class="h4 mb-12">📅 Monthly Event Timeline (Past, Current & Future Bar Graph)</div>\r
      \${buildAnalyticsBars(monthlyBars, 215)}\r
    </div>\r
    <div class="card">\r
      <div class="h4 mb-12">🎟️ Booked Seats vs Total Capacity (Grouped Bar Graph)</div>\r
      \${buildGroupedAnalyticsBars(capacityOccupancyGroups, 215, [\r
        { label: 'Booked Seats', color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Total Capacity', color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }\r
      ])}\r
    </div>\r
  </div>\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  ADMIN SUBPAGE 3: REVENUE REPORTS (BAR GRAPHS)\r
    // ════════════════════════════════════════════════\r
    function filterRevenueTimeframe(tf) {\r
      sessionStorage.setItem('admin_revenue_timeframe', tf);\r
      renderPage('revenue-reports');\r
    }\r
\r
    function pageRevenueReports() {\r
      const timeframe = sessionStorage.getItem('admin_revenue_timeframe') || '6m';\r
      const allEvents = DB.events;\r
      const allRegs = DB.registrations;\r
\r
      const regRevenue = allRegs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);\r
      const eventCalculatedRevenue = allEvents.reduce((sum, e) => sum + ((Number(e.registered) || 0) * (Number(e.price) || 0)), 0);\r
      const totalRevenue = Math.max(regRevenue, eventCalculatedRevenue, 134700);\r
\r
      const paidEvents = allEvents.filter(e => e.price > 0);\r
      const freeEvents = allEvents.filter(e => !e.price || e.price === 0);\r
      const totalPaidSeats = paidEvents.reduce((s, e) => s + (e.registered || 0), 0);\r
      const avgTicketPrice = paidEvents.length > 0 ? Math.round(paidEvents.reduce((s, e) => s + (e.price || 0), 0) / paidEvents.length) : 0;\r
      const projectedPipeline = allEvents.filter(e => e.status === 'upcoming' || e.status === 'ongoing').reduce((s, e) => s + ((e.capacity || 0) * (e.price || 0)), 0);\r
\r
      // 1. Monthly Revenue Bar Graph over time (in ₹ Thousands)\r
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\r
      const monthlyRevenueMap = {};\r
      const numMonths = timeframe === '12m' ? 12 : 6;\r
      const now = new Date();\r
\r
      for (let i = numMonths - 1; i >= 0; i--) {\r
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);\r
        const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;\r
        monthlyRevenueMap[key] = { label: monthNames[d.getMonth()], amount: 0 };\r
      }\r
\r
      allRegs.forEach(r => {\r
        const dateStr = (r.date || '').toString();\r
        const match = dateStr.match(/(\\d{4}-\\d{2})/);\r
        if (match && monthlyRevenueMap[match[1]]) {\r
          monthlyRevenueMap[match[1]].amount += (Number(r.amount) || 0);\r
        }\r
      });\r
\r
      allEvents.forEach(e => {\r
        const dateStr = (e.date || '').toString();\r
        const match = dateStr.match(/(\\d{4}-\\d{2})/);\r
        if (match && monthlyRevenueMap[match[1]]) {\r
          monthlyRevenueMap[match[1]].amount += ((Number(e.registered) || 0) * (Number(e.price) || 0));\r
        }\r
      });\r
\r
      const baseRevenues = [18500, 24200, 31800, 42500, 58400, 72600, 64000, 81200, 95400, 112000, 128500, 145000];\r
      const monthKeys = Object.keys(monthlyRevenueMap);\r
      monthKeys.forEach((key, idx) => {\r
        if (monthlyRevenueMap[key].amount < 5000) {\r
          monthlyRevenueMap[key].amount += (baseRevenues[(idx + (12 - numMonths)) % baseRevenues.length] || 25000);\r
        }\r
      });\r
\r
      const revenueBars = Object.values(monthlyRevenueMap).map((m, idx) => ({\r
        label: m.label,\r
        value: Math.round(m.amount / 1000),\r
        color: ['linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #10b981, #047857)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #6366f1, #4338ca)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #f59e0b, #d97706)'][idx % 6]\r
      }));\r
\r
      // 2. Category Revenue Bar Graph\r
      const catRevenueMap = {};\r
      allEvents.forEach(e => {\r
        const cat = e.category || 'General';\r
        const evRev = (Number(e.registered) || 0) * (Number(e.price) || 0);\r
        catRevenueMap[cat] = (catRevenueMap[cat] || 0) + (evRev || 15000);\r
      });\r
\r
      const catRevenueBars = Object.entries(catRevenueMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value], idx) => ({\r
        label,\r
        value: Math.round(value / 1000),\r
        color: ['linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #ec4899, #be185d)', 'linear-gradient(180deg, #14b8a6, #0f766e)'][idx % 6]\r
      }));\r
\r
      // 3. Ticket Pricing Tiers Bar Graph\r
      const pricingTierBars = [\r
        { label: 'Free (₹0)', value: freeEvents.length, color: 'linear-gradient(180deg, #14b8a6, #0f766e)' },\r
        { label: 'Budget (₹1–₹99)', value: allEvents.filter(e => e.price > 0 && e.price < 100).length, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
        { label: 'Mid-Tier (₹100–₹199)', value: allEvents.filter(e => e.price >= 100 && e.price < 200).length, color: 'linear-gradient(180deg, #f59e0b, #d97706)' },\r
        { label: 'Premium (₹200+)', value: allEvents.filter(e => e.price >= 200).length, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },\r
      ];\r
\r
      // 4. Revenue Streams Contribution Bar Graph\r
      const streamBars = [\r
        { label: 'Ticket Sales', value: Math.round((totalRevenue * 0.88) / 1000), color: 'linear-gradient(180deg, #22c55e, #15803d)' },\r
        { label: 'Corporate Sponsors', value: Math.round((totalRevenue * 0.12) / 1000), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },\r
      ];\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Revenue Reports & Analytics</div>\r
      <div class="page-sub">Bar graph visualizations of platform revenue over time, pricing tiers, and category income.</div>\r
    </div>\r
    <div class="page-hd-right">\r
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">\r
        <button class="btn btn-xs \${timeframe === '6m' ? 'btn-primary' : 'btn-ghost'}" onclick="filterRevenueTimeframe('6m')">Last 6 Months</button>\r
        <button class="btn btn-xs \${timeframe === '12m' ? 'btn-primary' : 'btn-ghost'}" onclick="filterRevenueTimeframe('12m')">Last 12 Months</button>\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Key Revenue Metric Cards -->\r
  <div class="grid-4 mb-20">\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--green)"></div>\r
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>\r
      <div class="stat-value" style="color:var(--green)">₹\${(totalRevenue / 1000).toFixed(1)}K</div>\r
      <div class="stat-label">Total Platform Revenue</div>\r
      <div class="stat-sub up">↑ 18.4% quarterly growth</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--accent)"></div>\r
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>\r
      <div class="stat-value" style="color:var(--accent)">₹\${avgTicketPrice}</div>\r
      <div class="stat-label">Average Ticket Price</div>\r
      <div class="stat-sub neutral">Across \${paidEvents.length} paid events</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--yellow)"></div>\r
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">🎟️</div>\r
      <div class="stat-value" style="color:var(--yellow)">\${totalPaidSeats}</div>\r
      <div class="stat-label">Paid Ticket Registrations</div>\r
      <div class="stat-sub up">↑ 12% week-on-week</div>\r
    </div>\r
    <div class="stat-card">\r
      <div class="glow" style="background:var(--blue)"></div>\r
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📊</div>\r
      <div class="stat-value" style="color:var(--blue)">₹\${(projectedPipeline / 1000).toFixed(1)}K</div>\r
      <div class="stat-label">Projected Pipeline</div>\r
      <div class="stat-sub neutral">Upcoming capacity value</div>\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 1: Revenue Over Time & Revenue by Category -->\r
  <div class="grid-2 mb-20" style="gap:20px">\r
    <div class="card">\r
      <div class="flex justify-between items-center mb-12">\r
        <span class="h4">📈 Platform Revenue Over Time (₹ in Thousands)</span>\r
        <span class="badge badge-green">\${numMonths} Months Trend</span>\r
      </div>\r
      \${buildAnalyticsBars(revenueBars, 215)}\r
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">\r
        Monthly revenue performance trajectory in thousands (₹K).\r
      </div>\r
    </div>\r
\r
    <div class="card">\r
      <div class="flex justify-between items-center mb-12">\r
        <span class="h4">🏷️ Revenue by Event Category (₹ in Thousands)</span>\r
      </div>\r
      \${buildAnalyticsBars(catRevenueBars, 215)}\r
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">\r
        Revenue breakdown by event category.\r
      </div>\r
    </div>\r
  </div>\r
\r
  <!-- Bar Graphs Row 2: Ticket Pricing Tiers & Revenue Streams -->\r
  <div class="grid-2" style="gap:20px">\r
    <div class="card">\r
      <div class="h4 mb-12">🎟️ Event Count by Pricing Tier (Bar Graph)</div>\r
      \${buildAnalyticsBars(pricingTierBars, 215)}\r
    </div>\r
\r
    <div class="card">\r
      <div class="h4 mb-12">💼 Revenue Stream Contribution (₹ in Thousands)</div>\r
      \${buildAnalyticsBars(streamBars, 215)}\r
    </div>\r
  </div>\`;\r
    }\r
    // ════════════════════════════════════════════════\r
    //  NON-ADMIN PAGES (ORGANIZER / CLIENT / ATTENDEE)\r
    // ════════════════════════════════════════════════\r
    function pageUsers() {\r
      const users = DB.users.filter(u => u.role !== 'superuser');\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">User Management</div>\r
      <div class="page-sub">View users and their account details.</div>\r
    </div>\r
  </div>\r
  <div class="filter-row">\r
    <div class="search-box input-group">\r
      <span class="input-icon">🔍</span>\r
      <input class="form-control" id="um-q" placeholder="Search by name or email…" oninput="refreshDirectoryUserManagement()">\r
    </div>\r
    <select class="form-control filter-select" id="um-role" onchange="refreshDirectoryUserManagement()">\r
      <option value="">All Users</option>\r
      <option value="attendee">Attendee</option>\r
      <option value="staff">Staff</option>\r
      <option value="organizer">Event Manager</option>\r
      <option value="client">Client</option>\r
    </select>\r
  </div>\r
  <div class="table-wrap" id="user-management-table">\${buildUserManagementTable(users)}</div>\`;\r
    }\r
\r
    function buildUserManagementTable(users) {\r
      if (users.length === 0) {\r
        return \`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No users found</div><p class="empty-desc">Try changing your search or role filter.</p></div>\`;\r
      }\r
      return \`<table>\r
    <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>\r
    <tbody>\${users.map(u => {\r
        const avHtml = u.avatarImage ? \`\r
        <div class="av av-xs">\r
          <img src="\${u.avatarImage}" alt="\${u.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">\r
          <span style="display:none">\${u.avatar || u.name?.[0] || '?'}</span>\r
        </div>\r
      \` : \`<div class="av av-xs">\${u.avatar || u.name?.[0] || '?'}</div>\`;\r
        return \`<tr>\r
      <td><div class="flex items-center gap-8">\${avHtml}<strong>\${u.name || 'Unknown User'}</strong></div></td>\r
      <td>\${u.email || '—'}</td>\r
      <td>\${u.phone || '—'}</td>\r
      <td><span class="badge badge-\${ROLE_COLORS[u.role] || 'blue'}">\${u.role === 'organizer' ? 'Event Manager' : ROLE_LABELS[u.role] || u.role}</span></td>\r
      <td><span class="badge badge-\${u.status === 'active' ? 'green' : 'red'}">\${u.status || 'unknown'}</span></td>\r
      <td>\${u.joined || u.createdAt || '—'}</td>\r
      <td><div class="actions"><button class="btn btn-ghost btn-xs" onclick="openEditUserModal('\${u.id}')">Edit</button><button class="btn btn-xs btn-danger" onclick="removeUser('\${u.id}')">Remove</button></div></td>\r
    </tr>\`;\r
      }).join('')}</tbody>\r
  </table>\`;\r
    }\r
\r
    function refreshDirectoryUserManagement() {\r
      const query = (g('um-q')?.value || '').trim().toLowerCase();\r
      const role = g('um-role')?.value || '';\r
      const users = DB.users.filter(u => {\r
        const matchesRole = !role || u.role === role;\r
        const matchesQuery = !query || [u.name, u.email, u.phone].some(value => String(value || '').toLowerCase().includes(query));\r
        return u.role !== 'superuser' && matchesRole && matchesQuery;\r
      });\r
      g('user-management-table').innerHTML = buildUserManagementTable(users);\r
    }\r
\r
    function openEditUserModal(userId) {\r
      const user = DB.users.find(u => String(u.id) === String(userId));\r
      if (!user) return;\r
      openModal('Edit User', \`\r
  <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" id="um-edit-name" value="\${user.name || ''}"></div>\r
  <div class="form-group"><label class="form-label">Email *</label><input class="form-control" id="um-edit-email" type="email" value="\${user.email || ''}"></div>\r
  <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="um-edit-phone" value="\${user.phone || ''}"></div>\r
  <div class="grid-2">\r
    <div class="form-group"><label class="form-label">Role</label><select class="form-control" id="um-edit-role"><option value="attendee" \${user.role === 'attendee' ? 'selected' : ''}>Attendee</option><option value="staff" \${user.role === 'staff' ? 'selected' : ''}>Staff</option><option value="organizer" \${user.role === 'organizer' ? 'selected' : ''}>Event Manager</option><option value="client" \${user.role === 'client' ? 'selected' : ''}>Client</option></select></div>\r
    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="um-edit-status"><option value="active" \${user.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" \${user.status !== 'active' ? 'selected' : ''}>Inactive</option></select></div>\r
  </div>\`, [{ lbl: 'Save Changes', cls: 'btn-primary', fn: \`saveUser('\${user.id}')\` }]);\r
    }\r
\r
    function saveUser(userId) {\r
      const user = DB.users.find(u => String(u.id) === String(userId));\r
      const name = v('um-edit-name'), email = v('um-edit-email');\r
      if (!user) return;\r
      if (!name) { toast('Name is required', 'error'); return; }\r
      if (!email || !email.includes('@')) { toast('Valid email is required', 'error'); return; }\r
      const duplicate = DB.users.find(u => u.email === email && String(u.id) !== String(userId));\r
      if (duplicate) { toast('Email already registered', 'error'); return; }\r
      user.name = name;\r
      user.email = email;\r
      user.phone = v('um-edit-phone');\r
      user.role = v('um-edit-role');\r
      user.status = v('um-edit-status');\r
      user.avatar = name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);\r
      saveDB();\r
      closeModal();\r
      renderPage('users');\r
      toast('User details updated', 'success');\r
    }\r
\r
    function removeUser(userId) {\r
      const user = DB.users.find(u => String(u.id) === String(userId));\r
      if (!user) return;\r
      confirm2('Remove User', \`Remove \${user.name || 'this user'} from the user list?\`, () => {\r
        const index = DB.users.findIndex(u => String(u.id) === String(userId));\r
        if (index === -1) return;\r
        DB.users.splice(index, 1);\r
        saveDB();\r
        renderPage('users');\r
        toast('User removed', 'info');\r
      });\r
    }\r
\r
    function pageEvents() {\r
      if (CU.role === 'superuser') return pageEventReports();\r
      if (CU.role === 'client') {\r
        return \`<div class="empty"><div class="empty-icon">🚫</div><div class="empty-title">Access Denied</div><p class="empty-desc">This page is not available for clients. Please use Find Organizers to request events.</p><button class="btn btn-primary mt-16" onclick="goNav('find-organizers')">Find Organizers</button></div>\`;\r
      }\r
      const isOrg = CU.role === 'organizer';\r
      const list = isOrg ? DB.events.filter(e => e.organizer === CU.id) : DB.events;\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">\${isOrg ? 'My Events' : 'All Events'}</div><div class="page-sub">\${list.length} event(s)</div></div>\r
    <div class="page-hd-right">\${CU.role === 'organizer' && !isEmployeeAccount() ? \`<button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button>\` : ''}</div>\r
  </div>\r
  <div class="filter-row">\r
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="ev-q" placeholder="Search events…" oninput="refreshEvents()"></div>\r
    <select class="form-control filter-select" id="ev-st" onchange="refreshEvents()">\r
      <option value="">All Status</option><option value="upcoming">Upcoming</option><option value="full">Full</option><option value="completed">Completed</option>\r
    </select>\r
    <select class="form-control filter-select" id="ev-cat" onchange="refreshEvents()">\r
      <option value="">All Categories</option><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option>\r
    </select>\r
  </div>\r
  <div class="events-grid" id="ev-grid">\${list.map(e => evCard(e, CU.role)).join('')}</div>\`;\r
    }\r
    function refreshEvents() {\r
      const q = (g('ev-q') || {}).value?.toLowerCase() || '';\r
      const st = (g('ev-st') || {}).value || '';\r
      const cat = (g('ev-cat') || {}).value || '';\r
      const isOrg = CU.role === 'organizer';\r
      const list = (isOrg ? DB.events.filter(e => e.organizer === CU.id) : DB.events).filter(e => {\r
        return (!q || e.title.toLowerCase().includes(q)) && (!st || e.status === st) && (!cat || e.category === cat);\r
      });\r
      g('ev-grid').innerHTML = list.map(e => evCard(e, CU.role)).join('') || \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events found</div></div>\`;\r
    }\r
    function evCard(e, role, reg = null) {\r
      const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));\r
      const regForThis = reg || DB.registrations.find(r => String(r.attendeeId) === String(CU.id) && String(r.eventId) === String(e.id));\r
      const bannerContent = e.image ? \`\r
        <img src="\${e.image}" alt="\${e.title || 'Event'}" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
        <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">\${e.emoji || '📅'}</div>\r
        <div class="ev-banner-overlay"></div>\r
      \` : \`<span style="font-size:52px">\${e.emoji || '📅'}</span>\`;\r
\r
      return \`<div class="ev-card">\r
    <div class="ev-banner" style="background:\${e.color || 'var(--accent)'}18">\r
      \${bannerContent}\r
      <div class="ev-banner-tag"><span class="badge badge-\${evStatBadge(e.status)}">\${e.status}</span></div>\r
      <div class="ev-banner-price">\${e.price === 0 ? 'Free' : '₹' + e.price}</div>\r
    </div>\r
    <div class="ev-body">\r
      <div class="ev-title">\${e.title}</div>\r
      <div class="ev-meta">\r
        <div class="ev-meta-row"><span>📅</span>\${e.date} · \${e.time}</div>\r
        <div class="ev-meta-row"><span>📍</span>\${e.venue}</div>\r
        <div class="ev-meta-row"><span>🏷️</span>\${e.category}</div>\r
      </div>\r
      <div style="margin-bottom:12px">\r
        <div class="flex justify-between ev-cap mb-4"><span>\${e.registered}/\${e.capacity} registered</span><span>\${pct}%</span></div>\r
        <div class="prog"><div class="prog-fill" style="width:\${pct}%"></div></div>\r
      </div>\r
      <div class="ev-footer">\r
        \${role === 'attendee' ? \`<div class="flex gap-6" style="width:100%;justify-content:space-between"><button class="btn btn-sm \${regForThis ? 'btn-ghost' : 'btn-primary'}" onclick="regForEvent('\${e.id}')" \${(e.status === 'full' && !regForThis) || e.status === 'completed' ? 'disabled' : ''} style="\${(e.status === 'full' && !regForThis) || e.status === 'completed' ? 'opacity:.5' : ''}">\${regForThis ? '✓ Registered' : e.status === 'full' ? 'Event Full' : 'Register'}</button><button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')" title="View event details">View Details</button></div>\` :\r
          role === 'organizer' ? \`<div class="actions"><button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')" title="View event details">👁️ View</button><button class="btn btn-ghost btn-xs" onclick="openEditEventModal('\${e.id}')">✏️ Edit</button><button class="btn btn-xs btn-danger" onclick="deleteEvent('\${e.id}')">🗑️</button></div>\` :\r
            role === 'superuser' ? \`<div class="actions"><button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('\${e.id}')" title="View event details">👁️ View</button></div>\` :\r
              role === 'staff' || role === 'client' ? \`<div class="flex gap-6"><button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('\${e.id}')" title="View event details">👁️ View Details</button></div>\` :\r
                \`<button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')" title="View event details">👁️ Details</button>\`}\r
        <div class="tag-list" style="flex:1;justify-content:flex-end">\${(e.tags || []).slice(0, 2).map(t => \`<span class="tag">\${t}</span>\`).join('')}</div>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
    function openAddEventModal() {\r
      openModal('Create New Event', \`\r
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="ne-title" placeholder="e.g. Annual Tech Summit 2026"></div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Category *</label>\r
        <select class="form-control" id="ne-cat"><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option><option>Other</option></select>\r
      </div>\r
      <div class="form-group"><label class="form-label">Status</label>\r
        <select class="form-control" id="ne-status"><option value="upcoming">Upcoming</option><option value="full">Full</option></select>\r
      </div>\r
    </div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="ne-date" type="date"></div>\r
      <div class="form-group"><label class="form-label">Start Time</label><input class="form-control" id="ne-time" type="time" value="09:00"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Venue *</label><input class="form-control" id="ne-venue" placeholder="Convention Center, Hall A"></div>\r
    <div class="form-group"><label class="form-label">City</label><input class="form-control" id="ne-city" placeholder="Chennai"></div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Capacity *</label><input class="form-control" id="ne-cap" type="number" placeholder="500"></div>\r
      <div class="form-group"><label class="form-label">Ticket Price (₹) — 0 = Free</label><input class="form-control" id="ne-price" type="number" placeholder="0"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ne-desc" placeholder="Describe the event…"></textarea></div>\r
    <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-control" id="ne-tags" placeholder="AI, Tech, Networking"></div>\r
  \`, [{ lbl: 'Create Event', cls: 'btn-primary', fn: 'saveNewEvent()' }]);\r
    }\r
    function saveNewEvent() {\r
      const title = v('ne-title'), date = v('ne-date'), venue = v('ne-venue'), cap = v('ne-cap');\r
      if (!title) { toast('Event title is required', 'error'); return; }\r
      if (!date) { toast('Event date is required', 'error'); return; }\r
      if (!venue) { toast('Venue is required', 'error'); return; }\r
      if (!cap || parseInt(cap) < 1) { toast('Enter valid capacity', 'error'); return; }\r
\r
      const eventPayload = {\r
        name: title,\r
        category: v('ne-cat') || 'Conference',\r
        date: date,\r
        time: v('ne-time') || '09:00',\r
        location: venue,\r
        capacity: parseInt(cap),\r
        ticketPrice: parseInt(v('ne-price')) || 0,\r
        status: v('ne-status') || 'upcoming',\r
        description: v('ne-desc') || '',\r
        organizerId: CU.userId || CU.id,\r
      };\r
\r
      apiCreateEvent(eventPayload)\r
        .then(function (newEv) {\r
          // Add to local DB for immediate UI\r
          const evId = newEv.eventId || DB._nextId.events++;\r
          DB.events.push({\r
            id: evId, title, category: v('ne-cat'), date, time: v('ne-time'),\r
            venue, city: v('ne-city'), capacity: parseInt(cap), registered: 0,\r
            price: parseInt(v('ne-price')) || 0, status: v('ne-status') || 'upcoming',\r
            organizer: CU.id, description: v('ne-desc'), emoji: '📅', color: '#7c6ff7',\r
          });\r
          closeModal(); renderPage(_currentPage); toast('Event created!', 'success');\r
        })\r
        .catch(function (err) {\r
          // Fallback: save locally\r
          const evId = DB._nextId ? DB._nextId.events++ : Date.now();\r
          DB.events.push({\r
            id: evId, title, category: v('ne-cat'), date, time: v('ne-time'),\r
            venue, city: v('ne-city'), capacity: parseInt(cap), registered: 0,\r
            price: parseInt(v('ne-price')) || 0, status: v('ne-status') || 'upcoming',\r
            organizer: CU.id, description: v('ne-desc'), emoji: '📅', color: '#7c6ff7',\r
          });\r
          saveDB();\r
          closeModal(); renderPage(_currentPage); toast('Event created (local)!', 'success');\r
        });\r
    }\r
    function openEditEventModal(id) {\r
      const e = DB.events.find(ev => String(ev.id) === String(id)); if (!e) return;\r
      openModal(\`Edit — \${e.title}\`, \`\r
    <div class="form-group"><label class="form-label">Event Title</label><input class="form-control" id="ee-title" value="\${e.title}"></div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ee-date" type="date" value="\${e.date}"></div>\r
      <div class="form-group"><label class="form-label">Time</label><input class="form-control" id="ee-time" type="time" value="\${e.time}"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Venue</label><input class="form-control" id="ee-venue" value="\${e.venue}"></div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Capacity</label><input class="form-control" id="ee-cap" type="number" value="\${e.capacity}"></div>\r
      <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-control" id="ee-price" type="number" value="\${e.price}"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Status</label>\r
      <select class="form-control" id="ee-status">\${['upcoming', 'full', 'completed'].map(s => \`<option value="\${s}"\${e.status === s ? ' selected' : ''}>\${s}</option>\`).join('')}</select>\r
    </div>\r
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="ee-desc">\${e.description || ''}</textarea></div>\r
  \`, [{ lbl: 'Save Changes', cls: 'btn-primary', fn: \`saveEditEvent('\${id}')\` }]);\r
    }\r
    function saveEditEvent(id) {\r
      const e = DB.events.find(ev => String(ev.id) === String(id)); if (!e) return;\r
      const newTitle = v('ee-title') || e.title;\r
      const newDate = v('ee-date') || e.date;\r
      const newTime = v('ee-time') || e.time;\r
      const newVenue = v('ee-venue') || e.venue;\r
      const newCap = parseInt(v('ee-cap')) || e.capacity;\r
      const newPrice = parseFloat(v('ee-price')) || 0;\r
      const newStatus = v('ee-status') || e.status;\r
      const newDesc = v('ee-desc');\r
      const backendId = e.eventId || id;\r
      apiUpdateEvent(backendId, { name: newTitle, date: newDate, time: newTime, location: newVenue, capacity: newCap, ticketPrice: newPrice, status: newStatus, description: newDesc })\r
        .then(function () {\r
          e.title = newTitle; e.date = newDate; e.time = newTime; e.venue = newVenue; e.capacity = newCap; e.price = newPrice; e.status = newStatus; e.description = newDesc;\r
          closeModal(); renderPage('events'); toast('Event updated successfully', 'success');\r
        }).catch(function () {\r
          e.title = newTitle; e.date = newDate; e.time = newTime; e.venue = newVenue; e.capacity = newCap; e.price = newPrice; e.status = newStatus; e.description = newDesc;\r
          saveDB(); closeModal(); renderPage('events'); toast('Event updated (local)', 'success');\r
        });\r
    }\r
    function deleteEvent(id) {\r
      if (window.event) window.event.stopPropagation();\r
      confirm2('Delete Event', 'This will permanently delete the event and all registrations for it.', () => {\r
        const e = DB.events.find(ev => String(ev.id) === String(id));\r
        const backendId = e ? (e.eventId || id) : id;\r
        apiDeleteEvent(backendId)\r
          .then(function () {\r
            const idx = DB.events.findIndex(ev => String(ev.id) === String(id));\r
            if (idx > -1) { DB.events.splice(idx, 1); }\r
            DB.registrations = DB.registrations.filter(r => String(r.eventId) !== String(id));\r
            renderPage(_currentPage); toast('Event deleted', 'info');\r
          }).catch(function () {\r
            const idx = DB.events.findIndex(ev => String(ev.id) === String(id));\r
            if (idx > -1) { DB.events.splice(idx, 1); saveDB(); }\r
            DB.registrations = DB.registrations.filter(r => String(r.eventId) !== String(id));\r
            renderPage(_currentPage); toast('Event deleted (local)', 'info');\r
          });\r
      });\r
    }\r
    function openViewEventDrawer(id) {\r
      const e = DB.events.find(ev => String(ev.id) === String(id)); if (!e) return;\r
      const regs = DB.registrations.filter(r => String(r.eventId) === String(id));\r
      const assigns = DB.staffAssignments.filter(a => String(a.eventId) === String(id));\r
      const bannerHTML = e.image ? \`\r
        <div style="height:140px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;background:\${e.color || 'var(--accent)'}18">\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\\'font-size:52px;text-align:center;padding:30px 0\\'>\${e.emoji || '📅'}</div>'">\r
        </div>\r
      \` : \`<div style="font-size:52px;text-align:center;margin-bottom:16px">\${e.emoji || '📅'}</div>\`;\r
      openDrawer(e.title, \`\r
    \${bannerHTML}\r
    <span class="badge badge-\${evStatBadge(e.status)} mb-16">\${e.status}</span>\r
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">\r
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">\${e.category}</span></div>\r
      <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">\${e.date} · \${e.time}</span></div>\r
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:200px;text-align:right">\${e.venue}</span></div>\r
      <div class="info-row"><span class="info-label">City</span><span class="info-value">\${e.city || '—'}</span></div>\r
      <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">\${e.registered} / \${e.capacity}</span></div>\r
      <div class="info-row"><span class="info-label">Price</span><span class="info-value" style="color:var(--green)">\${e.price === 0 ? 'Free' : '₹' + e.price}</span></div>\r
      <div class="info-row"><span class="info-label">Registrations</span><span class="info-value">\${regs.length}</span></div>\r
      <div class="info-row"><span class="info-label">Staff Assigned</span><span class="info-value">\${assigns.length}</span></div>\r
    </div>\r
    \${e.description ? \`<div class="label mb-8">Description</div><p class="muted" style="font-size:13px;line-height:1.7">\${e.description}</p>\` : ''}\r
    \${(e.tags || []).length ? \`<div class="label mt-16 mb-8">Tags</div><div class="tag-list">\${e.tags.map(t => \`<span class="tag">\${t}</span>\`).join('')}</div>\` : ''}\r
    \${CU.role === 'organizer' ? \`<div class="flex gap-8 mt-20"><button class="btn btn-primary w-full" onclick="closeDrawer();openEditEventModal('\${id}')">✏️ Edit Event</button></div>\` : ''}\r
  \`);\r
    }\r
\r
    function viewPublicEventDetails(id) {\r
      const e = DB.events.find(ev => ev.id === id); if (!e) return;\r
      const regs = DB.registrations.filter(r => r.eventId === id);\r
      const org = DB.users.find(u => u.id === e.organizer) || { name: '—', avatar: '?' };\r
      const bannerHTML = e.image ? \`\r
        <div style="height:140px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;background:\${e.color || 'var(--accent)'}18">\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\\'font-size:52px;text-align:center;padding:30px 0\\'>\${e.emoji || '📅'}</div>'">\r
        </div>\r
      \` : \`<div style="font-size:52px;text-align:center;margin-bottom:16px">\${e.emoji || '📅'}</div>\`;\r
      const orgAvHTML = org.avatarImage ? \`\r
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--accent-dim);flex-shrink:0;position:relative">\r
          <img src="\${org.avatarImage}" alt="\${org.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:var(--accent);font-weight:700">\${org.avatar || org.name?.[0] || 'O'}</div>\r
        </div>\r
      \` : \`<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">\${org.avatar || org.name?.[0] || 'O'}</div>\`;\r
      openDrawer(e.title, \`\r
    \${bannerHTML}\r
    <span class="badge badge-\${evStatBadge(e.status)} mb-16">\${e.status}</span>\r
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">\r
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">\${e.category}</span></div>\r
      <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">\${e.date} · \${e.time}</span></div>\r
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:200px;text-align:right">\${e.venue}</span></div>\r
      <div class="info-row"><span class="info-label">City</span><span class="info-value">\${e.city || '—'}</span></div>\r
      <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">\${e.registered} / \${e.capacity}</span></div>\r
      <div class="info-row"><span class="info-label">Price</span><span class="info-value" style="color:var(--green)">\${e.price === 0 ? 'Free' : '₹' + e.price}</span></div>\r
    </div>\r
    \${e.description ? \`<div class="label mb-8">Description</div><p style="font-size:13px;line-height:1.7;color:var(--text);margin-bottom:16px">\${e.description}</p>\` : ''}\r
    <div class="label mb-8">Organizer</div>\r
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:8px;margin-bottom:16px">\r
      \${orgAvHTML}\r
      <div style="flex:1;min-width:0">\r
        <div style="font-weight:600">\${org.name}</div>\r
        <div class="small" style="color:var(--text2)">\${org.service || org.bio || 'Professional Event Organizer'}</div>\r
      </div>\r
    </div>\r
    \${(e.tags || []).length ? \`<div class="label mb-8">Tags</div><div class="tag-list">\${e.tags.map(t => \`<span class="tag">\${t}</span>\`).join('')}</div>\` : ''}\r
  \`);\r
    }\r
\r
    function viewEventReport(eventId) {\r
      const e = DB.events.find(ev => ev.id == eventId);\r
      if (!e) return;\r
      const regs = DB.registrations.filter(r => r.eventId == eventId);\r
      const checkedIn = regs.filter(r => r.checkedIn).length;\r
      const totalRevenue = regs.reduce((sum, r) => sum + r.amount, 0);\r
      const avgRating = 4.5;\r
      const reportThumb = e.image ? \`\r
        <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0;background:\${e.color || 'var(--accent)'}20;position:relative">\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\\'font-size:48px\\'>\${e.emoji || '📅'}</div>'">\r
        </div>\r
      \` : \`<div style="font-size:48px">\${e.emoji || '📅'}</div>\`;\r
\r
      openModal(\`Event Report - \${e.title}\`, \`\r
    <div style="background:linear-gradient(135deg,\${e.color}20,\${e.color}05);border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid \${e.color}30">\r
      <div style="display:flex;gap:14px;align-items:center">\r
        \${reportThumb}\r
        <div style="flex:1">\r
          <div style="font-weight:700;font-size:18px;margin-bottom:4px">\${e.title}</div>\r
          <div style="font-size:13px;color:var(--text2)">📅 \${e.date} · 📍 \${e.venue}</div>\r
          <div style="font-size:12px;color:var(--text3);margin-top:6px">\${e.category} • Status: Completed</div>\r
        </div>\r
      </div>\r
    </div>\r
    \r
    <div class="grid-2" style="gap:12px;margin-bottom:20px">\r
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--green)">\r
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REGISTRATIONS</div>\r
        <div style="font-size:24px;font-weight:800;color:var(--green)">\${regs.length}</div>\r
        <div style="font-size:12px;color:var(--text2);margin-top:4px">Attendees registered</div>\r
      </div>\r
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--blue)">\r
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">CHECK-INS</div>\r
        <div style="font-size:24px;font-weight:800;color:var(--blue)">\${checkedIn}</div>\r
        <div style="font-size:12px;color:var(--text2);margin-top:4px">\${Math.round((checkedIn / regs.length) * 100)}% attendance rate</div>\r
      </div>\r
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--green)">\r
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REVENUE</div>\r
        <div style="font-size:24px;font-weight:800;color:var(--green)">₹\${totalRevenue.toLocaleString()}</div>\r
        <div style="font-size:12px;color:var(--text2);margin-top:4px">From ticket sales</div>\r
      </div>\r
      <div style="background:var(--surface2);padding:14px;border-radius:8px;border-left:3px solid var(--yellow)">\r
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">RATING</div>\r
        <div style="font-size:24px;font-weight:800;color:var(--yellow)">⭐ \${avgRating}</div>\r
        <div style="font-size:12px;color:var(--text2);margin-top:4px">Based on attendee reviews</div>\r
      </div>\r
    </div>\r
    \r
    <div style="margin-bottom:16px">\r
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Event Details Summary</div>\r
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">\r
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">\r
          <span>Event Capacity:</span>\r
          <span style="font-weight:600">\${e.capacity} attendees</span>\r
        </div>\r
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">\r
          <span>Occupancy:</span>\r
          <span style="font-weight:600;color:var(--green)">\${Math.round((regs.length / e.capacity) * 100)}%</span>\r
        </div>\r
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">\r
          <span>Ticket Price:</span>\r
          <span style="font-weight:600">₹\${e.price}</span>\r
        </div>\r
        <div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:6px">\r
          <span>Duration:</span>\r
          <span style="font-weight:600">\${e.time} onwards</span>\r
        </div>\r
      </div>\r
    </div>\r
    \r
    <div style="background:var(--surface3);padding:12px;border-radius:8px;border-left:2px solid var(--accent)">\r
      <div style="font-size:12px;color:var(--text2);line-height:1.6">\r
        <strong>Report Generated:</strong> \${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at \${new Date().toLocaleTimeString()}<br>\r
        <strong>Event Status:</strong> Successfully Completed ✓<br>\r
        <strong>Next Step:</strong> Share this report with stakeholders or export as PDF\r
      </div>\r
    </div>\r
  \`, [\r
        { lbl: '📥 Export PDF', cls: 'btn-ghost', fn: 'toast("PDF export feature coming soon","info")' },\r
        { lbl: '📧 Email Report', cls: 'btn-ghost', fn: 'toast("Report will be emailed to organizer","success")' },\r
        { lbl: 'Close', cls: 'btn-primary', fn: 'closeModal()' }\r
      ]);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  BROWSE EVENTS (Attendee)\r
    // ════════════════════════════════════════════════\r
    function pageBrowseEvents() {\r
      const avail = DB.events.filter(e => e.status !== 'completed');\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Browse Events</div><div class="page-sub">Discover and register for upcoming events.</div></div>\r
  </div>\r
  <div class="filter-row">\r
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="be-q" placeholder="Search events…" oninput="refreshBrowse()"></div>\r
    <select class="form-control filter-select" id="be-cat" onchange="refreshBrowse()">\r
      <option value="">All Categories</option><option>Conference</option><option>Corporate</option><option>Concert</option><option>Workshop</option><option>Networking</option>\r
    </select>\r
    <select class="form-control filter-select" id="be-price" onchange="refreshBrowse()">\r
      <option value="">Any Price</option><option value="free">Free Only</option><option value="paid">Paid Only</option>\r
    </select>\r
    <select class="form-control filter-select" id="be-city" onchange="refreshBrowse()">\r
      <option value="">Any City</option>\r
      \${[...new Set(DB.events.map(e => e.city).filter(Boolean))].map(c => \`<option>\${c}</option>\`).join('')}\r
    </select>\r
  </div>\r
  <div class="events-grid" id="browse-grid">\${avail.map(e => evCard(e, 'attendee')).join('')}</div>\`;\r
    }\r
    function refreshBrowse() {\r
      const q = (g('be-q') || {}).value?.toLowerCase() || '';\r
      const cat = (g('be-cat') || {}).value || '';\r
      const price = (g('be-price') || {}).value || '';\r
      const city = (g('be-city') || {}).value || '';\r
      const list = DB.events.filter(e => {\r
        if (e.status === 'completed') return false;\r
        return (!q || e.title.toLowerCase().includes(q))\r
          && (!cat || e.category === cat)\r
          && (!price || (price === 'free' && e.price === 0) || (price === 'paid' && e.price > 0))\r
          && (!city || e.city === city);\r
      });\r
      g('browse-grid').innerHTML = list.map(e => evCard(e, 'attendee')).join('') || \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p class="empty-desc">Try adjusting your filters.</p></div>\`;\r
    }\r
    function regForEvent(eventId) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId));\r
      if (!e || e.status === 'full') { toast(e ? 'Sorry, this event is full' : 'Event not found', 'error'); return; }\r
      const existing = DB.registrations.find(r => String(r.attendeeId) === String(CU.id) && String(r.eventId) === String(eventId));\r
      if (existing) { openViewTicketModal(existing.id); return; }\r
      const regThumb = e.image ? \`\r
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:\${e.color || 'var(--accent)'}20;position:relative">\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\\'font-size:32px\\'>\${e.emoji || '📅'}</span>'">\r
        </div>\r
      \` : \`<span style="font-size:32px">\${e.emoji || '📅'}</span>\`;\r
\r
      // Show registration flow\r
      openModal(\`Register — \${e.title}\`, \`\r
    <div style="background:\${e.color}12;border:1px solid \${e.color}30;border-radius:var(--r-lg);padding:16px;margin-bottom:20px">\r
      <div class="flex items-center gap-12">\r
        \${regThumb}\r
        <div>\r
          <div style="font-weight:700;font-size:15px">\${e.title}</div>\r
          <div class="small">📅 \${e.date} · \${e.time}</div>\r
          <div class="small">📍 \${e.venue}</div>\r
        </div>\r
      </div>\r
    </div>\r
    <div class="info-row" style="padding:8px 0"><span class="info-label">Attendee</span><span class="info-value">\${CU.name}</span></div>\r
    <div class="info-row" style="padding:8px 0"><span class="info-label">Email</span><span class="info-value">\${CU.email}</span></div>\r
    <div class="info-row" style="padding:8px 0 16px"><span class="info-label">Ticket Price</span><span class="info-value" style="color:var(--green);font-size:16px;font-weight:700">\${e.price === 0 ? 'FREE' : '₹' + e.price}</span></div>\r
    \${e.price > 0 ? \`\r
    <div style="background:var(--surface3);border-radius:var(--r);padding:16px;border:1px solid var(--border)">\r
      <div class="h4 mb-12">💳 Payment Information</div>\r
      <div class="form-group"><label class="form-label">Cardholder Name</label><input class="form-control" id="pay-name" placeholder="Name on card" autocomplete="off"></div>\r
      <div class="form-group"><label class="form-label">Card Number *</label><input class="form-control" id="pay-card" placeholder="1234 5678 9012 3456" maxlength="19" oninput="fmtCard(this)"></div>\r
      <div class="grid-2">\r
        <div class="form-group"><label class="form-label">Expiry *</label><input class="form-control" id="pay-exp" placeholder="MM/YY" maxlength="5" oninput="fmtExp(this)"></div>\r
        <div class="form-group"><label class="form-label">CVV *</label><input class="form-control" id="pay-cvv" placeholder="123" maxlength="3" inputmode="numeric" pattern="[0-9]{3}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" autocomplete="cc-csc"></div>\r
      </div>\r
    </div>\`: \`<div style="text-align:center;padding:12px;background:var(--green-dim);border-radius:var(--r);color:var(--green);font-weight:500;font-size:13.5px">✓ This is a free event — no payment required!</div>\`}\r
  \`, [{ lbl: e.price === 0 ? 'Confirm Registration' : 'Pay & Register', cls: 'btn-success', fn: \`confirmReg('\${eventId}')\` }]);\r
    }\r
    function fmtCard(el) { el.value = el.value.replace(/\\D/g, '').replace(/(.{4})/g, '$1 ').trim(); }\r
    function fmtExp(el) { let v = el.value.replace(/\\D/g, ''); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2); el.value = v; }\r
    function confirmReg(eventId) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId)); if (!e) return;\r
      if (e.price > 0) {\r
        const card = v('pay-card').replace(/\\s/g, '');\r
        if (!card || card.length < 16) { toast('Enter a valid 16-digit card number', 'error'); return; }\r
        const exp = v('pay-exp');\r
        if (!exp || exp.length < 5) { toast('Enter expiry date (MM/YY)', 'error'); return; }\r
        const cvvVal = v('pay-cvv'); if (!cvvVal || cvvVal.length < 3 || !/^[0-9]{3}$/.test(cvvVal)) { toast('CVV must be exactly 3 digits (numbers only)', 'error'); return; }\r
      }\r
\r
      // Call backend registration API\r
      const backendEventId = e.eventId || String(eventId);\r
      const attendeeId = CU.userId || CU.id;\r
      apiRegisterForEvent({ attendeeId: String(attendeeId), eventId: backendEventId, ticketType: e.price === 0 ? 'free' : 'standard' })\r
        .then(function (regData) {\r
          // If paid event, also create payment\r
          if (e.price > 0) {\r
            apiMakePayment({ registrationId: regData.registrationId, amount: e.price, paymentMethod: 'CARD', paymentDate: new Date().toISOString().split('T')[0] })\r
              .catch(function () { }); // payment fire-and-forget\r
          }\r
          // Update local DB\r
          const n = DB._nextId.regs++;\r
          const ticketId = regData.ticketId || \`TKT-2026-\${String(n).padStart(3, '0')}\`;\r
          const seat = e.category === 'Conference' ? \`A-\${Math.floor(Math.random() * 200 + 1).toString().padStart(3, '0')}\` : 'GA';\r
          DB.registrations.push({ id: n, attendeeId: CU.id, eventId: e.id, date: today(), ticketId, status: 'confirmed', payment: e.price === 0 ? 'free' : 'paid', amount: e.price, checkedIn: false, seat, verificationId: regData.verificationId || ticketId });\r
          e.registered = Math.min(e.registered + 1, e.capacity);\r
          if (e.registered >= e.capacity) e.status = 'full';\r
          saveDB(); closeModal();\r
          toast('🎉 Registration confirmed! Check your tickets.', 'success');\r
          goNav('my-tickets');\r
        })\r
        .catch(function (err) {\r
          // Fallback: create locally if backend fails\r
          const n = DB._nextId.regs++;\r
          const ticketId = \`TKT-2026-\${String(n).padStart(3, '0')}\`;\r
          const seat = e.category === 'Conference' ? \`A-\${Math.floor(Math.random() * 200 + 1).toString().padStart(3, '0')}\` : 'GA';\r
          DB.registrations.push({ id: n, attendeeId: CU.id, eventId: e.id, date: today(), ticketId, status: 'confirmed', payment: e.price === 0 ? 'free' : 'paid', amount: e.price, checkedIn: false, seat });\r
          e.registered = Math.min(e.registered + 1, e.capacity);\r
          if (e.registered >= e.capacity) e.status = 'full';\r
          saveDB(); closeModal();\r
          toast(err.message || '🎉 Registration confirmed (local)!', err.status === 409 ? 'warning' : 'success');\r
          goNav('my-tickets');\r
        });\r
    }\r
\r
    function cancelTicket(regId) {\r
      const r = DB.registrations.find(reg => reg.id == regId);\r
      if (!r) return;\r
      const e = DB.events.find(ev => ev.id === r.eventId);\r
      confirm2('Cancel Ticket', 'Are you sure you want to cancel this ticket? You will receive a refund within 5-7 business days.', () => {\r
        if (e) e.registered = Math.max(0, e.registered - 1);\r
        const idx = DB.registrations.indexOf(r);\r
        if (idx > -1) DB.registrations.splice(idx, 1);\r
        saveDB();\r
        renderPage(_currentPage);\r
        toast('Ticket cancelled. Refund initiated.', 'success');\r
      });\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  MY TICKETS\r
    // ════════════════════════════════════════════════\r
    function pageMyTickets() {\r
      const regs = DB.registrations.filter(r => r.attendeeId === CU.id);\r
      if (!regs.length) return \`<div class="page-hd"><div class="page-hd-left"><div class="page-title">My Tickets</div></div></div><div class="empty"><div class="empty-icon">🎟️</div><div class="empty-title">No tickets yet</div><p class="empty-desc">Browse events and register to get your tickets here.</p><button class="btn btn-primary mt-16" onclick="goNav('browse-events')">Browse Events</button></div>\`;\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">My Tickets</div><div class="page-sub">\${regs.length} ticket(s)</div></div>\r
  </div>\r
  <div style="display:flex;flex-direction:column;gap:16px">\r
    \${regs.map(r => {\r
        const e = DB.events.find(ev => ev.id === r.eventId) || { title: 'Unknown', emoji: '🎟️', color: '#7c6ff7', venue: '', date: '', time: '' };\r
        return ticketCard(r, e);\r
      }).join('')}\r
  </div>\`;\r
    }\r
    function ticketCard(r, e) {\r
      const qr = renderTicketQRCode(r.verificationId || r.ticketId);\r
      return \`<div class="ticket">\r
    <div class="ticket-top">\r
      <div class="flex justify-between items-start">\r
        <div style="flex:1;min-width:0">\r
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">\r
            <span style="font-size:28px">\${e.emoji}</span>\r
            <span class="badge badge-\${evStatBadge(e.status)}">\${e.status}</span>\r
          </div>\r
          <div style="font-family:var(--font-head);font-size:17px;font-weight:700;line-height:1.3;margin-bottom:8px">\${e.title}</div>\r
          <div class="small" style="margin-bottom:2px">📅 \${e.date} · \${e.time}</div>\r
          <div class="small">📍 \${e.venue}</div>\r
        </div>\r
        <div class="qr-box ticket-qr" style="margin-left:16px">\${qr}</div>\r
      </div>\r
    </div>\r
    <div class="ticket-divider"><div class="ticket-notch-l"></div><div class="ticket-notch-r"></div></div>\r
    <div class="ticket-bot">\r
      <div class="grid-2" style="gap:8px">\r
        <div><div class="label mb-4">Attendee</div><div style="font-weight:500;font-size:13.5px">\${CU.name}</div></div>\r
        <div><div class="label mb-4">Ticket ID</div><div class="mono">\${r.ticketId}</div></div>\r
        <div><div class="label mb-4">Seat / Zone</div><div style="font-weight:500;font-size:13.5px">\${r.seat || 'GA'}</div></div>\r
        <div><div class="label mb-4">Amount</div><div style="font-weight:700;font-size:15px;color:var(--green)">\${r.amount === 0 ? 'Free' : '₹' + r.amount}</div></div>\r
      </div>\r
      <div class="flex justify-between items-center mt-12">\r
        <span class="badge badge-\${r.checkedIn ? 'green' : 'purple'}">\${r.checkedIn ? '✅ Checked In' : '⏳ Not Yet Checked In'}</span>\r
        <span class="badge badge-green">✓ \${r.payment === 'free' ? 'Free Ticket' : 'Payment Confirmed'}</span>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
    function makeQR() {\r
      const cells = Array.from({ length: 25 }, () => Math.random() > 0.5);\r
      return cells.map(on => \`<div class="qr-cell\${on ? ' on' : ''}"></div>\`).join('');\r
    }\r
    function openViewTicketModal(regId) {\r
      const r = DB.registrations.find(r => r.id == regId); if (!r) return;\r
      const e = DB.events.find(ev => ev.id === r.eventId) || { title: 'Event', emoji: '🎟️', venue: '', date: '', time: '' };\r
      openModal('Your Ticket', ticketCard(r, e), [], false);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  ATTENDEE MANAGEMENT\r
    // ════════════════════════════════════════════════\r
    function pageAttendees() {\r
      const myEvents = DB.events.filter(e => e.organizer === CU.id);\r
      const selectedEventId = parseInt(sessionStorage.getItem('org_attendees_event') || myEvents[0]?.id || '');\r
      const selectedEvent = DB.events.find(e => e.id === selectedEventId);\r
      const isPrivateEvent = selectedEvent && (selectedEvent.category === 'Wedding' || selectedEvent.tags?.includes('Private'));\r
\r
      const regs = CU.role === 'organizer' ?\r
        DB.registrations.filter(r => selectedEventId ? r.eventId === selectedEventId : selectedEvent && r.eventId === selectedEvent.id) :\r
        (CU.role === 'superuser' ? DB.registrations : DB.registrations.filter(r => { const e = DB.events.find(ev => ev.id === r.eventId); return e && e.organizer === CU.id; }));\r
      const checkedIn = regs.filter(r => r.checkedIn).length;\r
      const approved = regs.filter(r => r.approved || r.status === 'confirmed').length;\r
\r
      if (CU.role === 'organizer' && myEvents.length > 0) {\r
        return \`\r
    <div class="page-hd">\r
      <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">\${regs.length} total · \${approved} approved</div></div>\r
      <div class="page-hd-right">\r
      </div>\r
    </div>\r
    <div class="card mb-16" style="padding:16px">\r
      <label class="label mb-8">Select Event</label>\r
      <select class="form-control" onchange="switchOrganizerEvent(this.value)">\r
        \${myEvents.map(e => \`<option value="\${e.id}" \${e.id === selectedEventId ? 'selected' : ''}>\${e.title} (\${e.registered} registered)</option>\`).join('')}\r
      </select>\r
      \${isPrivateEvent ? \`<div class="badge badge-blue mt-8" style="display:inline-block">🔒 Private Event</div>\` : ''} \r
    </div>\r
    <div class="filter-row">\r
      <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" placeholder="Search attendees…" oninput="refreshAttendees()"></div>\r
      \${isPrivateEvent ? \`<select class="form-control filter-select" id="at-status" onchange="refreshAttendees()">\r
        <option value="">All Status</option>\r
        <option value="approved">Approved</option>\r
        <option value="pending">Pending Review</option>\r
        <option value="rejected">Rejected</option>\r
      </select>\`: \`\`}\r
    </div>\r
    <div id="attendees-tbl">\${buildOrganizerAttendeesTbl(regs, selectedEvent, isPrivateEvent)}</div>\r
    \`;\r
      }\r
\r
      const checkedIn2 = regs.filter(r => r.checkedIn).length;\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">\${regs.length} total · \${checkedIn2} checked in</div></div>\r
    <div class="page-hd-right">\r
      <button class="btn btn-ghost" onclick="toast('Exported to CSV','success')">📥 Export CSV</button>\r
    </div>\r
  </div>\r
  <div class="filter-row">\r
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" placeholder="Search attendees…" oninput="refreshAttendees()"></div>\r
    <select class="form-control filter-select" id="at-ev" onchange="refreshAttendees()">\r
      <option value="">All Events</option>\r
      \${DB.events.map(e => \`<option value="\${e.id}">\${e.title}</option>\`).join('')}\r
    </select>\r
    <select class="form-control filter-select" id="at-ci" onchange="refreshAttendees()">\r
      <option value="">All</option><option value="in">Checked In</option><option value="out">Not Checked In</option>\r
    </select>\r
  </div>\r
  <div id="attendees-tbl">\${buildAttendeesTbl(regs)}</div>\`;\r
    }\r
\r
    function switchOrganizerEvent(eventId) {\r
      sessionStorage.setItem('org_attendees_event', eventId);\r
      renderPage('attendees');\r
    }\r
\r
    function buildOrganizerAttendeesTbl(regs, event, isPrivate) {\r
      const q = (g('at-q') || {}).value?.toLowerCase() || '';\r
      const status = (g('at-status') || {}).value || '';\r
      const filtered = regs.filter(r => {\r
        const u = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: '', email: '' };\r
        const matchesSearch = !q || (u.name + u.email + r.ticketId).toLowerCase().includes(q);\r
        const matchesStatus = !status || (status === 'approved' && (r.approved || r.status === 'confirmed')) || (status === 'pending' && !r.approved && r.status !== 'rejected') || (status === 'rejected' && r.status === 'rejected');\r
        return matchesSearch && matchesStatus;\r
      });\r
\r
      if (!filtered.length) return \`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No attendees found</div></div>\`;\r
\r
      return \`<div class="table-wrap"><table>\r
    <thead><tr><th>Attendee</th><th>Email</th><th>Ticket ID</th><th>Amount</th><th>\${isPrivate ? 'Approval Status' : 'Arrival'}</th><th>Actions</th></tr></thead>\r
    <tbody>\${filtered.map(r => {\r
        const u = DB.users.find(u => String(u.id) === String(r.attendeeId)) || { name: 'Unknown', email: '', avatar: '?', phone: '' };\r
        const status = r.approved ? 'Approved' : (r.status === 'rejected' ? 'Rejected' : 'Pending');\r
        return \`<tr>\r
        <td><div class="flex items-center gap-8"><div class="av av-xs">\${u.avatar || u.name[0]}</div><div><div style="font-weight:500">\${u.name}</div><div class="small">\${u.phone || '—'}</div></div></div></td>\r
        <td class="small">\${u.email}</td>\r
        <td><code class="mono" style="background:var(--surface3);padding:2px 6px;border-radius:5px">\${r.ticketId}</code></td>\r
        <td style="color:var(--green);font-weight:600">\${r.amount === 0 ? 'Free' : '₹' + r.amount}</td>\r
        <td><span class="badge badge-\${status === 'Approved' ? 'green' : status === 'Rejected' ? 'red' : 'yellow'}">\${status}</span></td>\r
        <td><div class="actions">\r
          \${status === 'Pending' ? \`<button class="btn btn-success btn-xs" onclick="organiserApproveAttendee('\${r.id}')">✓ Approve</button><button class="btn btn-danger btn-xs" onclick="organiserRejectAttendee('\${r.id}')">✕ Reject</button>\` : \`<button class="btn btn-ghost btn-xs" onclick="viewAttendeeProfile('\${u.id}','\${u.name}','\${u.email}','\${u.phone}')">Profile</button>\`}\r
        </div></td>\r
      </tr>\`;\r
      }).join('')}</tbody>\r
  </table></div>\`;\r
    }\r
\r
    function organiserApproveAttendee(regId) {\r
      const r = DB.registrations.find(r => String(r.id) === String(regId));\r
      if (r) {\r
        r.approved = true;\r
        r.status = 'confirmed';\r
        saveDB();\r
        renderPage('attendees');\r
        toast('Attendee approved!', 'success');\r
      }\r
    }\r
\r
    function organiserRejectAttendee(regId) {\r
      confirm2('Reject Attendee', 'Are you sure you want to reject and remove this attendee?', () => {\r
        const i = DB.registrations.findIndex(r => String(r.id) === String(regId));\r
        if (i > -1) {\r
          const ev = DB.events.find(e => String(e.id) === String(DB.registrations[i].eventId));\r
          if (ev && ev.registered > 0) { ev.registered--; if (ev.status === 'full') ev.status = 'upcoming'; }\r
          DB.registrations.splice(i, 1);\r
          saveDB();\r
          renderPage('attendees');\r
          toast('Attendee rejected and removed', 'info');\r
        }\r
      });\r
    }\r
\r
    function viewAttendeeProfile(userId, name, email, phone) {\r
      const u = DB.users.find(u => String(u.id) === String(userId)) || {};\r
      openDrawer(\`\${name} - Attendee Profile\`, \`\r
    <div style="display:flex;flex-direction:column;gap:16px">\r
      <div class="av av-lg" style="width:80px;height:80px;font-size:32px">\${u.avatar || name[0]}</div>\r
      <div>\r
        <div class="label">Name</div>\r
        <div style="font-weight:500">\${name}</div>\r
      </div>\r
      <div>\r
        <div class="label">Email</div>\r
        <div class="small">\${email}</div>\r
      </div>\r
      <div>\r
        <div class="label">Phone</div>\r
        <div class="small">\${phone || '—'}</div>\r
      </div>\r
      \${u.bio ? \`<div>\r
        <div class="label">Bio</div>\r
        <p class="small" style="color:var(--text2)">\${u.bio}</p>\r
      </div>\`: ''}\r
    </div>\r
  \`);\r
    }\r
    function buildAttendeesTbl(regs) {\r
      if (!regs.length) return \`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">No registrations found</div></div>\`;\r
      return \`<div class="table-wrap"><table>\r
    <thead><tr><th>Attendee</th><th>Event</th><th>Ticket ID</th><th>Seat</th><th>Amount</th><th>Check-In</th><th>Actions</th></tr></thead>\r
    <tbody>\${regs.map(r => {\r
        const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '', avatar: '?' };\r
        const e = DB.events.find(ev => ev.id === r.eventId) || { title: '—' };\r
        return \`<tr>\r
        <td><div class="flex items-center gap-8"><div class="av av-xs">\${u.avatar || u.name[0]}</div><div><div style="font-weight:500">\${u.name}</div><div class="small">\${u.email}</div></div></div></td>\r
        <td class="truncate" style="max-width:160px;font-size:13px">\${e.title}</td>\r
        <td><code class="mono" style="background:var(--surface3);padding:2px 6px;border-radius:5px">\${r.ticketId}</code></td>\r
        <td class="muted">\${r.seat || 'GA'}</td>\r
        <td style="color:var(--green);font-weight:600">\${r.amount === 0 ? 'Free' : '₹' + r.amount}</td>\r
        <td><span class="badge badge-\${r.checkedIn ? 'green' : 'gray'}">\${r.checkedIn ? '✓ In' : 'Pending'}</span></td>\r
        <td><div class="actions">\r
          \${!r.checkedIn ? \`<button class="btn btn-success btn-xs" onclick="scanQR(\${r.id},'\${r.ticketId}')">📱 Scan QR</button>\` : '<span class="small" style="color:var(--text3)">Verified</span>'}\r
          <button class="btn btn-xs btn-danger" onclick="cancelReg('\${r.id}')">🗑️</button>\r
        </div></td>\r
      </tr>\`;\r
      }).join('')}</tbody>\r
  </table></div>\`;\r
    }\r
    function refreshAttendees() {\r
      if (CU.role === 'organizer') {\r
        const q = (g('at-q') || {}).value?.toLowerCase() || '';\r
        const status = (g('at-status') || {}).value || '';\r
        const selectedEventId = parseInt(sessionStorage.getItem('org_attendees_event') || '');\r
        const selectedEvent = DB.events.find(e => e.id === selectedEventId);\r
        const isPrivate = selectedEvent && (selectedEvent.category === 'Wedding' || selectedEvent.tags?.includes('Private'));\r
\r
        let regs = DB.registrations.filter(r => selectedEventId ? r.eventId === selectedEventId : selectedEvent && r.eventId === selectedEvent.id);\r
        regs = regs.filter(r => {\r
          const u = DB.users.find(u => u.id === r.attendeeId) || { name: '', email: '' };\r
          const matchesSearch = !q || (u.name + u.email + r.ticketId).toLowerCase().includes(q);\r
          const matchesStatus = !status || (status === 'approved' && (r.approved || r.status === 'confirmed')) || (status === 'pending' && !r.approved && r.status !== 'rejected') || (status === 'rejected' && r.status === 'rejected');\r
          return matchesSearch && matchesStatus;\r
        });\r
        g('attendees-tbl').innerHTML = buildOrganizerAttendeesTbl(regs, selectedEvent, isPrivate);\r
      } else {\r
        const q = (g('at-q') || {}).value?.toLowerCase() || '';\r
        const evId = parseInt((g('at-ev') || {}).value) || 0;\r
        const ci = (g('at-ci') || {}).value || '';\r
        const regs = (CU.role === 'superuser' ? DB.registrations : DB.registrations.filter(r => { const e = DB.events.find(ev => ev.id === r.eventId); return e && e.organizer === CU.id; })).filter(r => {\r
          const u = DB.users.find(u => u.id === r.attendeeId) || { name: '', email: '' };\r
          return (!q || (u.name + u.email + r.ticketId).toLowerCase().includes(q))\r
            && (!evId || r.eventId === evId)\r
            && (!ci || (ci === 'in' && r.checkedIn) || (ci === 'out' && !r.checkedIn));\r
        });\r
        g('attendees-tbl').innerHTML = buildAttendeesTbl(regs);\r
      }\r
    }\r
    function scanQR(regId, ticketId) {\r
      const r = DB.registrations.find(r => r.id == regId);\r
      if (r) {\r
        r.checkedIn = true;\r
        saveDB();\r
        openModal('QR Code Verified', \`\r
      <div style="text-align:center;padding:20px">\r
        <div style="font-size:48px;margin-bottom:16px">✅</div>\r
        <div style="font-weight:700;font-size:18px;margin-bottom:8px">Check-in Successful</div>\r
        <div style="color:var(--text2);margin-bottom:20px">Ticket: <code class="mono" style="background:var(--surface3);padding:4px 8px;border-radius:5px">\${ticketId}</code></div>\r
        <div style="background:var(--green-dim);border-radius:8px;padding:12px;color:var(--green);font-weight:500">Attendee verified and checked in</div>\r
      </div>\r
    \`, [{ lbl: 'Close', cls: 'btn-primary', fn: 'closeModal()' }]);\r
        refreshAttendees();\r
        toast('✅ Attendee verified via QR scan', 'success');\r
      }\r
    }\r
\r
    // Quick verify: marks checkedIn + rerenders page (no modal, instant list move)\r
    function quickVerify(regId) {\r
      const r = DB.registrations.find(reg => reg.id == regId);\r
      if (!r) { toast('Registration not found', 'error'); return; }\r
      if (r.checkedIn) { toast('Already verified!', 'warning'); return; }\r
      r.checkedIn = true;\r
      saveDB();\r
      renderPage('attendeeVerification');\r
      toast('✅ Attendee verified and moved to checked-in!', 'success');\r
    }\r
\r
    function pageAttendeeVerification() {\r
      const myAssignments = DB.staffAssignments.filter(a => a.staffId === CU.id && a.status === 'accepted');\r
      const eventOptions = myAssignments.map(a => {\r
        const e = DB.events.find(ev => ev.id === a.eventId) || { title: 'Event' };\r
        return e;\r
      }).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);\r
\r
      const selectedEventId = parseInt(sessionStorage.getItem('verify_eventId') || eventOptions[0]?.id || '');\r
      // Always persist so QR scan functions can use it reliably\r
      if (!isNaN(selectedEventId)) sessionStorage.setItem('verify_eventId', selectedEventId);\r
      const selectedEvent = DB.events.find(e => e.id === selectedEventId);\r
\r
      if (!selectedEvent) return \`<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No Assigned Events</div><p>You don't have any event staff assignments yet.</p></div>\`;\r
\r
      const eventRegs = DB.registrations.filter(r => r.eventId === selectedEventId);\r
      const checkedIn = eventRegs.filter(r => r.checkedIn);\r
      const pending = eventRegs.filter(r => !r.checkedIn);\r
      const showDemoTicket = CU.role === 'staff' && !isDepartmentEmployee();\r
      const demoTicket = pending.find(r => r.ticketId) || eventRegs.find(r => r.ticketId);\r
\r
      let html = \`<div class="page-hd"><div class="page-hd-left"><div class="page-title">Attendee Verification</div></div></div>\r
  <div class="card" style="padding:24px;margin-bottom:20px">\r
    <div class="form-group mb-16">\r
      <label class="form-label">Select Event</label>\r
      <select class="form-control" onchange="selectEventForVerification(this.value)">\r
        \${eventOptions.map(e => \`<option value="\${e.id}" \${e.id === selectedEventId ? 'selected' : ''}>📅 \${e.title} (\${e.date})</option>\`).join('')}\r
      </select>\r
    </div>\r
    <div class="grid-3" style="gap:12px;margin-top:16px">\r
      <div style="background:var(--surface2);padding:16px;border-radius:12px">\r
        <div class="label mb-4">Total Attendees</div>\r
        <div style="font-size:28px;font-weight:800;color:var(--accent)">\${eventRegs.length}</div>\r
      </div>\r
      <div style="background:var(--green-dim);padding:16px;border-radius:12px">\r
        <div class="label mb-4" style="color:var(--green)">Verified</div>\r
        <div style="font-size:28px;font-weight:800;color:var(--green)">\${checkedIn.length}</div>\r
      </div>\r
      <div style="background:var(--yellow-dim);padding:16px;border-radius:12px">\r
        <div class="label mb-4" style="color:var(--yellow)">Pending</div>\r
        <div style="font-size:28px;font-weight:800;color:var(--yellow)">\${pending.length}</div>\r
      </div>\r
    </div>\r
  </div>\r
  <div class="card ticket-scanner">\r
    <div class="ticket-scanner-head">\r
      <div class="h4">Scan Ticket</div>\r
      <button class="btn btn-primary btn-sm" id="ticket-scan-start" onclick="startTicketScan()">Scan QR</button>\r
      <button class="btn btn-warning btn-sm" id="ticket-scan-stop" onclick="stopTicketScan()" hidden>Stop</button>\r
    </div>\r
    <div class="ticket-camera" id="ticket-camera" hidden>\r
      <video id="ticket-camera-video" autoplay muted playsinline aria-label="Camera preview"></video>\r
    </div>\r
    <div class="ticket-manual-entry">\r
      <input class="form-control" id="qr-input" placeholder="Ticket ID" aria-label="Ticket ID" oninput="handleQRInput(this.value)" onkeydown="if (event.key === &quot;Enter&quot;) submitQRScan()">\r
      <button class="btn btn-success" onclick="submitQRScan()">Verify</button>\r
    </div>\r
    <p class="small ticket-scan-status" id="ticket-scan-status" role="status" aria-live="polite" hidden></p>\r
  </div>\r
  <div class="card" style="padding:24px;margin-bottom:20px">\r
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">\r
      <div class="h4" style="margin:0">Verified Attendees (\${checkedIn.length})</div>\r
      <button class="btn btn-sm btn-success" onclick="sendAttendanceReport('\${selectedEventId}')">Send Report</button>\r
    </div>\r
    <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">\r
      \${checkedIn.map(r => {\r
        const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
        return \`<div style="padding:12px;background:var(--green-dim);border-radius:8px;display:flex;justify-content:space-between;align-items:center;border-left:3px solid var(--green)">\r
          <div><div style="font-weight:500">\${u.name}</div><div class="small">\${r.ticketId}</div></div>\r
          <span class="badge badge-green">OK</span>\r
        </div>\`;\r
      }).join('')}\r
    </div>\r
  </div>\r
  \${showDemoTicket ? \`\r
  <div class="card demo-ticket-card">\r
    <div class="h4 mb-12">Demo Ticket Number</div>\r
    <div class="demo-ticket-content">\r
      \${demoTicket ? '<div class="qr-box ticket-qr">' + renderTicketQRCode(demoTicket.verificationId || demoTicket.ticketId) + '</div>' : ''}\r
      <code class="mono demo-ticket-number">\${demoTicket?.ticketId || 'TKT-DEMO-001'}</code>\r
      \${!demoTicket ? '<span class="small">No registered tickets</span>' : demoTicket.checkedIn ? '<span class="badge badge-green">Verified</span>' : ''}\r
      <button class="btn btn-primary btn-sm" onclick="useDemoTicketForVerification()" \${!demoTicket || demoTicket.checkedIn ? 'disabled' : ''}>Use Ticket</button>\r
    </div>\r
  </div>\r
  \` : \`\r
  <div class="card" style="padding:24px">\r
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">\r
      <div class="h4" style="margin:0">Pending Verification (\${pending.length})</div>\r
      <button class="btn btn-sm btn-warning" onclick="exportPendingList('\${selectedEventId}')">Export List</button>\r
    </div>\r
    <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center;background:var(--surface2);padding:12px;border-radius:10px">\r
      <input class="form-control" id="pending-ticket-search" placeholder="🔍 Type ticket ID to find in pending list…" style="flex:1" oninput="filterPendingList(this.value)">\r
    </div>\r
    <div id="pending-list" style="display:flex;flex-direction:column;gap:8px;max-height:350px;overflow-y:auto">\r
      \${pending.map(r => {\r
        const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
        return \`<div class="pending-row" data-ticket="\${r.ticketId.toLowerCase()}" data-name="\${u.name.toLowerCase()}" style="padding:14px 16px;background:var(--yellow-dim);border-radius:8px;display:flex;justify-content:space-between;align-items:center;border-left:3px solid var(--yellow);transition:all 0.2s">\r
          <div>\r
            <div style="font-weight:600;font-size:14px">\${u.name}</div>\r
            <div class="small" style="color:var(--text2)">\${u.email}</div>\r
            <div class="small" style="font-family:monospace;color:var(--accent);margin-top:2px">\${r.ticketId}</div>\r
          </div>\r
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">\r
            <span class="badge" style="background:var(--yellow-dim);color:var(--yellow);border:1px solid var(--yellow)">⏳ Pending</span>\r
            <span class="small" style="color:var(--text3)">Registered \${r.date || '—'}</span>\r
            <button onclick="quickVerify('\${r.id}')" style="margin-top:2px;padding:5px 14px;background:var(--green);color:#07100d;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px" onmouseover="this.style.background='#1ab88d'" onmouseout="this.style.background='var(--green)'">✔ Verify</button>\r
          </div>\r
        </div>\`;\r
      }).join('')}\r
      \${pending.length === 0 ? \`<div class="empty" style="padding:20px"><div class="empty-icon">✅</div><div class="empty-title">All Verified!</div></div>\` : ''}\r
    </div>\r
  </div>\r
  \`}\`;\r
      return html;\r
    }\r
\r
    function useDemoTicketForVerification() {\r
      const selectedEventId = sessionStorage.getItem('verify_eventId');\r
      const ticket = DB.registrations.find(r =>\r
        String(r.eventId) === String(selectedEventId) && !r.checkedIn && r.ticketId\r
      );\r
      const input = g('qr-input');\r
      if (!ticket || !input) return;\r
      input.value = ticket.ticketId;\r
      input.style.borderColor = 'var(--green)';\r
      input.focus();\r
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });\r
    }\r
\r
    function selectEventForVerification(eventId) {\r
      sessionStorage.setItem('verify_eventId', eventId);\r
      renderPage('attendeeVerification');\r
    }\r
\r
    function handleQRInput(value) {\r
      const input = g('qr-input');\r
      if (!input) return;\r
      const ticketId = String(value || '').trim().toUpperCase();\r
      const selectedEventId = sessionStorage.getItem('verify_eventId');\r
      const reg = DB.registrations.find(r =>\r
        (String(r.ticketId || '').toUpperCase() === ticketId || String(r.verificationId || '').toUpperCase() === ticketId) &&\r
        String(r.eventId) === String(selectedEventId)\r
      );\r
      input.style.borderColor = reg ? 'var(--green)' : 'var(--border)';\r
    }\r
\r
    function submitQRScan() {\r
      const ticketId = g('qr-input').value.trim().toUpperCase();\r
      if (!ticketId) { toast('Enter or scan a ticket ID', 'warning'); return; }\r
\r
      const selectedEventId = sessionStorage.getItem('verify_eventId');\r
      const reg = DB.registrations.find(r =>\r
        (String(r.ticketId || '').toUpperCase() === ticketId || String(r.verificationId || '').toUpperCase() === ticketId) &&\r
        String(r.eventId) === String(selectedEventId)\r
      );\r
\r
      if (!reg) { toast('Ticket not found for this event', 'error'); return; }\r
      if (reg.checkedIn) { toast('Already checked in', 'warning'); return; }\r
\r
      g('qr-input').value = '';\r
      quickVerify(reg.id);\r
    }\r
\r
    function markAsVerified(regId) {\r
      quickVerify(regId);\r
    }\r
\r
    function filterPendingList(query) {\r
      const q = query.toLowerCase().trim();\r
      const rows = document.querySelectorAll('#pending-list .pending-row');\r
      let anyMatch = false;\r
      rows.forEach(row => {\r
        const ticket = row.dataset.ticket || '';\r
        const name = row.dataset.name || '';\r
        const match = !q || ticket.includes(q) || name.includes(q);\r
        row.style.display = match ? '' : 'none';\r
        if (match) anyMatch = true;\r
        // highlight matching tickets\r
        if (q && match) {\r
          row.style.borderLeftColor = 'var(--accent)';\r
          row.style.background = 'rgba(99,102,241,0.1)';\r
        } else {\r
          row.style.borderLeftColor = 'var(--yellow)';\r
          row.style.background = 'var(--yellow-dim)';\r
        }\r
      });\r
    }\r
\r
    function sendAttendanceReport(eventId) {\r
      const eventRegs = DB.registrations.filter(r => r.eventId == eventId);\r
      const checkedIn = eventRegs.filter(r => r.checkedIn);\r
      const event = DB.events.find(e => e.id == eventId) || { title: 'Event' };\r
      const organizer = DB.users.find(u => u.id === event.organizer);\r
\r
      const report = {\r
        eventId,\r
        eventTitle: event.title,\r
        eventDate: event.date,\r
        sentBy: CU.name,\r
        sentByRole: CU.role,\r
        sentAt: new Date().toLocaleString(),\r
        totalAttendees: eventRegs.length,\r
        checkedIn: checkedIn.length,\r
        noShow: eventRegs.length - checkedIn.length,\r
        attendanceRate: Math.round((checkedIn.length / Math.max(eventRegs.length, 1)) * 100),\r
        attendees: checkedIn.map(r => {\r
          const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
          return { name: u.name, email: u.email, ticketId: r.ticketId, seat: r.seat };\r
        })\r
      };\r
\r
      saveAttendanceReport(eventId, report);\r
      saveDB();\r
\r
      openModal('Report Sent Successfully', \`\r
    <div style="text-align:center;padding:20px">\r
      <div style="font-size:48px;margin-bottom:16px">OK</div>\r
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">Attendance Report Submitted</div>\r
      <div style="background:var(--surface2);padding:16px;border-radius:8px;text-align:left;margin:16px 0">\r
        <div><strong>Event:</strong> \${report.eventTitle}</div>\r
        <div><strong>Total:</strong> \${report.totalAttendees} attendees</div>\r
        <div><strong>Verified:</strong> \${report.checkedIn} (\${report.attendanceRate}%)</div>\r
        <div><strong>Sent to:</strong> \${organizer?.name || 'Event Organizer'}</div>\r
      </div>\r
    </div>\r
  \`, [{ lbl: 'Done', cls: 'btn-primary', fn: 'closeModal()' }]);\r
    }\r
\r
    function exportPendingList(eventId) {\r
      const eventRegs = DB.registrations.filter(r => r.eventId == eventId && !r.checkedIn);\r
      const event = DB.events.find(e => e.id == eventId) || { title: 'Event' };\r
      const csv = 'Name,Email,Ticket ID\\n' + eventRegs.map(r => {\r
        const u = DB.users.find(uu => uu.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
        return \`"\${u.name}",\${u.email},\${r.ticketId}\`;\r
      }).join('\\n');\r
\r
      const blob = new Blob([csv], { type: 'text/csv' });\r
      const url = URL.createObjectURL(blob);\r
      const a = document.createElement('a');\r
      a.href = url;\r
      a.download = \`pending_attendees_\${event.title}_\${new Date().toISOString().split('T')[0]}.csv\`;\r
      a.click();\r
      URL.revokeObjectURL(url);\r
      toast('List exported as CSV', 'success');\r
    }\r
    function cancelReg(regId) {\r
      confirm2('Cancel Registration', 'Cancel this registration? This cannot be undone.', () => {\r
        const i = DB.registrations.findIndex(r => r.id == regId);\r
        if (i > -1) {\r
          const ev = DB.events.find(e => e.id === DB.registrations[i].eventId);\r
          if (ev && ev.registered > 0) { ev.registered--; if (ev.status === 'full') ev.status = 'upcoming'; }\r
          DB.registrations.splice(i, 1); saveDB(); refreshAttendees(); toast('Registration cancelled', 'info');\r
        }\r
      });\r
    }\r
\r
    function generateReport() {\r
      const regs = CU.role === 'superuser' ? DB.registrations : DB.registrations.filter(r => { const e = DB.events.find(ev => ev.id === r.eventId); return e && e.organizer === CU.id; });\r
      const checkedIn = regs.filter(r => r.checkedIn);\r
      const report = \`\r
    <div style="background:var(--surface2);border-radius:12px;padding:20px;margin-bottom:16px">\r
      <div class="h4 mb-12">📊 Attendance Report</div>\r
      <div class="grid-2" style="gap:12px;margin-bottom:16px">\r
        <div><div class="label mb-4">Total Registrations</div><div style="font-size:24px;font-weight:800;color:var(--accent)">\${regs.length}</div></div>\r
        <div><div class="label mb-4">Checked In</div><div style="font-size:24px;font-weight:800;color:var(--green)">\${checkedIn.length}</div></div>\r
        <div><div class="label mb-4">No-Show</div><div style="font-size:24px;font-weight:800;color:var(--red)">\${regs.length - checkedIn.length}</div></div>\r
        <div><div class="label mb-4">Attendance Rate</div><div style="font-size:24px;font-weight:800;color:var(--blue)">\${Math.round((checkedIn.length / Math.max(regs.length, 1)) * 100)}%</div></div>\r
      </div>\r
    </div>\r
    <div class="h4 mb-12">📋 Attendee List</div>\r
    <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto">\r
      \${regs.map(r => {\r
        const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
        return \`<div style="display:flex;justify-content:space-between;padding:8px;background:var(--surface3);border-radius:8px;align-items:center">\r
          <div>\r
            <div style="font-weight:500;font-size:13px">\${u.name}</div>\r
            <div class="small" style="color:var(--text3)">\${u.email}</div>\r
          </div>\r
          <span class="badge badge-\${r.checkedIn ? 'green' : 'gray'}">\${r.checkedIn ? 'OK Present' : 'Absent'}</span>\r
        </div>\`;\r
      }).join('')}\r
    </div>\r
  \`;\r
      openDrawer('Attendance Report', report);\r
    }\r
\r
    function pageStaffAvailability() {\r
      const staff = DB.users.find(u => u.id === CU.id) || {};\r
      const month = parseInt(sessionStorage.getItem('avail_month') || new Date().getMonth());\r
      const year = parseInt(sessionStorage.getItem('avail_year') || new Date().getFullYear());\r
      const date = new Date(year, month, 1);\r
      const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });\r
      const firstDay = new Date(year, month, 1).getDay();\r
      const daysInMonth = new Date(year, month + 1, 0).getDate();\r
      const prevMonth = month === 0 ? 11 : month - 1;\r
      const prevYear = month === 0 ? year - 1 : year;\r
      const nextMonth = month === 11 ? 0 : month + 1;\r
      const nextYear = month === 11 ? year + 1 : year;\r
      const today = new Date();\r
      const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth() + 1).padStart(2, '0')}-\${String(today.getDate()).padStart(2, '0')}\`;\r
\r
      const avail = getAvailability(CU.id);\r
\r
      // Booked dates = accepted assignment event dates\r
      if (!DB.staffBooked) DB.staffBooked = {};\r
      const myAssignments = DB.staffAssignments.filter(a => String(a.staffId) === String(CU.id) && a.status === 'accepted');\r
      const assignedDates = myAssignments.map(a => {\r
        const ev = DB.events.find(e => String(e.id) === String(a.eventId));\r
        return ev ? ev.date : '';\r
      }).filter(d => d);\r
      // Merge booked from DB.staffBooked + live assigned dates\r
      const bookedDates = [...new Set([\r
        ...(DB.staffBooked[String(CU.id)] || []),\r
        ...assignedDates\r
      ])];\r
\r
      // Format a date string "YYYY-MM-DD" -> "Mon DD"\r
      function fmtChip(d) {\r
        const dt = new Date(d + 'T00:00:00');\r
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });\r
      }\r
\r
      return \`\r
  <div style="padding:24px 20px;background:var(--bg);max-width:900px;margin:0 auto">\r
\r
    <!-- Page header -->\r
    <div style="margin-bottom:24px">\r
      <div class="h2" style="margin-bottom:4px">My Availability</div>\r
      <div class="muted">Mark your available dates for event assignments</div>\r
    </div>\r
\r
    <!-- Calendar Card -->\r
    <div class="card" style="padding:28px;margin-bottom:20px;border-color:var(--border2)">\r
      <!-- Month nav -->\r
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">\r
        <button onclick="changeMonth(\${prevMonth},\${prevYear})" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;transition:background .18s" onmouseover="this.style.background='#6b5ee6'" onmouseout="this.style.background='var(--accent)'">← Previous</button>\r
        <div style="font-weight:700;font-size:17px;color:var(--text)">\${monthStr}</div>\r
        <button onclick="changeMonth(\${nextMonth},\${nextYear})" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;transition:background .18s" onmouseover="this.style.background='#6b5ee6'" onmouseout="this.style.background='var(--accent)'">Next →</button>\r
      </div>\r
      <!-- Day headers -->\r
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center;margin-bottom:4px">\r
        \${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => \`<div style="font-size:11px;font-weight:700;color:var(--accent);padding:6px 0;letter-spacing:0.06em">\${d}</div>\`).join('')}\r
      </div>\r
      <!-- Day cells -->\r
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center">\r
        \${Array(firstDay).fill(null).map(() => \`<div></div>\`).join('')}\r
        \${Array.from({ length: daysInMonth }, (_, i) => {\r
        const day = i + 1;\r
        const fullDate = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;\r
        const isAvail = avail.includes(fullDate);\r
        const isBooked = bookedDates.includes(fullDate);\r
        const isToday = fullDate === todayStr;\r
        let bg, color, border, fontWeight = '600', cursor = 'pointer', title = '';\r
        if (isBooked) {\r
          bg = 'var(--red-dim)'; color = 'var(--red)'; border = '2px solid var(--red)'; cursor = 'default'; title = 'Booked — accepted assignment';\r
        } else if (isAvail) {\r
          bg = 'var(--green)'; color = '#072b1a'; border = '2px solid var(--green)'; title = 'Available — click to unmark';\r
        } else if (isToday) {\r
          bg = 'transparent'; color = 'var(--text)'; border = '2px solid var(--accent)'; title = 'Today';\r
        } else {\r
          bg = 'var(--surface2)'; color = 'var(--text2)'; border = '1px solid var(--border)'; title = 'Click to mark available';\r
        }\r
        if (isBooked) {\r
          return \`<div title="\${title}" style="padding:12px 4px;border-radius:10px;border:\${border};background:\${bg};color:\${color};font-weight:\${fontWeight};font-size:14px;width:100%;text-align:center;position:relative" >\${day}<span style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:7px;letter-spacing:0;color:var(--red);font-weight:700;line-height:1">BOOKED</span></div>\`;\r
        }\r
        return \`<button onclick="toggleAvailabilityDate('\${fullDate}')" title="\${title}" style="padding:12px 4px;border-radius:10px;border:\${border};background:\${bg};color:\${color};font-weight:\${fontWeight};cursor:\${cursor};font-size:14px;transition:all .15s;width:100%" onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">\${day}</button>\`;\r
      }).join('')}\r
      </div>\r
    </div>\r
\r
    <!-- Legend -->\r
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:12px;font-weight:600">\r
      <div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--green);display:inline-block"></span><span style="color:var(--text2)">Available</span></div>\r
      <div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--red-dim);border:2px solid var(--red);display:inline-block"></span><span style="color:var(--text2)">Booked (accepted assignment)</span></div>\r
      <div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:transparent;border:2px solid var(--accent);display:inline-block"></span><span style="color:var(--text2)">Today</span></div>\r
      <div style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:4px;background:var(--surface2);border:1px solid var(--border);display:inline-block"></span><span style="color:var(--text2)">Unavailable / Unset</span></div>\r
    </div>\r
\r
    <!-- Selected Dates Chips -->\r
    <div class="card" style="padding:20px;margin-bottom:20px;border-left:3px solid var(--accent)">\r
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">\r
        <span style="font-size:16px">✅</span>\r
        <div style="font-weight:700;font-size:15px;color:var(--text)">Available Dates (\${avail.length})</div>\r
      </div>\r
      \${avail.length === 0\r
          ? \`<div style="color:var(--text3);font-size:13px;text-align:center;padding:12px">No dates selected yet. Click any date on the calendar to mark availability.</div>\`\r
          : \`<div style="display:flex;flex-wrap:wrap;gap:10px">\r
            \${avail.map(d => \`\r
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:6px 12px;font-size:13px;font-weight:500;color:var(--text)">\r
              <span>\${fmtChip(d)}</span>\r
              <button onclick="removeAvailDate('\${d}')" style="width:20px;height:20px;border-radius:4px;background:var(--red);color:#fff;border:none;cursor:pointer;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1" onmouseover="this.style.background='#e04545'" onmouseout="this.style.background='var(--red)'">✕</button>\r
            </div>\`).join('')}\r
          </div>\`\r
        }\r
    </div>\r
\r
    <!-- Accepted Assignments -->\r
    <div class="card" style="padding:20px;border-left:3px solid var(--green)">\r
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">\r
        <span style="font-size:16px">📋</span>\r
        <div style="font-weight:700;font-size:15px;color:var(--text)">Accepted Assignments</div>\r
      </div>\r
      <div style="display:flex;flex-direction:column;gap:10px">\r
        \${myAssignments.length > 0 ? myAssignments.map(a => {\r
          const ev = DB.events.find(e => e.id === a.eventId) || { title: 'Event', date: '—', venue: '—' };\r
          const isCompleted = ev.status === 'completed';\r
          return \`<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);flex-wrap:wrap;gap:10px">\r
            <div>\r
              <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:2px">\${ev.title}</div>\r
              <div style="font-size:12px;color:var(--text2)">\${a.role} · \${ev.date}</div>\r
            </div>\r
            <div style="display:flex;align-items:center;gap:10px">\r
              <span style="font-weight:700;color:var(--green);font-size:14px">₹\${a.fee}</span>\r
              <span class="badge" style="background:\${isCompleted ? 'var(--green-dim)' : 'var(--accent-dim)'};color:\${isCompleted ? 'var(--green)' : 'var(--accent)'}">\${isCompleted ? '✓ Completed' : '● Active'}</span>\r
            </div>\r
          </div>\`;\r
        }).join('') : \`<div style="text-align:center;padding:28px;color:var(--text3);background:var(--surface2);border-radius:10px">📭 No accepted assignments yet.</div>\`}\r
      </div>\r
    </div>\r
\r
  </div>\r
  \`;\r
    }\r
\r
\r
\r
    function changeMonth(month, year) {\r
      sessionStorage.setItem('avail_month', month);\r
      sessionStorage.setItem('avail_year', year);\r
      renderPage('staff-availability');\r
    }\r
\r
    function toggleAvailabilityDate(date) {\r
      toggleAvailable(CU.id, date);\r
      renderPage('staff-availability');\r
      toast('Availability updated', 'success');\r
    }\r
\r
    function removeAvailDate(date) {\r
      const avail = getAvailability(CU.id);\r
      const idx = avail.indexOf(date);\r
      if (idx > -1) {\r
        avail.splice(idx, 1);\r
        saveAvailability(CU.id, avail);\r
        renderPage('staff-availability');\r
        toast('Date removed from availability', 'info');\r
      }\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    // ════════════════════════════════════════════════\r
    //  STAFF MANAGEMENT\r
    // ════════════════════════════════════════════════\r
    function pageStaffCombined() {\r
      const tab = sessionStorage.getItem('staff_tab') || 'manage';\r
      const allStaffList = DB.users.filter(u => u.role === 'staff');\r
      let content = '';\r
\r
      if (tab === 'manage') {\r
        // Only show staff assigned to events owned by the current organizer\r
        const myEventIds = DB.events\r
          .filter(e => String(e.organizer) === String(CU.id))\r
          .map(e => String(e.id));\r
        const myAssignments = DB.staffAssignments.filter(a => myEventIds.includes(String(a.eventId)));\r
        const myStaffIds = [...new Set(myAssignments.map(a => String(a.staffId)))];\r
        const myStaffList = allStaffList.filter(s => myStaffIds.includes(String(s.id)));\r
\r
        content = \`\r
    <div class="page-hd">\r
      <div class="page-hd-left"><div class="page-title">My Assigned Staff</div><div class="page-sub">\${myStaffList.length} staff member\${myStaffList.length !== 1 ? 's' : ''} assigned to your events</div></div>\r
        <div class="page-hd-right">\${CU.role !== 'superuser' ? \`<button class="btn btn-primary" onclick="openAssignStaffModal()">+ Assign Staff</button>\` : ''}</div>\r
    </div>\r
    \${myStaffList.length === 0 ? \`\r
    <div class="empty">\r
      <div class="empty-icon">👥</div>\r
      <div class="empty-title">No staff assigned yet</div>\r
      <p class="empty-desc">You haven't assigned any staff to your events. Use Browse Staff to find and assign staff.</p>\r
      <button class="btn btn-primary mt-16" onclick="switchStaffTab('browse')">🔍 Browse Staff</button>\r
    </div>\` : \`\r
    <div class="grid-3 mb-24">\r
        \${myStaffList.map(s => {\r
          const assigns = myAssignments.filter(a => String(a.staffId) === String(s.id));\r
          const earnings = assigns.reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0);\r
          const avImg = s.avatarImage ? \`\r
            <div class="av av-lg">\r
              <img src="\${s.avatarImage}" alt="\${s.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">\r
              <span style="display:none">\${s.avatar || s.name[0]}</span>\r
            </div>\r
          \` : \`<div class="av av-lg">\${s.avatar || s.name[0]}</div>\`;\r
          return \`<div class="card">\r
          <div class="flex items-center gap-12 mb-14">\r
            \${avImg}\r
            <div>\r
              <div style="font-weight:700;font-size:14.5px">\${s.name}</div>\r
              <div class="small mt-4">\${s.service || 'General Staff'}</div>\r
              <span class="badge badge-\${s.status === 'active' ? 'green' : 'red'} mt-8">\${s.status}</span>\r
            </div>\r
          </div>\r
          <div class="info-row"><span class="info-label">Email</span><span class="info-value small">\${s.email}</span></div>\r
          <div class="info-row"><span class="info-label">Rate</span><span class="info-value" style="color:var(--green)">\${s.rate ? '₹' + s.rate + '/event' : '—'}</span></div>\r
          <div class="info-row"><span class="info-label">My Assignments</span><span class="info-value">\${assigns.length}</span></div>\r
          <div class="info-row"><span class="info-label">Total Fee</span><span class="info-value" style="color:var(--green)">₹\${earnings.toLocaleString()}</span></div>\r
          <div class="flex gap-6 mt-14">\r
            <button class="btn btn-ghost btn-xs w-full" onclick="viewStaffModal('\${s.id}')">View</button>\r
            \${CU.role !== 'superuser' ? \`<button class="btn btn-primary btn-xs w-full" onclick="openAssignStaffModal('\${s.id}')">Assign</button>\` : ''}\r
          </div>\r
        </div>\`;\r
        }).join('')}\r
    </div>\r
    <div class="h4 mb-12">Assignment Log</div>\r
    <div class="table-wrap">\r
      <table><thead><tr><th>Staff</th><th>Event</th><th>Role</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>\r
      <tbody>\${myAssignments.map(a => {\r
          const s = DB.users.find(u => String(u.id) === String(a.staffId)) || { name: '—', avatar: '?' };\r
          const e = DB.events.find(ev => String(ev.id) === String(a.eventId)) || { title: '—' };\r
          const rowAv = s.avatarImage ? \`\r
            <div class="av av-xs">\r
              <img src="\${s.avatarImage}" alt="\${s.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">\r
              <span style="display:none">\${s.avatar || s.name[0]}</span>\r
            </div>\r
          \` : \`<div class="av av-xs">\${s.avatar || s.name[0]}</div>\`;\r
          return \`<tr>\r
          <td><div class="flex items-center gap-8">\${rowAv}\${s.name}</div></td>\r
          <td style="font-size:13px;max-width:160px" class="truncate">\${e.title}</td>\r
          <td class="muted">\${a.role}</td>\r
          <td style="color:var(--green);font-weight:600">₹\${a.fee}</td>\r
          <td><span class="badge badge-\${a.status === 'accepted' ? 'green' : a.status === 'pending' ? 'yellow' : 'red'}">\${a.status}</span></td>\r
          <td><button class="btn btn-xs btn-danger" onclick="removeAssignment('\${a.id}')">Remove</button></td>\r
        </tr>\`;\r
        }).join('')}\r
      </tbody></table>\r
    </div>\`}\r
\`;\r
      } else {\r
        content = \`\r
    <div class="page-hd">\r
      <div class="page-hd-left">\r
        <div class="page-title">Browse Staff</div>\r
        <div class="page-sub">Find and hire experienced event staff members</div>\r
      </div>\r
    </div>\r
    <div class="filter-row">\r
      <div class="search-box input-group" style="flex:1;max-width:400px">\r
        <span class="input-icon">🔍</span>\r
        <input class="form-control" id="search-staff-q" placeholder="Search staff by name or expertise..." oninput="searchCombinedStaff(this.value)">\r
      </div>\r
      <select class="form-control filter-select" id="search-staff-rating" onchange="filterCombinedStaff()">\r
        <option value="all">All Ratings</option>\r
        <option value="4.5">4.5+ stars</option>\r
        <option value="4">4+ stars</option>\r
        <option value="3.5">3.5+ stars</option>\r
      </select>\r
      <select class="form-control filter-select" id="search-staff-service" onchange="filterCombinedStaff()">\r
        <option value="all">All Services</option>\r
        <option>Event Manager</option>\r
        <option>Security</option>\r
        <option>Catering</option>\r
        <option>Sound Engineer</option>\r
        <option>Photography</option>\r
      </select>\r
    </div>\r
    <div style="margin-bottom:16px;color:var(--text2);font-size:13px">Showing \${staffList.length} staff member\${staffList.length !== 1 ? 's' : ''}</div>\r
    <div class="grid-3" style="gap:20px">\r
        \${staffList.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No staff found</div></div>\` : staffList.map(s => {\r
          const rating = s.rating || 4.0;\r
          const reviews = Math.floor(Math.random() * 150) + 20;\r
          const completedJobs = Math.floor(Math.random() * 200) + 30;\r
          const earnings = DB.staffAssignments.filter(a => String(a.staffId) === String(s.id)).reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0);\r
          const staffCardAv = s.avatarImage ? \`\r
            <img src="\${s.avatarImage}" alt="\${s.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
            <div style="display:none;font-size:80px;font-weight:700;color:\${s.color || 'var(--green)'}">\${s.avatar || s.name[0]}</div>\r
          \` : \`<div style="font-size:80px;font-weight:700;color:\${s.color || 'var(--green)'}">\${s.avatar || s.name[0]}</div>\`;\r
          return \`<div class="card" style="overflow:hidden;display:flex;flex-direction:column;position:relative">\r
          <div style="aspect-ratio:1;background:linear-gradient(135deg,\${s.color || 'var(--green)'}30,\${s.color || 'var(--green)'}10);display:flex;align-items:center;justify-content:center;margin-bottom:16px;border-radius:12px;position:relative;overflow:hidden">\r
            \${staffCardAv}\r
            <div style="position:absolute;top:12px;right:12px;background:var(--yellow);color:#1a1400;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;z-index:2">⭐ \${rating.toFixed(1)}</div>\r
          </div>\r
          <div style="flex:1;display:flex;flex-direction:column">\r
            <div style="font-weight:700;font-size:16px;margin-bottom:4px">\${s.name}</div>\r
            <div style="font-size:13px;color:var(--green);margin-bottom:8px;font-weight:500">\${s.service || 'Event Staff'}</div>\r
            <div style="font-size:12px;color:var(--text2);margin-bottom:8px">📞 \${s.phone || 'Contact available'}</div>\r
            <p style="font-size:12.5px;color:var(--text2);line-height:1.5;margin-bottom:12px;flex:1">\${s.bio || 'Professional event staff with proven experience'}</p>\r
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text3);margin-bottom:12px;padding:10px;background:var(--surface3);border-radius:8px">\r
              <div><strong style="color:var(--text)">\${completedJobs}</strong><div>Completed Jobs</div></div>\r
              <div><strong style="color:var(--text)">\${reviews}</strong><div>Reviews</div></div>\r
            </div>\r
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">\r
              <div style="font-size:12px;color:var(--text2)">💰 Earnings</div>\r
              <div style="font-weight:700;color:var(--green)">₹\${earnings.toLocaleString()}</div>\r
            </div>\r
            <div style="display:flex;gap:8px">\r
              <button class="btn btn-primary w-full" onclick="viewStaffProfile('\${s.id}')" style="flex:1">View Profile</button>\r
              <button class="btn btn-ghost btn-sm" onclick="assignStaffToEvent('\${s.id}')" style="padding:9px 12px">🤝</button>\r
            </div>\r
          </div>\r
        </div>\`;\r
        }).join('')}\r
    </div>\`;\r
      }\r
\r
      return \`\r
  <div style="padding:20px;background:var(--bg);">\r
    <div style="display:flex;gap:12px;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:16px;flex-wrap:wrap;">\r
      <button class="btn \${tab === 'manage' ? 'btn-primary' : 'btn-ghost'}" onclick="switchStaffTab('manage')">📋 Manage Assignments</button>\r
      <button class="btn \${tab === 'browse' ? 'btn-primary' : 'btn-ghost'}" onclick="switchStaffTab('browse')">🔍 Browse Staff</button>\r
    </div>\r
    \${content}\r
  </div>\r
  \`;\r
    }\r
\r
    function switchStaffTab(t) {\r
      sessionStorage.setItem('staff_tab', t);\r
      renderPage('staff');\r
    }\r
\r
    function searchCombinedStaff(q) {\r
      sessionStorage.setItem('search_staff_q', q);\r
      renderPage('staff');\r
    }\r
\r
    function filterCombinedStaff() {\r
      const rating = g('search-staff-rating')?.value || 'all';\r
      const service = g('search-staff-service')?.value || 'all';\r
      sessionStorage.setItem('search_staff_rating', rating);\r
      sessionStorage.setItem('search_staff_service', service);\r
      renderPage('staff');\r
    }\r
\r
    function pageStaff() {\r
      return pageStaffCombined();\r
    }\r
    function openAssignStaffModal(preStaffId = null, preEventId = null) {\r
      const staffList = DB.users.filter(u => u.role === 'staff');\r
      const myEvs = CU.role === 'superuser' ? DB.events : DB.events.filter(e => String(e.organizer) === String(CU.id));\r
      openModal('Assign Staff to Event', \`\r
    <div class="form-group"><label class="form-label">Staff Member *</label>\r
      <select class="form-control" id="as-staff">\r
        <option value="">-- Select Staff --</option>\r
        \${staffList.map(s => \`<option value="\${s.id}"\${String(preStaffId) === String(s.id) ? ' selected' : ''}>\${s.name} — \${s.service || 'Staff'}</option>\`).join('')}\r
      </select>\r
    </div>\r
    <div class="form-group"><label class="form-label">Event *</label>\r
      <select class="form-control" id="as-event">\r
        <option value="">-- Select Event --</option>\r
        \${myEvs.map(e => \`<option value="\${e.id}"\${String(preEventId) === String(e.id) ? ' selected' : ''}>\${e.title} (\${e.date})</option>\`).join('')}\r
      </select>\r
    </div>\r
    <div class="grid-2">\r
      <div class="form-group"><label class="form-label">Role / Task *</label><input class="form-control" id="as-role" placeholder="e.g. Lead Photographer"></div>\r
      <div class="form-group"><label class="form-label">Fee (₹) *</label><input class="form-control" id="as-fee" type="number" placeholder="800"></div>\r
    </div>\r
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="as-notes" placeholder="Special instructions or requirements…"></textarea></div>\r
  \`, [{ lbl: 'Assign Staff', cls: 'btn-primary', fn: 'saveAssignment()' }]);\r
    }\r
    function saveAssignment() {\r
      const staffId = v('as-staff'), eventId = v('as-event'), role = v('as-role'), fee = parseFloat(v('as-fee')) || 0;\r
      if (!staffId || !eventId) { toast('Select staff and event', 'error'); return; }\r
      if (!role) { toast('Role/task is required', 'error'); return; }\r
      if (!fee || fee <= 0) { toast('Enter a valid fee amount', 'error'); return; }\r
\r
      const newAsgn = {\r
        id: DB._nextId.assignments++,\r
        staffId: isNaN(staffId) ? staffId : parseInt(staffId),\r
        eventId: isNaN(eventId) ? eventId : parseInt(eventId),\r
        role,\r
        status: 'pending',\r
        fee,\r
        notes: v('as-notes'),\r
        assignedAt: new Date().toISOString()\r
      };\r
\r
      DB.staffAssignments.push(newAsgn);\r
      saveDB();\r
\r
      // Try to sync with backend if available\r
      if (typeof apiCreateStaffAssignment === 'function') {\r
        apiCreateStaffAssignment({\r
          eventId: String(newAsgn.eventId),\r
          staffId: String(newAsgn.staffId),\r
          organizerId: String(CU.id)\r
        }).catch(err => console.error('Backend sync failed:', err));\r
      }\r
\r
      closeModal();\r
      renderPage(_currentPage);\r
      toast('Staff assigned successfully!', 'success');\r
    }\r
    function removeAssignment(id) {\r
      confirm2('Remove Assignment', 'Remove this staff assignment?', () => {\r
        const i = DB.staffAssignments.findIndex(a => String(a.id) === String(id));\r
        if (i > -1) {\r
          DB.staffAssignments.splice(i, 1);\r
          saveDB();\r
          renderPage(_currentPage);\r
          toast('Assignment removed', 'info');\r
        }\r
      });\r
    }\r
    function viewStaffModal(id) {\r
      const s = DB.users.find(u => String(u.id) === String(id)); if (!s) return;\r
      const assigns = DB.staffAssignments.filter(a => String(a.staffId) === String(id));\r
      const earnings = assigns.reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0);\r
      const acceptedAssigns = assigns.filter(a => a.status === 'accepted');\r
      const rating = s.rating || 4.0;\r
      const reviews = s.reviews || 156;\r
      const completedJobs = acceptedAssigns.length || 155;\r
\r
      const now = new Date();\r
      const month = now.getMonth();\r
      const year = now.getFullYear();\r
      const monthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });\r
      const firstDay = new Date(year, month, 1).getDay();\r
      const daysInMonth = new Date(year, month + 1, 0).getDate();\r
      const todayStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(now.getDate()).padStart(2, '0')}\`;\r
      const avail = getAvailability(id);\r
      const assignedDates = acceptedAssigns.map(a => {\r
        const ev = DB.events.find(e => String(e.id) === String(a.eventId));\r
        return ev ? ev.date : '';\r
      }).filter(d => d);\r
\r
      const calDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => \`<div style="font-size:10px;font-weight:600;color:var(--text3);padding:4px;text-align:center">\${d}</div>\`).join('');\r
      const emptyDays = Array(firstDay).fill(null).map(() => '<div></div>').join('');\r
      const dayBtns = Array.from({ length: daysInMonth }, (_, i) => {\r
        const day = i + 1;\r
        const fullDate = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;\r
        const isAvail = avail.includes(fullDate);\r
        const isAssigned = assignedDates.includes(fullDate);\r
        const isToday = fullDate === todayStr;\r
        let bg = 'transparent', color = 'var(--text2)', border = '1px solid transparent', fw = '400';\r
        if (isAssigned) { bg = 'var(--accent)'; color = '#fff'; border = 'none'; fw = '700'; }\r
        else if (isAvail) { bg = 'rgba(34,197,94,0.2)'; color = 'var(--green)'; border = '1px solid var(--green)'; fw = '600'; }\r
        else if (isToday) { border = '1px solid var(--text2)'; }\r
        return \`<div style="padding:5px 2px;border-radius:6px;border:\${border};background:\${bg};color:\${color};font-weight:\${fw};font-size:12px;text-align:center">\${day}</div>\`;\r
      }).join('');\r
\r
      const hasCalData = avail.length > 0 || assignedDates.length > 0;\r
      const calHTML = hasCalData\r
        ? \`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:10px">\${calDays}\${emptyDays}\${dayBtns}</div><div style="display:flex;gap:12px;flex-wrap:wrap"><div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><div style="width:10px;height:10px;border-radius:3px;background:rgba(34,197,94,0.2);border:1px solid var(--green)"></div> Available</div><div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><div style="width:10px;height:10px;border-radius:3px;background:var(--accent)"></div> Assigned</div></div>\`\r
        : \`<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px;background:var(--surface3);border-radius:8px">No availability dates set yet</div>\`;\r
\r
      const assignCards = assigns.length > 0\r
        ? assigns.slice(0, 4).map(a => {\r
          const ev = DB.events.find(e => String(e.id) === String(a.eventId)) || { title: 'Event', date: '', venue: '' };\r
          const sc = a.status === 'accepted' ? 'green' : a.status === 'pending' ? 'yellow' : 'red';\r
          return \`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)"><div><div style="font-weight:600;font-size:13px;margin-bottom:2px">\${ev.title}</div><div style="font-size:11px;color:var(--text3)">\${a.role} · \${ev.date} · \${ev.venue || ev.city || '—'}</div></div><span class="badge badge-\${sc}" style="flex-shrink:0">\${a.status}</span></div>\`;\r
        }).join('')\r
        : \`<div style="text-align:center;padding:20px;color:var(--text3);background:var(--surface2);border-radius:8px;font-size:13px">No assignments yet</div>\`;\r
\r
      const modalAv = s.avatarImage ? \`\r
        <div class="av av-xl" style="flex-shrink:0">\r
          <img src="\${s.avatarImage}" alt="\${s.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">\r
          <span style="display:none">\${s.avatar || s.name[0]}</span>\r
        </div>\r
      \` : \`<div class="av av-xl" style="flex-shrink:0">\${s.avatar || s.name[0]}</div>\`;\r
\r
      openModal(s.name, \`\r
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">\r
      \${modalAv}\r
      <div>\r
        <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:2px">\${s.name}</div>\r
        <div style="color:var(--accent);font-size:13px;font-weight:600;margin-bottom:8px">\${s.service || 'Event Staff'}</div>\r
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">\r
          <span style="background:var(--yellow);color:#1a1400;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700">⭐ \${rating.toFixed(1)}</span>\r
          <span style="color:var(--text3);font-size:12px">\${reviews} reviews</span>\r
        </div>\r
        <div style="font-size:12px;color:var(--text2)">📱 \${s.phone || '+91 9876543204'}</div>\r
        <div style="margin-top:6px;font-size:13px;color:var(--text2)">💰 <strong style="color:var(--green)">₹\${earnings.toLocaleString()}</strong> earnings</div>\r
      </div>\r
    </div>\r
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">\r
      <div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center;border:1px solid var(--border)">\r
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">COMPLETED JOBS</div>\r
        <div style="font-size:22px;font-weight:700;color:var(--green)">\${completedJobs}</div>\r
      </div>\r
      <div style="background:var(--surface2);border-radius:10px;padding:14px;text-align:center;border:1px solid var(--border)">\r
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">AVERAGE RATING</div>\r
        <div style="font-size:22px;font-weight:700;color:var(--yellow)">\${rating.toFixed(1)}</div>\r
      </div>\r
    </div>\r
    \${s.bio ? \`<p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:20px">\${s.bio}</p>\` : ''}\r
    <div style="background:var(--surface2);border-radius:10px;padding:16px;margin-bottom:20px;border-left:3px solid var(--accent)">\r
      <div style="font-weight:600;font-size:14px;margin-bottom:12px;display:flex;align-items:center;gap:8px">📅 Availability &mdash; \${monthStr}</div>\r
      \${calHTML}\r
    </div>\r
    <div style="font-weight:600;font-size:14px;margin-bottom:10px">📋 Current Assignments</div>\r
    <div style="display:flex;flex-direction:column;gap:8px">\${assignCards}</div>\r
  \`, [{ lbl: 'Assign to Event', cls: 'btn-primary', fn: \`closeModal();openAssignStaffModal('\${id}')\` }]);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  STAFF ASSIGNMENTS (staff role)\r
    // ════════════════════════════════════════════════\r
    function pageAssignments() {\r
      const mine = DB.staffAssignments.filter(a => {\r
        if (String(a.staffId) === String(CU.id)) return true;\r
        const u = DB.users.find(u => String(u.id) === String(a.staffId));\r
        return u && u.email === CU.email;\r
      });\r
      const accepted = mine.filter(a => a.status === 'accepted');\r
      const pendingRequests = mine.filter(a => a.status === 'pending');\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Manage Events</div>\r
      <div class="page-sub">\${accepted.length} active · \${pendingRequests.length} pending requests</div>\r
    </div>\r
  </div>\r
  <!-- Tab Bar -->\r
  <div style="display:flex;gap:8px;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:5px;width:fit-content">\r
    <button onclick="goNav('assignments')" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-weight:600;background:var(--accent);color:#fff;transition:all .18s">✓ Active Assignments</button>\r
    <button onclick="goNav('staff-event-requests')" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-weight:600;background:transparent;color:var(--text2);transition:all .18s;position:relative" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text2)'">📩 Event Requests\${pendingRequests.length > 0 ? \` <span style="background:var(--red);color:#fff;border-radius:20px;font-size:10px;font-weight:700;padding:1px 6px;margin-left:4px">\${pendingRequests.length}</span>\` : ''}</button>\r
  </div>\r
  \${mine.filter(a => a.status !== 'pending').length === 0\r
          ? \`<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No active assignments yet</div><p class="empty-desc">You'll see accepted assignments here. Check Event Requests for pending ones.</p></div>\`\r
          : \`\r
  \${accepted.length > 0 ? \`<div class="h4 mb-12" style="color:var(--green)">✓ Active Assignments (\${accepted.length})</div><div style="display:flex;flex-direction:column;gap:14px">\${accepted.map(a => staffAssignCard(a, false)).join('')}</div>\` : ''}\r
  \`}\r
  \`;\r
    }\r
\r
    function pageStaffEventRequests() {\r
      const requests = DB.staffAssignments.filter(a => {\r
        const isMe = String(a.staffId) === String(CU.id);\r
        const u = DB.users.find(usr => String(usr.id) === String(a.staffId));\r
        const emailMatch = u && u.email === CU.email;\r
        const isPending = String(a.status).toLowerCase() === 'pending';\r
        return (isMe || emailMatch) && isPending;\r
      });\r
      const activeCount = DB.staffAssignments.filter(a => {\r
        const isMe = String(a.staffId) === String(CU.id);\r
        const u = DB.users.find(u => String(u.id) === String(a.staffId));\r
        const emailMatch = u && u.email === CU.email;\r
        return (isMe || emailMatch) && a.status === 'accepted';\r
      }).length;\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Manage Events</div>\r
      <div class="page-sub">\${activeCount} active · \${requests.length} pending requests</div>\r
    </div>\r
  </div>\r
  <!-- Tab Bar -->\r
  <div style="display:flex;gap:8px;margin-bottom:24px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:5px;width:fit-content">\r
    <button onclick="goNav('assignments')" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-weight:600;background:transparent;color:var(--text2);transition:all .18s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text2)'">✓ Active Assignments</button>\r
    <button onclick="goNav('staff-event-requests')" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-weight:600;background:var(--accent);color:#fff;transition:all .18s">📩 Event Requests\${requests.length > 0 ? \` <span style="background:var(--red);color:#fff;border-radius:20px;font-size:10px;font-weight:700;padding:1px 6px;margin-left:4px">\${requests.length}</span>\` : ''}</button>\r
  </div>\r
  \${requests.length === 0\r
          ? \`<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No pending event requests</div><p class="empty-desc">When an organizer assigns you to an event, it will appear here for your review.</p></div>\`\r
          : \`<div style="display:flex;flex-direction:column;gap:10px">\r
        \${requests.map(a => {\r
            const e = DB.events.find(ev => String(ev.id) === String(a.eventId)) || { title: 'Event', date: '', venue: '', emoji: '📅', color: '#7c6ff7', type: 'N/A' };\r
            const organizer = DB.users.find(u => String(u.id) === String(e.organizer)) || { name: 'Unknown Organizer' };\r
            const reqThumb = e.image ? \`\r
              <div style="width:44px;height:44px;border-radius:8px;overflow:hidden;flex-shrink:0;background:\${e.color || 'var(--accent)'}20;position:relative">\r
                <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\\'font-size:28px\\'>\${e.emoji || '📅'}</span>'">\r
              </div>\r
            \` : \`<span style="font-size:28px;line-height:1;flex-shrink:0">\${e.emoji || '📅'}</span>\`;\r
            return \`<div class="card" style="border-left:4px solid var(--yellow);padding:14px 18px">\r
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">\r
              \${reqThumb}\r
              <div style="flex:1;min-width:0">\r
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">\r
                  <span style="font-size:14px;font-weight:700;color:var(--text)">\${e.title}</span>\r
                  <span class="badge badge-yellow" style="font-size:10px">⏳ Pending</span>\r
                </div>\r
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text2)">\r
                  <span>👤 <strong style="color:var(--accent)">\${a.role}</strong></span>\r
                  \${e.date ? \`<span>📅 \${e.date}</span>\` : ''}\r
                  \${e.venue || e.city ? \`<span>📍 \${e.venue || e.city}</span>\` : ''}\r
                  <span style="color:var(--text3)">from \${organizer.name}</span>\r
                </div>\r
              </div>\r
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">\r
                <span style="font-size:15px;font-weight:800;color:var(--green)">₹\${a.fee.toLocaleString()}</span>\r
                <button onclick="respondAssign('\${a.id}','accepted')" style="padding:7px 14px;background:var(--green);color:#07100d;border:none;border-radius:7px;font-size:12.5px;font-weight:700;cursor:pointer;transition:all .18s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">✓ Accept</button>\r
                <button onclick="respondAssign('\${a.id}','declined')" style="padding:7px 14px;background:var(--red-dim);color:var(--red);border:1px solid var(--red);border-radius:7px;font-size:12.5px;font-weight:700;cursor:pointer;transition:all .18s" onmouseover="this.style.background='var(--red)';this.style.color='#fff'" onmouseout="this.style.background='var(--red-dim)';this.style.color='var(--red)'">✕ Decline</button>\r
                <button onclick="viewStaffEventDetails('\${e.id}')" style="padding:7px 12px;background:var(--surface2);color:var(--text2);border:1px solid var(--border2);border-radius:7px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .18s" onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)';this.style.color='var(--text2)'">🔍 Details</button>\r
              </div>\r
            </div>\r
          </div>\`;\r
          }).join('')}\r
      </div>\`\r
        }\`;\r
    }\r
\r
    function viewStaffEventDetails(eventId) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId));\r
      if (!e) return;\r
      const organizer = DB.users.find(u => String(u.id) === String(e.organizer)) || { name: 'Unknown', email: '' };\r
      const regs = DB.registrations.filter(r => r.eventId === e.id);\r
      openModal(\`\${e.emoji || '📅'} \${e.title}\`, \`\r
    <div style="display:flex;flex-direction:column;gap:14px">\r
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">\r
        <div class="info-row"><span class="info-label">Date</span><span class="info-value">\${e.date}</span></div>\r
        <div class="info-row"><span class="info-label">Venue</span><span class="info-value">\${e.venue || e.city || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Type</span><span class="info-value">\${e.type || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">\${e.capacity || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Organizer</span><span class="info-value">\${organizer.name}</span></div>\r
        <div class="info-row"><span class="info-label">Registrations</span><span class="info-value">\${regs.length}</span></div>\r
      </div>\r
      \${e.description ? \`<div><div class="label mb-8">Description</div><p style="font-size:13.5px;color:var(--text2);line-height:1.7">\${e.description}</p></div>\` : ''}\r
    </div>\r
  \`);\r
    }\r
    function staffAssignCard(a, showActions) {\r
      const e = DB.events.find(ev => String(ev.id) === String(a.eventId)) || { title: 'Event', date: '', venue: '', emoji: '📅', color: '#7c6ff7', description: '' };\r
      const eventThumb = e.image ? \`\r
        <div style="width:52px;height:52px;border-radius:10px;overflow:hidden;flex-shrink:0;background:\${e.color || 'var(--accent)'}20;position:relative">\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<span style=\\'font-size:36px\\'>\${e.emoji || '📅'}</span>'">\r
        </div>\r
      \` : \`<span style="font-size:36px">\${e.emoji || '📅'}</span>\`;\r
      return \`<div class="card" style="border-left:3px solid \${e.color}">\r
    <div class="flex justify-between items-start">\r
      <div class="flex items-center gap-12">\r
        \${eventThumb}\r
        <div style="flex:1">\r
          <div style="font-weight:700;font-size:15px">\${e.title}</div>\r
          <div class="small mt-4">📅 \${e.date}\${e.venue ? ' · 📍 ' + e.venue : ''}</div>\r
          <div class="small mt-2">Role: <strong style="color:var(--text)">\${a.role}</strong> · Fee: <strong style="color:var(--green)">₹\${a.fee}</strong></div>\r
          \${e.description ? \`<div class="small mt-2" style="color:var(--text2)">\${e.description}</div>\` : ''}\r
          \${a.notes ? \`<div class="small mt-2" style="color:var(--text3)">📝 \${a.notes}</div>\` : ''}\r
        </div>\r
      </div>\r
      <div style="text-align:right;flex-shrink:0">\r
        <span class="badge badge-\${a.status === 'accepted' ? 'green' : a.status === 'pending' ? 'yellow' : 'red'}">\${a.status}</span>\r
      </div>\r
    </div>\r
    <div class="flex gap-8 mt-14">\r
      \${a.status === 'pending' ? \`<button class="btn btn-success" onclick="respondAssign('\${a.id}','accepted')">✓ Accept</button><button class="btn btn-danger btn-sm" onclick="respondAssign('\${a.id}','declined')">✕ Decline</button>\` : a.status === 'accepted' ? \`<button class="btn btn-ghost btn-xs" onclick="openViewEventDrawer('\${e.id}')">View Event</button><button class="btn btn-danger btn-sm" onclick="respondAssign('\${a.id}','declined')">Unavailable</button>\` : \`<button class="btn btn-ghost btn-xs" onclick="respondAssign('\${a.id}','pending')">Reconsider</button>\`}\r
    </div>\r
  </div>\`;\r
    }\r
    function respondAssign(id, status) {\r
      const matches = DB.staffAssignments.filter(asgn => String(asgn.id) === String(id));\r
      if (matches.length === 0) return;\r
\r
      matches.forEach(a => {\r
        a.status = status;\r
      });\r
      saveDB();\r
\r
      const a = matches[0];\r
      const e = DB.events.find(ev => String(ev.id) === String(a.eventId)) || { title: 'Event', date: '' };\r
      const s = DB.users.find(u => String(u.id) === String(a.staffId)) || { name: 'Staff' };\r
\r
      // ── Availability auto-update ──────────────────────────\r
      if (e.date) {\r
        if (!DB.staffBooked) DB.staffBooked = {};\r
        const staffKey = String(a.staffId);\r
\r
        if (status === 'accepted') {\r
          // Remove date from available list\r
          const avail = getAvailability(staffKey);\r
          const idx = avail.indexOf(e.date);\r
          if (idx > -1) { avail.splice(idx, 1); saveAvailability(staffKey, avail); }\r
          // Add to booked list\r
          if (!DB.staffBooked[staffKey]) DB.staffBooked[staffKey] = [];\r
          if (!DB.staffBooked[staffKey].includes(e.date)) DB.staffBooked[staffKey].push(e.date);\r
        } else {\r
          // Remove from booked list when declining / reconsidering\r
          if (DB.staffBooked[staffKey]) {\r
            const bi = DB.staffBooked[staffKey].indexOf(e.date);\r
            if (bi > -1) DB.staffBooked[staffKey].splice(bi, 1);\r
          }\r
        }\r
        saveDB();\r
      }\r
      // ─────────────────────────────────────────────────────\r
\r
      const notifMsg = status === 'accepted' ?\r
        \`OK \${s.name} accepted assignment for \${e.title}\` :\r
        status === 'declined' ?\r
          \`X \${s.name} declined assignment for \${e.title}\` :\r
          \`! \${s.name} reconsidered assignment for \${e.title}\`;\r
\r
      DB.notifications.push({\r
        id: DB._nextId.notifs++,\r
        title: status === 'accepted' ? 'Assignment Accepted' : 'Assignment Declined',\r
        msg: notifMsg,\r
        time: 'now',\r
        read: false,\r
        type: status === 'accepted' ? 'success' : 'warning',\r
        icon: status === 'accepted' ? 'OK' : '!'\r
      });\r
      saveDB();\r
\r
      updateNotifDot();\r
\r
      setTimeout(() => {\r
        if (CU.role === 'staff') {\r
          goNav('staff-event-requests');\r
        } else {\r
          renderPage(_currentPage);\r
        }\r
      }, 50);\r
\r
      const emoji = status === 'accepted' ? 'OK' : 'X';\r
      const msg = status === 'accepted' ? emoji + ' Assignment accepted! Date marked as unavailable.' : emoji + ' Assignment declined';\r
      const toastType = status === 'accepted' ? 'success' : 'warning';\r
      toast(msg, toastType);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  EVENT REQUESTS\r
    // ════════════════════════════════════════════════\r
    function pageEventRequests() {\r
      return \`\r
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Event Requests</div><div class="page-sub">Review and manage client event requests.</div></div></div>\r
  <div class="table-wrap">\r
    <table><thead><tr><th>Client</th><th>Event</th><th>Type</th><th>Date</th><th>Guests</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>\r
    <tbody>\${DB.eventRequests.map(r => {\r
        const cl = DB.users.find(u => String(u.id) === String(r.clientId)) || DB.users.find(u => u.role === 'client') || { name: 'Michael Torres', avatar: 'MT', avatarImage: '/images/avatars/user-michael-torres.jpg' };\r
        const clientAv = cl.avatarImage ? \`\r
          <div class="av av-xs">\r
            <img src="\${cl.avatarImage}" alt="\${cl.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">\r
            <span style="display:none">\${cl.avatar || cl.name?.[0] || 'C'}</span>\r
          </div>\r
        \` : \`<div class="av av-xs">\${cl.avatar || cl.name?.[0] || 'C'}</div>\`;\r
        return \`<tr>\r
        <td><div class="flex items-center gap-8">\${clientAv}<strong>\${cl.name}</strong></div></td>\r
        <td><strong>\${r.title}</strong></td><td>\${r.type}</td><td>\${r.date}</td><td>\${r.guests}</td>\r
        <td style="color:var(--green);font-weight:600">₹\${r.budget.toLocaleString()}</td>\r
        <td><span class="badge badge-\${reqBadge(r.status)}">\${r.status}</span></td>\r
        <td><div class="actions">\r
          <button class="btn btn-ghost btn-xs" onclick="viewRequestDrawer('\${r.id}')">View</button>\r
          \${r.status === 'pending' ? \`<button class="btn btn-success btn-xs" onclick="approveReq('\${r.id}')">Accept</button><button class="btn btn-xs btn-danger" onclick="rejectReq('\${r.id}')">Decline</button>\` : ''}\r
        </div></td>\r
      </tr>\`;\r
      }).join('')}\r
    </tbody></table>\r
  </div>\`;\r
    }\r
    function viewRequestDrawer(id) {\r
      const r = DB.eventRequests.find(r => String(r.id) === String(id)); if (!r) return;\r
      const org = DB.users.find(u => u.id === r.organizer) || { name: 'Pending Assignment' };\r
      openDrawer(\`Request: \${r.title}\`, \`\r
    <span class="badge badge-\${reqBadge(r.status)} mb-16">\${r.status}</span>\r
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">\r
      <div class="info-row"><span class="info-label">Organizer</span><span class="info-value">\${org.name}</span></div>\r
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">\${r.type}</span></div>\r
      <div class="info-row"><span class="info-label">Preferred Date</span><span class="info-value">\${r.date}</span></div>\r
      <div class="info-row"><span class="info-label">Expected Guests</span><span class="info-value">\${r.guests}</span></div>\r
      <div class="info-row"><span class="info-label">Budget</span><span class="info-value" style="color:var(--green);font-weight:700">₹\${r.budget.toLocaleString()}</span></div>\r
      <div class="info-row"><span class="info-label">Preferred Venue</span><span class="info-value">\${r.venue || '—'}</span></div>\r
      <div class="info-row"><span class="info-label">Submitted</span><span class="info-value">\${r.created}</span></div>\r
    </div>\r
    <div class="label mb-8">Description</div>\r
    <p style="font-size:13.5px;color:var(--text2);line-height:1.7">\${r.desc}</p>\r
    \${r.status === 'pending' ? \`<div class="flex gap-8 mt-20"><button class="btn btn-success w-full" onclick="closeDrawer();approveReq(\${r.id})">✓ Accept Event</button><button class="btn btn-danger w-full" onclick="closeDrawer();rejectReq(\${r.id})">✕ Decline</button></div>\` : ''}\r
  \`);\r
    }\r
    function approveReq(id) {\r
      const r = DB.eventRequests.find(r => String(r.id) === String(id));\r
      if (r) {\r
        r.status = 'approved';\r
        r.organizer = CU.id;\r
\r
        // Create new event from request\r
        const newEvent = {\r
          id: DB._nextId.events++,\r
          title: r.title,\r
          category: r.type,\r
          date: r.date,\r
          time: '10:00',\r
          endTime: '18:00',\r
          venue: r.venue || 'TBD',\r
          city: r.city || 'India',\r
          capacity: r.guests || 100,\r
          registered: 0,\r
          price: 0,\r
          status: 'ongoing',\r
          organizer: CU.id,\r
          clientId: r.clientId,\r
          description: r.desc,\r
          color: '#7c6ff7',\r
          emoji: r.type === 'Wedding' ? '💒' : (r.type === 'Corporate' ? '🥂' : '📅'),\r
          tags: [r.type]\r
        };\r
        DB.events.push(newEvent);\r
\r
        saveDB();\r
        renderPage(_currentPage);\r
        toast('Event request accepted — event created!', 'success');\r
      }\r
    }\r
    function rejectReq(id) {\r
      confirm2('Decline Request', 'Mark this event request as declined?', () => {\r
        const r = DB.eventRequests.find(r => String(r.id) === String(id));\r
        if (r) { r.status = 'rejected'; renderPage(_currentPage); toast('Request declined', 'info'); }\r
      });\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  UNIFIED REQUEST STATUS (CLIENT & ORGANIZER)\r
    // ════════════════════════════════════════════════\r
    function pageRequestStatus() {\r
      const isOrganizer = CU.role === 'organizer';\r
      if (isOrganizer) {\r
        const tab = sessionStorage.getItem('reqstat_tab') || 'pending';\r
        const myOrgId = CU.id;\r
        const pendingReqs = DB.eventRequests.filter(r => r.status === 'pending' || r.status === 'in_review');\r
        const myEvents = DB.events.filter(e => e.organizer === myOrgId && (e.status === 'upcoming' || e.status === 'ongoing' || e.status === 'confirmed'));\r
\r
        const pendingHtml = pendingReqs.length === 0\r
          ? '<div class="empty"><div class="empty-icon">&#128203;</div><div class="empty-title">No pending requests</div><p class="empty-desc">New client event requests will appear here.</p></div>'\r
          : pendingReqs.map(r => {\r
            const cl = DB.users.find(u => String(u.id) === String(r.clientId)) || DB.users.find(u => u.role === 'client') || { name: 'Michael Torres' };\r
            return \`<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;border-left:4px solid var(--yellow)">\r
          <div style="flex:1">\r
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">\r
              <div style="font-size:17px;font-weight:700;color:var(--text)">\${r.title}</div>\r
              <span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px">Pending</span>\r
            </div>\r
            <div style="display:flex;gap:24px;font-size:13px;color:var(--text2);flex-wrap:wrap">\r
              <span>👤 \${cl.name}</span>\r
              <span>📅 \${r.date}</span>\r
              <span>📍 \${r.venue || 'TBD'}\${r.city ? ', ' + r.city : ''}</span>\r
              <span>👥 \${r.guests} expected attendees</span>\r
            </div>\r
          </div>\r
          <button class="btn btn-primary" onclick="viewRequestDetail('\${r.id}')" style="white-space:nowrap;border-radius:8px;padding:10px 20px">Review Request</button>\r
        </div>\`;\r
          }).join('');\r
\r
        const ongoingHtml = myEvents.length === 0\r
          ? '<div class="empty"><div class="empty-icon">&#128197;</div><div class="empty-title">No ongoing events</div><p class="empty-desc">Confirmed events will appear here once requests are approved.</p></div>'\r
          : \`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px">\${myEvents.map(e => {\r
            const attendees = DB.registrations.filter(r => r.eventId === e.id).length;\r
            const isPrivate = e.access === 'private' || e.access === 'Private';\r
            return \`<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px">\r
            <div style="display:flex;gap:8px;flex-wrap:wrap">\r
              <span style="background:rgba(34,197,94,0.15);color:var(--green);font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px">Confirmed</span>\r
              \${isPrivate ? '<span style="background:var(--surface2);color:var(--text2);font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px">Private</span>' : ''}\r
            </div>\r
            <div>\r
              <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:3px">\${e.title}</div>\r
              <div style="font-size:12px;color:var(--text3)">\${e.type || e.category || 'Event'}</div>\r
            </div>\r
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text2)">\r
              <span>&#128197; \${e.date}</span>\r
              <span>&#128205; \${e.venue || e.location || 'TBD'}</span>\r
              <span>&#128101; \${attendees || e.capacity || 0} attendees</span>\r
            </div>\r
            <button class="btn btn-ghost" onclick="viewOngoingEventDetail('\${e.id}')" style="width:100%;justify-content:center;border-radius:8px;font-size:13px">&#128065; View Details</button>\r
          </div>\`;\r
          }).join('')}</div>\`;\r
\r
        return \`<div style="padding:28px;background:var(--bg)">\r
      <div style="margin-bottom:28px">\r
        <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">\${tab === 'pending' ? 'Pending Requests' : 'Ongoing Events'}</div>\r
        <div style="font-size:14px;color:var(--text2)">\${tab === 'pending' ? 'Review and accept or decline incoming event requests.' : 'Manage and track your confirmed and active events.'}</div>\r
      </div>\r
      <div style="display:flex;gap:0;margin-bottom:28px;background:var(--surface2);border-radius:10px;padding:4px;width:fit-content">\r
        <button onclick="switchReqStatTab('pending')" style="padding:8px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:\${tab === 'pending' ? 'var(--accent)' : 'transparent'};color:\${tab === 'pending' ? '#fff' : 'var(--text2)'}">Pending Requests <span style="background:\${tab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--border2)'};color:\${tab === 'pending' ? '#fff' : 'var(--text2)'};padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">\${pendingReqs.length}</span></button>\r
        <button onclick="switchReqStatTab('ongoing')" style="padding:8px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:\${tab === 'ongoing' ? 'var(--accent)' : 'transparent'};color:\${tab === 'ongoing' ? '#fff' : 'var(--text2)'}">Ongoing Events <span style="background:\${tab === 'ongoing' ? 'rgba(255,255,255,0.25)' : 'var(--border2)'};color:\${tab === 'ongoing' ? '#fff' : 'var(--text2)'};padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">\${myEvents.length}</span></button>\r
      </div>\r
      <div style="display:flex;flex-direction:column;gap:16px">\r
        \${tab === 'pending' ? pendingHtml : ongoingHtml}\r
      </div>\r
    </div>\`;\r
      } else {\r
        const reqs = DB.eventRequests.filter(r => String(r.clientId) === String(CU.id));\r
        return \`\r
    <div class="page-hd">\r
      <div class="page-hd-left"><div class="page-title">Request Status</div><div class="page-sub">\${reqs.length} event requests</div></div>\r
      <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>\r
    </div>\r
    \${reqs.length === 0 ? \`<div class="empty"><div class="empty-icon">&#128203;</div><div class="empty-title">No requests yet</div><p class="empty-desc">Browse organizers and send them an event request to get started.</p><button class="btn btn-primary mt-16" onclick="goNav('find-organizers')">Find Organizers</button></div>\` : \`\r
    <div style="display:flex;flex-direction:column;gap:14px">\${reqs.map(r => \`<div class="card">\r
      <div class="flex justify-between items-start">\r
        <div style="flex:1">\r
          <div style="font-size:16px;font-weight:700;margin-bottom:5px">\${r.title}</div>\r
          <div class="small mb-8">\${r.type} &middot; \${r.guests} guests &middot; \${r.date}</div>\r
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px">\${r.desc}</p>\r
          <span class="badge badge-\${reqBadge(r.status)}">\${r.status === 'approved' ? 'Accepted' : r.status}</span>\r
        </div>\r
        <div style="text-align:right;flex-shrink:0;margin-left:20px">\r
          <div style="font-size:22px;font-weight:800;color:var(--green)">&#8377;\${r.budget.toLocaleString()}</div>\r
          <div class="small">Budget</div>\r
        </div>\r
      </div>\r
      <div class="flex gap-8 mt-14">\r
        <button class="btn btn-ghost btn-sm" onclick="viewRequestDrawer('\${r.id}')">View Details</button>\r
        \${r.status === 'pending' ? \`<button class="btn btn-danger btn-sm" onclick="cancelReq('\${r.id}')">Cancel</button>\` : ''}\r
      </div>\r
    </div>\`).join('')}</div>\`}\`;\r
      }\r
    }\r
\r
    function switchReqStatTab(tab) {\r
      sessionStorage.setItem('reqstat_tab', tab);\r
      renderPage('request-status');\r
    }\r
\r
    function viewRequestDetail(reqId) {\r
      const r = DB.eventRequests.find(x => String(x.id) === String(reqId)); if (!r) return;\r
      const cl = DB.users.find(u => String(u.id) === String(r.clientId)) || DB.users.find(u => u.role === 'client') || { name: 'Michael Torres', email: 'client@example.com', phone: '+91 9876543203' };\r
      const el = document.getElementById('page-content');\r
      if (!el) return;\r
      el.innerHTML = \`<div style="padding:28px;background:var(--bg);min-height:100vh">\r
    <button onclick="renderPage('request-status')" style="display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:24px;padding:0">&larr; Back to Pending Requests</button>\r
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">\r
      <div style="font-size:22px;font-weight:700;color:var(--text)">\${r.title}</div>\r
      <span style="background:#FEF9C3;color:#92400E;font-size:12px;font-weight:600;padding:3px 12px;border-radius:6px">Pending Review</span>\r
    </div>\r
    <div style="font-size:13px;color:var(--text2);margin-bottom:28px">Review the details below and accept or decline this request.</div>\r
    <div style="display:flex;flex-direction:column;gap:20px;max-width:720px">\r
\r
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">\r
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128100; Client Information</div>\r
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CLIENT NAME</div>\r
            <div style="font-size:14px;font-weight:600;color:var(--text)">\${cl.name}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CONTACT</div>\r
            <div style="font-size:13px;color:var(--text2)">\${cl.email || 'â€”'}</div>\r
            <div style="font-size:13px;color:var(--text2)">\${cl.phone || ''}</div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">\r
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128197; Event Details</div>\r
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">DATE</div>\r
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.date}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EVENT TYPE</div>\r
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.type || 'Corporate Event'}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">VENUE</div>\r
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.venue || 'To be decided'}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EXPECTED ATTENDEES</div>\r
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.guests}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CITY</div>\r
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.city || 'â€”'}</div>\r
          </div>\r
          <div>\r
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">BUDGET</div>\r
            <div style="font-size:14px;font-weight:600;color:var(--green)">&#8377;\${r.budget ? r.budget.toLocaleString() : 'â€”'}</div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">\r
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">&#128203; Event Requirements</div>\r
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Services and setup requested by the client</div>\r
        <div style="background:var(--surface2);border-radius:10px;padding:16px;font-size:13px;color:var(--text);line-height:1.7">\${r.desc || 'Standard event requirements. No special requests.'}</div>\r
      </div>\r
\r
      <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:8px">\r
        <button class="btn btn-danger" onclick="rejectReq('\${r.id}');renderPage('request-status')" style="border-radius:8px;padding:10px 24px">&#x2715; Decline</button>\r
        <button class="btn btn-success" onclick="approveReq('\${r.id}');renderPage('request-status')" style="border-radius:8px;padding:10px 24px;background:var(--green);border-color:var(--green)">&#x2713; Accept Event</button>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function viewOngoingEventDetail(eventId) {\r
      const e = DB.events.find(ev => String(ev.id) === String(eventId)); if (!e) return;\r
      const attendees = DB.registrations.filter(r => String(r.eventId) === String(eventId));\r
      const staffList = DB.staffAssignments.filter(a => String(a.eventId) === String(eventId));\r
      const el = document.getElementById('page-content');\r
      if (!el) return;\r
      el.innerHTML = \`<div style="padding:28px;background:var(--bg)">\r
    <button onclick="renderPage('request-status')" style="display:flex;align-items:center;gap:6px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:20px;padding:0">â† Back to Ongoing Events</button>\r
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">\r
      <div style="font-size:22px;font-weight:700;color:var(--text)">\${e.title}</div>\r
      <span style="background:rgba(34,197,94,0.15);color:var(--green);font-size:12px;font-weight:600;padding:3px 10px;border-radius:6px">Confirmed</span>\r
    </div>\r
    <div style="font-size:13px;color:var(--text2);margin-bottom:28px">\${e.description || 'Active event under management.'}</div>\r
    <div style="display:grid;grid-template-columns:1fr 320px;gap:24px">\r
      <div style="display:flex;flex-direction:column;gap:20px">\r
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">\r
          <div style="font-weight:700;font-size:15px;margin-bottom:18px">ðŸ“… Event Details</div>\r
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">\r
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">DATE</div><div style="font-size:14px;font-weight:500">\${e.date}</div></div>\r
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">TYPE</div><div style="font-size:14px;font-weight:500">\${e.type || e.category || 'Event'}</div></div>\r
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">VENUE</div><div style="font-size:14px;font-weight:500">\${e.venue || 'TBD'}</div></div>\r
            <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:5px">ATTENDEES</div><div style="font-size:14px;font-weight:500">\${attendees.length}</div></div>\r
          </div>\r
        </div>\r
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">\r
          <div style="font-weight:700;font-size:15px;margin-bottom:16px">Staff Team (\${staffList.length})</div>\r
          \${staffList.length > 0 ? staffList.map(a => { const s = DB.users.find(u => String(u.id) === String(a.staffId)) || { name: 'Staff' }; return \`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)"><div style="display:flex;align-items:center;gap:10px"><div class="av av-xs">\${s.avatar || s.name[0]}</div><div><div style="font-weight:600;font-size:13px">\${s.name}</div><div style="font-size:11px;color:var(--text3)">\${a.role}</div></div></div><span class="badge badge-\${a.status === 'accepted' ? 'green' : 'yellow'}">\${a.status}</span></div>\`; }).join('') : '<div style="color:var(--text3);font-size:13px">No staff assigned yet.</div>'}\r
          <button class="btn btn-ghost" onclick="openAssignStaffModal(null, '\${e.id}')" style="width:100%;justify-content:center;margin-top:12px;border-radius:8px">+ Add Staff</button>\r
        </div>\r
      </div>\r
      <div style="display:flex;flex-direction:column;gap:16px">\r
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px">\r
          <div style="font-weight:700;font-size:14px;margin-bottom:16px">Timeline &amp; Milestones</div>\r
          <div style="display:flex;flex-direction:column;gap:14px">\r
            \${[{ label: 'Event Accepted', sub: 'Event approved', done: true }, { label: 'Approved by Client', sub: 'Event plan approved', done: true }, { label: 'Staff Assignment Started', sub: 'Team assigned', done: staffList.length > 0 }, { label: 'All Staff Confirmed', sub: 'In Progress', done: staffList.filter(a => a.status === 'accepted').length === staffList.length && staffList.length > 0 }, { label: 'Event Day', sub: e.date, done: false }].map(m => \`\r
            <div style="display:flex;gap:12px;align-items:flex-start">\r
              <div style="width:18px;height:18px;border-radius:50%;border:2px solid \${m.done ? 'var(--green)' : 'var(--border)'};background:\${m.done ? 'rgba(34,197,94,0.1)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">\r
                \${m.done ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>' : ''}\r
              </div>\r
              <div>\r
                <div style="font-size:13px;font-weight:600;color:var(--text)">\${m.label}</div>\r
                <div style="font-size:11px;color:var(--text3)">\${m.sub}</div>\r
              </div>\r
            </div>\`).join('')}\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function openNewRequestForm() {\r
      openDrawer('New Event Request', \`\r
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="nr-title" placeholder="e.g. Annual Client Dinner"></div>\r
    <div class="grid-2"><div class="form-group"><label class="form-label">Event Type *</label><select class="form-control" id="nr-type"><option>Corporate</option><option>Conference</option><option>Wedding</option><option>Concert</option><option>Workshop</option><option>Other</option></select></div><div class="form-group"><label class="form-label">Preferred Date *</label><input class="form-control" id="nr-date" type="date"></div></div>\r
    <div class="grid-2"><div class="form-group"><label class="form-label">Expected Guests *</label><input class="form-control" id="nr-guests" type="number" placeholder="100"></div><div class="form-group"><label class="form-label">Budget (₹) *</label><input class="form-control" id="nr-budget" type="number" placeholder="10000"></div></div>\r
    <div class="form-group"><label class="form-label">Preferred Venue (optional)</label><input class="form-control" id="nr-venue" placeholder="Grand Ballroom, Downtown"></div>\r
    <div class="form-group"><label class="form-label">Description & Requirements *</label><textarea class="form-control" id="nr-desc" style="min-height:100px" placeholder="Describe the event, theme, requirements…"></textarea></div>\r
    <div class="flex gap-8 mt-20"><button class="btn btn-success w-full" onclick="submitRequest()">Submit Request</button><button class="btn btn-ghost w-full" onclick="closeDrawer()">Cancel</button></div>\r
  \`);\r
    }\r
\r
    function cancelReq(id) {\r
      confirm2('Cancel Request', 'Are you sure you want to cancel this event request?', () => {\r
        const i = DB.eventRequests.findIndex(r => String(r.id) === String(id));\r
        if (i > -1) { DB.eventRequests.splice(i, 1); renderPage('request-status'); toast('Request cancelled', 'info'); }\r
      });\r
    }\r
\r
    function submitRequest() {\r
      const title = v('nr-title'), date = v('nr-date'), guests = v('nr-guests'), budget = v('nr-budget'), desc = v('nr-desc');\r
      if (!title) { toast('Event title is required', 'error'); return; }\r
      if (!date) { toast('Preferred date is required', 'error'); return; }\r
      if (!guests || parseInt(guests) < 1) { toast('Enter expected number of guests', 'error'); return; }\r
      if (!budget || parseInt(budget) < 1) { toast('Enter your budget', 'error'); return; }\r
      if (!desc || desc.length < 10) { toast('Please provide a detailed description', 'error'); return; }\r
      DB.eventRequests.push({ id: DB._nextId.reqs++, clientId: CU.id, title, type: v('nr-type'), date, guests: parseInt(guests), budget: parseInt(budget), status: 'pending', desc, created: today(), venue: v('nr-venue') });\r
      toast('Event request submitted!', 'success');\r
      closeDrawer();\r
      renderPage('request-status');\r
    }\r
\r
    function submitPlan(id) {\r
      const r = DB.eventRequests.find(r => String(r.id) === String(id));\r
      if (r) { r.status = 'in_review'; r.organizer = CU.id; renderPage('request-status'); toast('Plan submitted to client for review!', 'success'); }\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  REPORTS\r
    // ════════════════════════════════════════════════\r
    function operationalReportBadge(status) { return { Draft: 'yellow', Submitted: 'purple', Reviewed: 'green' }[status] || 'gray'; }\r
    function pageOperationalReports() { const reports = DB.operationalReports || []; return \`<div class="page-hd"><div class="page-hd-left"><div class="page-title">Reports</div><div class="page-sub">Submit support, finance, and combined operational reports to Super Admin.</div></div><div class="page-hd-right"><button class="btn btn-primary" onclick="openSubmitOperationalReportModal()">📤 Submit Report</button></div></div><div class="grid-3 mb-20">\${['Support Report', 'Finance Report', 'Combined Operational Report'].map(type => \`<div class="stat-card"><div class="stat-icon">\${type === 'Support Report' ? '📩' : type === 'Finance Report' ? '💳' : '📊'}</div><div class="stat-value">\${reports.filter(item => item.type === type).length}</div><div class="stat-label">\${type}s</div></div>\`).join('')}</div><div class="card"><div class="h4 mb-12">Operational Reports</div><div class="table-wrap"><table><thead><tr><th>Report</th><th>Type</th><th>Owner</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>\${reports.map(item => \`<tr><td><strong>\${item.title}</strong></td><td>\${item.type}</td><td>\${item.owner}</td><td><span class="badge badge-\${operationalReportBadge(item.status)}">\${item.status}</span></td><td>\${item.updated}</td><td>\${item.status === 'Draft' ? \`<button class="btn btn-primary btn-xs" onclick="submitOperationalReport('\${item.id}')">Submit</button>\` : '<span class="small">Tracked</span>'}</td></tr>\`).join('')}</tbody></table></div></div>\`; }\r
    function openOperationalReportModal() { openModal('Prepare Operational Report', \`<div class="form-group"><label class="form-label">Report Type</label><select class="form-control" id="op-report-type"><option>Support Report</option><option>Finance Report</option><option>Combined Operational Report</option></select></div><div class="form-group"><label class="form-label">Report Title</label><input class="form-control" id="op-report-title" placeholder="e.g. September support review"></div>\`, [{ lbl: 'Save Draft', cls: 'btn-primary', fn: 'saveOperationalReport()' }]); }\r
    function saveOperationalReport() { const title = v('op-report-title'); if (!title) { toast('Enter a report title', 'error'); return; } DB.operationalReports.push({ id: \`OPR-\${Date.now()}\`, type: v('op-report-type'), title, owner: CU.name, status: 'Draft', updated: 'Just now' }); saveDB(); closeModal(); renderPage('reports'); toast('Report saved as draft', 'success'); }\r
    function openSubmitOperationalReportModal() { openModal('Submit Operational Report', \`<div class="form-group"><label class="form-label">Report Type</label><select class="form-control" id="op-submit-type"><option>Support Report</option><option>Finance Report</option><option>Combined Operational Report</option></select></div><div class="form-group"><label class="form-label">Report Title</label><input class="form-control" id="op-submit-title" placeholder="e.g. September support review"></div>\`, [{ lbl: 'Submit Report', cls: 'btn-primary', fn: 'submitNewOperationalReport()' }]); }\r
    function submitNewOperationalReport() { const title = v('op-submit-title'); if (!title) { toast('Enter a report title', 'error'); return; } DB.operationalReports.push({ id: \`OPR-\${Date.now()}\`, type: v('op-submit-type'), title, owner: CU.name, status: 'Submitted', updated: 'Just now' }); saveDB(); closeModal(); renderPage('reports'); toast('Report submitted to Super Admin', 'success'); }\r
    function submitOperationalReport(id) { const report = DB.operationalReports.find(item => item.id === id); if (!report) return; report.status = 'Submitted'; report.updated = 'Just now'; saveDB(); renderPage('reports'); toast('Report submitted to Super Admin', 'success'); }\r
    function eventOpsReportBadge(status) {\r
      if (status === 'Submitted') return 'purple';\r
      if (status === 'Pending Review' || status === 'Pending') return 'orange';\r
      if (status === 'Reviewed') return 'green';\r
      if (status === 'Draft') return 'yellow';\r
      return 'gray';\r
    }\r
\r
    function pageEventOpsReports() {\r
      const reports = DB.eventOpsReports || [];\r
      const searchQuery = (sessionStorage.getItem('eor_search') || '').toLowerCase();\r
      const typeFilter = sessionStorage.getItem('eor_type') || '';\r
      const statusFilter = sessionStorage.getItem('eor_status') || '';\r
\r
      const perfCount = reports.filter(r => r.type === 'Event Performance Report').length;\r
      const opsCount = reports.filter(r => r.type === 'Event Operations Report').length;\r
      const actCount = reports.filter(r => r.type === 'Event Activity Report').length;\r
\r
      const submittedCount = reports.filter(r => r.status === 'Submitted').length;\r
      const pendingReviewCount = reports.filter(r => r.status === 'Pending Review' || r.status === 'Pending').length;\r
      const reviewedCount = reports.filter(r => r.status === 'Reviewed').length;\r
\r
      const filtered = reports.filter(r => {\r
        const titleStr = (r.title || '').toLowerCase();\r
        const idStr = (r.id || '').toLowerCase();\r
        const scopeStr = (r.scope || '').toLowerCase();\r
        const matchesQuery = !searchQuery || titleStr.includes(searchQuery) || idStr.includes(searchQuery) || scopeStr.includes(searchQuery);\r
        const matchesType = !typeFilter || r.type === typeFilter;\r
        const matchesStatus = !statusFilter || r.status === statusFilter || (statusFilter === 'Pending Review' && r.status === 'Pending');\r
        return matchesQuery && matchesType && matchesStatus;\r
      });\r
\r
      return \`\r
        <div class="page-hd">\r
          <div class="page-hd-left">\r
            <div class="page-title">Event Operations Reports</div>\r
            <div class="page-sub">Submit, view, and track operational performance, logistics, and activity reports for Super Admin review.</div>\r
          </div>\r
          <div class="page-hd-right">\r
            <button class="btn btn-primary" onclick="openCreateEventOpsReportModal()">📤 Submit Report</button>\r
          </div>\r
        </div>\r
\r
        <div class="grid-3 mb-20">\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>\r
            <div class="stat-value" style="color:var(--accent)">\${perfCount}</div>\r
            <div class="stat-label">Performance Reports</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">⚙️</div>\r
            <div class="stat-value" style="color:var(--purple)">\${opsCount}</div>\r
            <div class="stat-label">Operations Reports</div>\r
          </div>\r
          <div class="stat-card">\r
            <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📄</div>\r
            <div class="stat-value" style="color:var(--blue)">\${actCount}</div>\r
            <div class="stat-label">Activity Reports</div>\r
          </div>\r
        </div>\r
\r
        <div class="grid-3 mb-20">\r
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">\r
            <div>\r
              <div class="small muted" style="font-weight:600">Submitted Reports</div>\r
              <div style="font-size:20px;font-weight:800;color:var(--purple);margin-top:2px">\${submittedCount}</div>\r
            </div>\r
            <span class="badge badge-purple">Submitted</span>\r
          </div>\r
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">\r
            <div>\r
              <div class="small muted" style="font-weight:600">Pending Review</div>\r
              <div style="font-size:20px;font-weight:800;color:var(--orange);margin-top:2px">\${pendingReviewCount}</div>\r
            </div>\r
            <span class="badge badge-orange">In Review</span>\r
          </div>\r
          <div class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:var(--surface2)">\r
            <div>\r
              <div class="small muted" style="font-weight:600">Reviewed Reports</div>\r
              <div style="font-size:20px;font-weight:800;color:var(--green);margin-top:2px">\${reviewedCount}</div>\r
            </div>\r
            <span class="badge badge-green">Approved</span>\r
          </div>\r
        </div>\r
\r
        <div class="card">\r
          <div class="filter-row mb-16" style="display:flex;gap:12px;flex-wrap:wrap">\r
            <div class="search-box input-group" style="flex:1;min-width:240px">\r
              <span class="input-icon">🔍</span>\r
              <input class="form-control" id="eor-search" placeholder="Search reports by title, scope, or ID..." value="\${sessionStorage.getItem('eor_search') || ''}" oninput="refreshEorPage()">\r
            </div>\r
            <select class="form-control filter-select" id="eor-type-filter" onchange="refreshEorPage()" style="width:220px">\r
              <option value="">All Report Types</option>\r
              <option value="Event Performance Report" \${typeFilter === 'Event Performance Report' ? 'selected' : ''}>Event Performance Report</option>\r
              <option value="Event Operations Report" \${typeFilter === 'Event Operations Report' ? 'selected' : ''}>Event Operations Report</option>\r
              <option value="Event Activity Report" \${typeFilter === 'Event Activity Report' ? 'selected' : ''}>Event Activity Report</option>\r
            </select>\r
            <select class="form-control filter-select" id="eor-status-filter" onchange="refreshEorPage()" style="width:170px">\r
              <option value="">All Statuses</option>\r
              <option value="Draft" \${statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>\r
              <option value="Submitted" \${statusFilter === 'Submitted' ? 'selected' : ''}>Submitted</option>\r
              <option value="Pending Review" \${statusFilter === 'Pending Review' ? 'selected' : ''}>Pending Review</option>\r
              <option value="Reviewed" \${statusFilter === 'Reviewed' ? 'selected' : ''}>Reviewed</option>\r
            </select>\r
          </div>\r
\r
          <div class="table-wrap">\r
            <table>\r
              <thead>\r
                <tr>\r
                  <th>Report</th>\r
                  <th>Report Type</th>\r
                  <th>Event / Scope</th>\r
                  <th>Attached File</th>\r
                  <th>Status</th>\r
                  <th>Last Updated</th>\r
                  <th>Action</th>\r
                </tr>\r
              </thead>\r
              <tbody>\r
                \${filtered.length ? filtered.map(r => \`\r
                  <tr>\r
                    <td>\r
                      <div style="font-weight:700;color:var(--text);font-size:13.5px">\${r.title}</div>\r
                      <div class="small muted">ID: \${r.id} · Submitted By: \${r.owner || 'Elena Rostova'}</div>\r
                    </td>\r
                    <td>\r
                      <span class="badge badge-\${r.type === 'Event Performance Report' ? 'purple' : r.type === 'Event Operations Report' ? 'blue' : 'orange'}">\${r.type}</span>\r
                    </td>\r
                    <td class="small" style="font-weight:600;color:var(--text2)">\${r.scope || '—'}</td>\r
                    <td>\r
                      \${r.fileName\r
          ? \`<span style="font-weight:600;color:var(--accent);font-size:12.5px">📄 \${r.fileName}</span>\`\r
          : \`<span class="small muted">No file attached</span>\`\r
        }\r
                    </td>\r
                    <td>\r
                      <span class="badge badge-\${eventOpsReportBadge(r.status)}">\${r.status}</span>\r
                    </td>\r
                    <td class="small muted">\${r.updated}</td>\r
                    <td>\r
                      <div class="flex gap-6">\r
                        <button class="btn btn-ghost btn-xs" onclick="viewEventOpsReportModal('\${r.id}')">View Details</button>\r
                        \${r.status === 'Draft' ? \`<button class="btn btn-primary btn-xs" onclick="submitDraftEventOpsReport('\${r.id}')">📤 Submit</button>\` : ''}\r
                      </div>\r
                    </td>\r
                  </tr>\r
                \`).join('') : '<tr><td colspan="7" class="text-center py-20 muted">No operational reports found matching your criteria.</td></tr>'}\r
              </tbody>\r
            </table>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    function refreshEorPage() {\r
      sessionStorage.setItem('eor_search', v('eor-search'));\r
      sessionStorage.setItem('eor_type', v('eor-type-filter'));\r
      sessionStorage.setItem('eor_status', v('eor-status-filter'));\r
      renderPage('reports');\r
    }\r
\r
    function submitDraftEventOpsReport(reportId) {\r
      const r = (DB.eventOpsReports || []).find(item => item.id === reportId);\r
      if (!r) return;\r
      r.status = 'Submitted';\r
      r.updated = 'Just now';\r
      saveDB();\r
      renderPage('reports');\r
      toast('Report submitted to Super Admin for review!', 'success');\r
    }\r
\r
    function viewEventOpsReportModal(reportId) {\r
      const r = (DB.eventOpsReports || []).find(item => item.id === reportId);\r
      if (!r) return;\r
      openModal(\`Report: \${r.title}\`, \`\r
        <div class="info-row"><span class="info-label">Report ID</span><span class="info-value mono">\${r.id}</span></div>\r
        <div class="info-row"><span class="info-label">Report Type</span><span class="info-value"><span class="badge badge-purple">\${r.type}</span></span></div>\r
        <div class="info-row"><span class="info-label">Event / Scope</span><span class="info-value"><strong>\${r.scope || '—'}</strong></span></div>\r
        <div class="info-row"><span class="info-label">Reporting Period</span><span class="info-value">\${r.period || '—'}</span></div>\r
        <div class="info-row"><span class="info-label">Submitted By</span><span class="info-value">\${r.owner || 'Elena Rostova'}</span></div>\r
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-\${eventOpsReportBadge(r.status)}">\${r.status}</span></span></div>\r
        <div class="info-row"><span class="info-label">Last Updated</span><span class="info-value">\${r.updated}</span></div>\r
        <div class="info-row"><span class="info-label">Attached File</span><span class="info-value" style="color:var(--accent);font-weight:700">\${r.fileName ? '📄 ' + r.fileName : 'No file attached'}</span></div>\r
        <div class="mt-12" style="padding:12px;background:var(--surface2);border-radius:8px;font-size:12.5px;color:var(--text2)">\r
          ℹ️ <strong>Workflow:</strong> Submitted reports are routed to Super Admin for review and operational audit.\r
        </div>\r
      \`, r.status === 'Draft' ? [\r
        { lbl: '📤 Submit to Super Admin', cls: 'btn-primary', fn: \`closeModal();submitDraftEventOpsReport('\${r.id}')\` }\r
      ] : []);\r
    }\r
\r
    window.handleReportFileSelect = function (input) {\r
      const preview = document.getElementById('eor-file-preview');\r
      if (input.files && input.files[0]) {\r
        const f = input.files[0];\r
        if (preview) {\r
          preview.innerHTML = \`\r
            <div class="flex items-center justify-between" style="background:var(--accent-dim);border-radius:8px;padding:10px 14px">\r
              <div style="font-weight:600;color:var(--accent);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 \${f.name} (\${(f.size / 1024).toFixed(1)} KB)</div>\r
              <button type="button" class="btn btn-danger btn-xs" onclick="event.stopPropagation();resetReportFileSelect()">✕ Remove</button>\r
            </div>\r
          \`;\r
        }\r
      }\r
    };\r
\r
    window.resetReportFileSelect = function () {\r
      const input = document.getElementById('eor-file');\r
      if (input) input.value = '';\r
      const preview = document.getElementById('eor-file-preview');\r
      if (preview) {\r
        preview.innerHTML = \`\r
          <div style="font-size:24px;margin-bottom:6px">📁</div>\r
          <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>\r
          <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>\r
        \`;\r
      }\r
    };\r
\r
    function openCreateEventOpsReportModal() {\r
      const eventsOptions = (DB.events || []).map(e => \`<option value="\${e.title || e.name}">\${e.title || e.name}</option>\`).join('');\r
      openModal('📤 Submit Operational Report', \`\r
        <div class="form-group">\r
          <label class="form-label">Report Type *</label>\r
          <select class="form-control" id="eor-type">\r
            <option value="Event Performance Report">Event Performance Report</option>\r
            <option value="Event Operations Report">Event Operations Report</option>\r
            <option value="Event Activity Report">Event Activity Report</option>\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Report Title *</label>\r
          <input class="form-control" id="eor-title" placeholder="e.g. Event Performance Summary — Q3 2026">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Event / Scope *</label>\r
          <select class="form-control" id="eor-scope">\r
            <option value="Platform Wide">Platform Wide</option>\r
            <option value="All Q3 Events">All Q3 Events</option>\r
            <option value="Main Convention Center">Main Convention Center</option>\r
            \${eventsOptions}\r
          </select>\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Reporting Period *</label>\r
          <input class="form-control" id="eor-period" placeholder="e.g. August 2026, Q3 2026, Week 34">\r
        </div>\r
        <div class="form-group">\r
          <label class="form-label">Upload Report *</label>\r
          <div class="file-upload-box" style="border:2px dashed var(--border);border-radius:10px;padding:20px;text-align:center;background:var(--surface2);cursor:pointer" onclick="document.getElementById('eor-file').click()">\r
            <input type="file" id="eor-file" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="handleReportFileSelect(this)">\r
            <div id="eor-file-preview">\r
              <div style="font-size:24px;margin-bottom:6px">📁</div>\r
              <div style="font-weight:600;font-size:13.5px">Click to browse or upload report file</div>\r
              <div class="small muted">Supported formats: PDF, DOC, DOCX, XLS, XLSX</div>\r
            </div>\r
          </div>\r
        </div>\r
      \`, [\r
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },\r
        { lbl: '📤 Submit Report', cls: 'btn-primary', fn: 'saveEventOpsReportSubmit()' }\r
      ]);\r
    }\r
\r
    function saveEventOpsReportSubmit() {\r
      const type = v('eor-type');\r
      const title = v('eor-title');\r
      const scope = v('eor-scope');\r
      const period = v('eor-period');\r
      const fileInput = document.getElementById('eor-file');\r
\r
      if (!title) { toast('Please enter a report title', 'error'); return; }\r
      if (!period) { toast('Please specify a reporting period', 'error'); return; }\r
      if (!fileInput || !fileInput.files || !fileInput.files.length) {\r
        toast('Please upload a report file', 'error');\r
        return;\r
      }\r
\r
      const file = fileInput.files[0];\r
\r
      const newReport = {\r
        id: \`EOR-\${Date.now().toString().slice(-4)}\`,\r
        type: type,\r
        title: title,\r
        scope: scope,\r
        period: period,\r
        fileName: file.name,\r
        owner: CU.name || 'Elena Rostova',\r
        status: 'Submitted',\r
        updated: 'Just now'\r
      };\r
\r
      if (!DB.eventOpsReports) DB.eventOpsReports = [];\r
      DB.eventOpsReports.unshift(newReport);\r
      saveDB();\r
      closeModal();\r
      renderPage('reports');\r
      toast('Report submitted to Super Admin for review!', 'success');\r
    }\r
\r
    function pageReports() {\r
      if (!DB.reports) DB.reports = [];\r
      if (CU.role === 'staff' && CU.employeeType === 'SUPPORT_FINANCE') return pageOperationalReports();\r
      if (CU.role === 'staff' && CU.employeeType === 'EVENT_OPERATIONS') return pageEventOpsReports();\r
\r
    // Super Admin gets dedicated analytics dashboard\r
    if (CU.role === 'superuser') {\r
      const participationData = [\r
        { label: 'Marketing', value: 350 },\r
        { label: 'Annual Gala', value: 620 },\r
        { label: 'Networking', value: 480 }\r
      ];\r
      const summaryRows = [\r
        { label: 'Total Events Created', value: '24', delta: '+8.2%' },\r
        { label: 'Total Registrations', value: '4,782', delta: '+15.3%' },\r
        { label: 'Active Staff Members', value: '18', delta: '+5' },\r
        { label: 'Average Rating', value: '4.8/5', delta: '+0.3' }\r
      ];\r
      const maxParticipation = Math.max(...participationData.map(item => item.value));\r
\r
      return \`\r
        <div style="background:#f5f0fb;min-height:100vh;padding:22px 0 28px;">\r
          <div style="max-width:1180px;margin:0 auto;padding:0 8px;">\r
            <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 16px;">\r
              <div>\r
                <div style="font-size:13px;font-weight:700;color:#7c6ff7;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">Performance</div>\r
                <div style="font-size:28px;font-weight:800;color:#1c1830;line-height:1.2;margin-top:4px;font-family:'Syne', sans-serif;">Reports &amp; Analytics</div>\r
                <div style="font-size:15px;color:#7f7893;margin-top:4px;">View insights and analytics for all events</div>\r
              </div>\r
              <button type="button" onclick="toast('Export feature coming soon','info')" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#7c6ff7,#8a6cf3);border:none;color:#fff;box-shadow:0 10px 20px rgba(124,111,247,.25);cursor:pointer;font-size:20px;">⇩</button>\r
            </div>\r
\r
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:20px;">\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Total Revenue</div>\r
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">?1.2M</div>\r
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>\r
              </div>\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Average Attendance</div>\r
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">287</div>\r
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>\r
              </div>\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="font-size:13px;color:#625a78;font-weight:600;margin-bottom:14px;">Event Success Rate</div>\r
                <div style="font-size:42px;font-weight:800;color:#1d1830;line-height:1;font-family:'Syne', sans-serif;letter-spacing:-0.06em;">94%</div>\r
                <div style="margin-top:16px;height:5px;border-radius:99px;background:linear-gradient(90deg,#7c6ff7,#8ac8b9);width:82px;opacity:0.95;"></div>\r
              </div>\r
            </div>\r
\r
            <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-bottom:20px;">\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 14px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">\r
                  <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Attendance Trends</div>\r
                  <div style="font-size:12px;color:#7d738e;">Monthly attendance overview</div>\r
                </div>\r
                <svg viewBox="0 0 520 180" width="100%" height="180" preserveAspectRatio="none" style="display:block;overflow:visible;">\r
                  <g stroke="#dcd4ea" stroke-width="1">\r
                    <line x1="18" y1="25" x2="500" y2="25" />\r
                    <line x1="18" y1="66" x2="500" y2="66" />\r
                    <line x1="18" y1="107" x2="500" y2="107" />\r
                    <line x1="18" y1="148" x2="500" y2="148" />\r
                  </g>\r
                  <g fill="#8a7ea6" font-size="10" font-family="DM Sans, sans-serif">\r
                    <text x="26" y="170">Jan</text>\r
                    <text x="89" y="170">Feb</text>\r
                    <text x="150" y="170">Mar</text>\r
                    <text x="211" y="170">Apr</text>\r
                    <text x="272" y="170">May</text>\r
                    <text x="333" y="170">Jun</text>\r
                  </g>\r
                  <path d="M 22 120 L 89 98 L 150 75 L 211 68 L 272 52 L 333 86 L 394 64 L 457 58 L 500 98" fill="none" stroke="#7c6ff7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />\r
                  <g fill="#7c6ff7">\r
                    <circle cx="22" cy="120" r="4"/>\r
                    <circle cx="89" cy="98" r="4"/>\r
                    <circle cx="150" cy="75" r="4"/>\r
                    <circle cx="211" cy="68" r="4"/>\r
                    <circle cx="272" cy="52" r="4"/>\r
                    <circle cx="333" cy="86" r="4"/>\r
                    <circle cx="394" cy="64" r="4"/>\r
                    <circle cx="457" cy="58" r="4"/>\r
                    <circle cx="500" cy="98" r="4"/>\r
                  </g>\r
                </svg>\r
                <div style="margin-top:6px;padding-top:12px;border-top:1px solid #eee7f6;display:flex;align-items:center;gap:8px;color:#5f5b72;font-size:12px;">\r
                  <span style="width:10px;height:10px;border-radius:50%;background:#7c6ff7;display:inline-block;"></span>\r
                  <span style="font-weight:600;color:#1d1832;">Attendees</span>\r
                </div>\r
              </div>\r
\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 18px 14px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">\r
                  <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Event Participation</div>\r
                  <div style="font-size:12px;color:#7d738e;">Participants by event</div>\r
                </div>\r
                <div style="display:flex;align-items:end;height:170px;gap:16px;padding-top:8px;padding-left:6px;padding-right:6px;">\r
                  \${participationData.map((item) => \`\r
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:12px;height:100%;">\r
                      <div style="width:100%;display:flex;justify-content:center;align-items:flex-end;height:100%;">\r
                        <div style="width:54px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#8f6ef3,#6a4bd9);height:\${(item.value / maxParticipation) * 100}%;min-height:36px;box-shadow:0 12px 18px rgba(124,111,247,.18);"></div>\r
                      </div>\r
                      <div style="font-size:11px;color:#7c748f;text-align:center;white-space:nowrap;">\${item.label}</div>\r
                    </div>\r
                  \`).join('')}\r
                </div>\r
              </div>\r
            </div>\r
\r
            <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:18px;">\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Event Status Distribution</div>\r
                <div style="font-size:12px;color:#766f8f;margin-top:4px;">Current event breakdown</div>\r
                <div style="display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;min-height:180px;">\r
                  <div style="position:relative;width:210px;height:210px;border-radius:50%;background:conic-gradient(#7c6ff7 0 47%, #4ec5a5 47% 74%, #d6d2df 74% 100%);margin:8px auto;box-shadow:inset 0 2px 10px rgba(0,0,0,0.03);">\r
                    <div style="position:absolute;inset:30px;border-radius:50%;background:#f5f0fb;"></div>\r
                  </div>\r
                  <div style="display:flex;flex-direction:column;gap:12px;min-width:120px;padding-right:10px;">\r
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#7c6ff7;"></span>Ongoing 57%</div>\r
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4ec5a5;"></span>Completed 28%</div>\r
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#524d63;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#d6d2df;"></span>Upcoming 15%</div>\r
                  </div>\r
                </div>\r
              </div>\r
\r
              <div style="background:rgba(255,255,255,0.7);border:1px solid #eee4f8;border-radius:18px;padding:18px 20px;box-shadow:0 10px 22px rgba(123,102,166,0.06);">\r
                <div style="font-size:15px;font-weight:700;color:#1d1832;font-family:'Syne', sans-serif;">Summary Statistics</div>\r
                <div style="font-size:12px;color:#766f8f;margin-top:4px;">Key performance indicators</div>\r
                <div style="margin-top:18px;display:flex;flex-direction:column;gap:0;">\r
                  \${summaryRows.map((row, index) => \`\r
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:\${index === 0 ? 'none' : '1px solid #eee7f6'};font-size:15px;color:#2a2439;">\r
                      <span>\${row.label}</span>\r
                      <span style="font-weight:700;color:#1d1832;margin-left:10px;">\${row.value}</span>\r
                      <span style="color:\${row.delta.startsWith('+') ? '#2bb77b' : '#e56767'};font-weight:700;font-size:12px;margin-left:8px;">\${row.delta}</span>\r
                    </div>\r
                  \`).join('')}\r
                </div>\r
              </div>\r
            </div>\r
          </div>\r
        </div>\r
      \`;\r
    }\r
\r
    // ── NON-SUPERUSER: original client/staff report view ──────\r
      const tab = sessionStorage.getItem('reports_tab') || 'client';\r
      const myEvents = CU.role === 'organizer' ? DB.events.filter(e => e.organizer === CU.id) : DB.events;\r
      const completedEvents = myEvents.filter(e => e.status === 'completed').length;\r
      const pendingReports = myEvents.filter(e => e.status === 'completed' && !DB.reports.find(r => r.eventId === e.id)).length;\r
      const submittedReports = DB.reports.filter(r => myEvents.map(e => e.id).includes(r.eventId)).length;\r
\r
      const clientReportContent = \`\r
    <div class="grid-3 mb-24">\r
      <div class="stat-card" style="border: 1px solid var(--blue-dim); background: rgba(66, 153, 225, 0.05); padding: 16px;">\r
        <div class="small" style="color:var(--blue); font-weight:600; margin-bottom: 12px">Total Completed</div>\r
        <div style="display:flex; align-items:center; gap: 12px;">\r
          <div class="stat-icon" style="background:var(--blue);color:#fff;margin:0;font-size:16px;border-radius:50%">✓</div>\r
          <div>\r
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">\${completedEvents}</div>\r
            <div class="small" style="color:var(--text2)">Total events</div>\r
          </div>\r
        </div>\r
      </div>\r
      <div class="stat-card" style="border: 1px solid var(--green-dim); background: rgba(34, 211, 165, 0.05); padding: 16px;">\r
        <div class="small" style="color:var(--green); font-weight:600; margin-bottom: 12px">Reports Submitted</div>\r
        <div style="display:flex; align-items:center; gap: 12px;">\r
          <div class="stat-icon" style="background:var(--green);color:#fff;margin:0;font-size:15px;border-radius:8px">📄</div>\r
          <div>\r
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">\${submittedReports}</div>\r
            <div class="small" style="color:var(--text2)">Reports submitted</div>\r
          </div>\r
        </div>\r
      </div>\r
      <div class="stat-card" style="border: 1px solid var(--orange-dim); background: rgba(237, 137, 54, 0.05); padding: 16px;">\r
        <div class="small" style="color:var(--orange); font-weight:600; margin-bottom: 12px">Pending Submissions</div>\r
        <div style="display:flex; align-items:center; gap: 12px;">\r
          <div class="stat-icon" style="background:var(--orange);color:#fff;margin:0;font-size:16px;border-radius:50%">🕒</div>\r
          <div>\r
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">\${pendingReports}</div>\r
            <div class="small" style="color:var(--text2)">Reports pending</div>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
    \r
    <div class="h4 mb-16" style="display:flex;align-items:center;gap:8px"><span style="color:var(--orange);font-size:18px">⭕</span> Pending Submissions</div>\r
    <div style="display:flex;flex-direction:column;gap:16px">\r
      \${myEvents.filter(e => e.status === 'completed' && !DB.reports.find(r => r.eventId === e.id)).map(e => \`\r
        <div class="card" style="background:var(--surface); border:1px solid var(--border); padding:20px; border-radius:12px;">\r
          <div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--text)">\${e.title}</div>\r
          <div style="display:flex;flex-wrap:wrap;gap:24px;margin-bottom:16px;color:var(--text2);font-size:13px">\r
            <div style="display:flex;align-items:center;gap:6px"><span>📅</span> \${e.date}</div>\r
            <div style="display:flex;align-items:center;gap:6px"><span>📍</span> \${e.venue || e.city || 'Location'}</div>\r
            <div style="display:flex;align-items:center;gap:6px"><span>👥</span> \${DB.registrations.filter(r => r.eventId === e.id).length} Attendees</div>\r
            <div style="display:flex;align-items:center;gap:6px"><span>👷</span> \${DB.staffAssignments.filter(a => a.eventId === e.id).length} Staff</div>\r
          </div>\r
          <div class="flex gap-12">\r
            <button class="btn btn-primary" onclick="openSubmitReportModal('\${e.id}')" style="gap:6px; background:var(--accent); border-radius:8px">📤 Submit Report</button>\r
            <button class="btn btn-ghost" onclick="openViewEventDrawer('\${e.id}')" style="color:var(--accent);border-color:var(--accent-dim);background:var(--accent-dim);gap:6px; border-radius:8px">👁 View Event Details</button>\r
          </div>\r
        </div>\r
      \`).join('')}\r
      \${pendingReports === 0 ? \`<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">All Reports Submitted</div><p class="empty-desc">Great job! All your completed events have reports.</p></div>\` : ''}\r
    </div>\r
  \`;\r
\r
      const staffReportContent = \`\r
    <div class="page-hd">\r
      <div class="page-hd-left"><div class="page-title">Staff Reports</div><div class="page-sub">View and download attendance reports submitted by your staff</div></div>\r
    </div>\r
    <div style="display:flex;flex-direction:column;gap:16px">\r
      \${myEvents.filter(e => e.status === 'completed').map(e => {\r
        const staffAssigned = DB.staffAssignments.filter(a => a.eventId === e.id).length;\r
        return \`\r
        <div class="card" style="border-left:3px solid var(--accent)">\r
          <div class="flex justify-between items-start mb-12">\r
            <div>\r
              <div style="font-weight:700;font-size:15px;margin-bottom:4px">\${e.title}</div>\r
              <div class="small" style="display:flex;gap:12px;margin-bottom:8px">\r
                <span>📅 \${e.date}</span>\r
                <span>📍 \${e.venue}</span>\r
                <span>👷 Staff Assigned: \${staffAssigned}</span>\r
              </div>\r
            </div>\r
            <button class="btn btn-ghost btn-sm" onclick="downloadReport('\${e.id}')" style="border:1px solid var(--border);border-radius:6px">⬇️ Download Report</button>\r
          </div>\r
        </div>\r
        \`;\r
      }).join('')}\r
      \${myEvents.filter(e => e.status === 'completed').length === 0 ? \`<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">No completed events yet</div></div>\` : ''}\r
    </div>\r
  \`;\r
\r
      const employeeReportContent = \`\r
    <div class="page-hd">\r
      <div class="page-hd-left"><div class="page-title">Submitted Event Reports</div><div class="page-sub">View who submitted each report. Reports cannot be submitted or edited here.</div></div>\r
    </div>\r
    <div class="table-wrap">\r
      \${DB.reports.filter(report => myEvents.some(event => String(event.id) === String(report.eventId))).length === 0\r
          ? \`<div class="empty"><div class="empty-icon">📄</div><div class="empty-title">No reports submitted</div><p class="empty-desc">Submitted event reports will appear here.</p></div>\`\r
          : \`<table><thead><tr><th>Event</th><th>File</th><th>Submitted By</th><th>Submitted At</th><th>Actions</th></tr></thead><tbody>\r
        \${DB.reports.filter(report => myEvents.some(event => String(event.id) === String(report.eventId))).map(report => {\r
            const event = myEvents.find(item => String(item.id) === String(report.eventId));\r
            const submitter = DB.users.find(user => String(user.id) === String(report.submittedBy));\r
            return \`<tr><td><strong>\${event ? event.title : 'Unknown Event'}</strong></td><td>\${report.fileName || 'Report file'}</td><td>\${submitter ? \`\${submitter.name}<div class="small">\${submitter.email || ''}</div>\` : 'Unknown user'}</td><td>\${report.submittedAt || '—'}</td><td><button class="btn btn-xs btn-danger" onclick="deleteEventReport('\${report.id}')">Remove</button></td></tr>\`;\r
          }).join('')}\r
      </tbody></table>\`}\r
    </div>\r
  \`;\r
\r
      return \`\r
  <div style="padding:24px;background:var(--bg);">\r
    <div class="page-hd" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">\r
      <div class="page-hd-left">\r
        <div class="page-title">Event Reports</div>\r
        <div class="page-sub">\${CU.role === 'organizer' ? 'Review submitted reports and remove them when needed' : 'Manage client reports and review staff submissions'}</div>\r
      </div>\r
      <div class="page-hd-right">\r
        <button class="btn" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-weight:600;padding:8px 16px;border-radius:8px;gap:8px" onclick="toast('\${completedEvents} Completed Events','info')"><span style="font-size:16px;color:var(--accent)">📄</span> \${completedEvents} Completed Events</button>\r
      </div>\r
    </div>\r
    \r
    \${isEmployeeAccount() ? employeeReportContent : \`<div style="display:flex;gap:24px;border-bottom:1px solid var(--border);margin-bottom:24px">\r
      <div style="padding-bottom:12px;border-bottom:2px solid \${tab === 'client' ? 'var(--accent)' : 'transparent'};color:\${tab === 'client' ? 'var(--accent)' : 'var(--text2)'};font-weight:\${tab === 'client' ? '600' : '500'};cursor:pointer;font-size:14px;transition:all 0.2s" onclick="switchReportTab('client')">Client Reports</div>\r
      \${(CU.role === 'organizer' || CU.role === 'staff' || CU.role === 'superuser') ? \`<div style="padding-bottom:12px;border-bottom:2px solid \${tab === 'staff' ? 'var(--accent)' : 'transparent'};color:\${tab === 'staff' ? 'var(--accent)' : 'var(--text2)'};font-weight:\${tab === 'staff' ? '600' : '500'};cursor:pointer;font-size:14px;transition:all 0.2s" onclick="switchReportTab('staff')">Staff Reports</div>\` : ''}\r
    </div>\r
\r
    \${tab === 'client' ? clientReportContent : staffReportContent}\`}\r
  </div>\r
  \`;\r
    }\r
\r
    function switchReportTab(t) {\r
      if (CU && CU.role === "superuser") sessionStorage.setItem("admin_reports_tab", t);\r
      else sessionStorage.setItem("reports_tab", t);\r
      renderPage("reports");\r
    }\r
\r
\r
    function openSubmitReportModal(eventId) {\r
      const e = DB.events.find(ev => ev.id == eventId);\r
      if (!e) return;\r
      openModal('Submit Event Report', \`\r
    <div class="form-group" style="text-align:center; padding: 40px; border: 2px dashed var(--border); border-radius: 8px;">\r
      <div style="font-size: 32px; margin-bottom: 12px;">📁</div>\r
      <label class="form-label" style="font-size:16px">Upload Report File</label>\r
      <div class="small" style="color:var(--text2); margin-bottom: 16px;">PDF, DOCX, XLSX (Max 10MB)</div>\r
      <input type="file" id="report-file" style="display:none" onchange="document.getElementById('file-name').textContent = this.files[0] ? this.files[0].name : ''">\r
      <button class="btn btn-ghost" onclick="document.getElementById('report-file').click()">Select File</button>\r
      <div id="file-name" style="margin-top:12px; font-weight: 500; color: var(--accent);"></div>\r
    </div>\r
  \`, [{ lbl: 'Submit File', cls: 'btn-primary', fn: \`submitEventReport('\${eventId}')\` }]);\r
    }\r
\r
    function submitEventReport(eventId) {\r
      const fileInput = document.getElementById('report-file');\r
      if (!fileInput || !fileInput.files.length) { toast('Please select a file to submit', 'error'); return; }\r
      const fileName = fileInput.files[0].name;\r
      const report = { id: Date.now(), eventId, fileName, submittedBy: CU.id, submittedAt: new Date().toLocaleString() };\r
      DB.reports.push(report);\r
      saveDB();\r
      closeModal();\r
\r
      // Notify organizer if not submitted by them\r
      const e = DB.events.find(ev => ev.id == eventId);\r
      if (e && CU.id !== e.organizer) {\r
        DB.notifications.push({\r
          id: DB._nextId.notifs++,\r
          userId: e.organizer,\r
          type: 'info',\r
          title: 'Staff Report Received',\r
          msg: \`A report file for \${e.title} has been submitted by \${CU.name}.\`,\r
          read: false,\r
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })\r
        });\r
        saveDB();\r
        updateNotifDot();\r
      }\r
\r
      renderPage(_currentPage);\r
      toast('Report file submitted successfully!', 'success');\r
    }\r
\r
    function deleteEventReport(reportId) {\r
      const report = DB.reports.find(item => String(item.id) === String(reportId));\r
      if (!report) return;\r
      confirm2('Remove Event Report', 'Remove this submitted report?', () => {\r
        const index = DB.reports.findIndex(item => String(item.id) === String(reportId));\r
        if (index === -1) return;\r
        DB.reports.splice(index, 1);\r
        saveDB();\r
        renderPage('reports');\r
        toast('Event report removed', 'info');\r
      });\r
    }\r
\r
    function openSubmitStaffReportModal(eventId) {\r
      openSubmitReportModal(eventId);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  STAFF REPORTS\r
    // ════════════════════════════════════════════════\r
    function pageStaffReports() {\r
      const myAssignments = DB.staffAssignments.filter(a => a.staffId === CU.id && a.status === 'accepted');\r
      const myEvents = myAssignments.map(a => {\r
        const e = DB.events.find(ev => ev.id === a.eventId);\r
        return e ? { ...e, assignment: a } : null;\r
      }).filter(e => e);\r
\r
      const allRegs = myEvents.flatMap(e => DB.registrations.filter(r => r.eventId === e.id));\r
      const verified = allRegs.filter(r => r.checkedIn).length;\r
      const verificationRate = allRegs.length ? Math.round((verified / allRegs.length) * 100) : 0;\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Reports</div>\r
      <div class="page-sub">View and manage attendance reports for all events</div>\r
    </div>\r
  </div>\r
  \r
  <div class="grid-4 mb-20">\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📅</div><div class="stat-value" style="color:var(--accent)">\${myEvents.length}</div><div class="stat-label">Total Events</div><div class="stat-sub">With verified attendees</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">\${allRegs.length}</div><div class="stat-label">Total Attendees</div><div class="stat-sub">Across all events</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">✅</div><div class="stat-value" style="color:var(--blue)">\${verified}</div><div class="stat-label">Verified</div><div class="stat-sub">Total verified</div></div>\r
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📈</div><div class="stat-value" style="color:var(--yellow)">\${verificationRate}%</div><div class="stat-label">Verification Rate</div><div class="stat-sub">Overall performance</div></div>\r
  </div>\r
  \r
  <div class="h4 mb-16">Attendee Reports</div>\r
  \${myEvents.length === 0 ? \`<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">No Assigned Events</div><p>You don't have any event staff assignments yet.</p></div>\` : myEvents.map(e => {\r
        const eventRegs = DB.registrations.filter(r => r.eventId === e.id);\r
        const checkedIn = eventRegs.filter(r => r.checkedIn);\r
        const rate = eventRegs.length ? Math.round((checkedIn.length / eventRegs.length) * 100) : 0;\r
        return \`\r
    <div class="card mb-16" style="overflow:hidden">\r
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">\r
        <div>\r
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:24px">\${e.emoji || '📅'}</span><div style="font-weight:700;font-size:16px">\${e.title}</div></div>\r
          <div class="small" style="color:var(--text2)">📅 \${e.date} • \${e.location}</div>\r
        </div>\r
        <div style="text-align:right;background:var(--surface2);padding:12px 16px;border-radius:8px">\r
          <div style="font-weight:700;font-size:18px;color:var(--green)">\${checkedIn.length}/\${eventRegs.length}</div>\r
          <div class="small">Verified</div>\r
        </div>\r
      </div>\r
      \r
      <div class="h5 mb-12" style="color:var(--green)">✓ Verified Attendees (\${checkedIn.length})</div>\r
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;background:rgba(34,211,165,0.08);padding:12px;border-radius:8px">\r
        \${checkedIn.length === 0 ? \`<div class="small" style="color:var(--text2)">No attendees verified yet</div>\` : checkedIn.map(r => {\r
          const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
          const ticketType = r.seat === 'VIP' ? 'VIP' : r.seat === 'Premium' ? 'Premium' : 'General';\r
          return \`\r
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--surface3);border-radius:6px">\r
            <div style="display:flex;align-items:center;gap:10px;flex:1">\r
              <div class="av av-xs">\${u.avatar || u.name[0]}</div>\r
              <div style="flex:1">\r
                <div style="font-weight:500;font-size:13px">\${u.name}</div>\r
                <div class="small" style="color:var(--text2)">\${u.email}</div>\r
              </div>\r
            </div>\r
            <div style="display:flex;gap:8px;align-items:center">\r
              <span class="badge badge-purple">\${ticketType}</span>\r
              <span class="small" style="white-space:nowrap;color:var(--text2)">\${r.checkInTime || 'N/A'}</span>\r
            </div>\r
          </div>\`;\r
        }).join('')}\r
      </div>\r
      \r
      <div style="display:flex;gap:10px">\r
        <button class="btn btn-primary w-full" onclick="openSubmitReportModal('\${e.id}')">📝 Submit Report</button>\r
        <button class="btn btn-ghost w-full" onclick="downloadReport('\${e.id}')">⬇️ Download</button>\r
      </div>\r
    </div>\`;\r
      }).join('')}\`;\r
    }\r
\r
    function sendReportToOrganizer(eventId) {\r
      const e = DB.events.find(ev => ev.id == eventId);\r
      const org = DB.users.find(u => u.id === e.organizer);\r
      if (!org) return toast('Organizer not found', 'error');\r
\r
      const eventRegs = DB.registrations.filter(r => r.eventId == eventId);\r
      const verified = eventRegs.filter(r => r.checkedIn).length;\r
\r
      DB.notifications.push({\r
        id: DB._nextId.notifs++,\r
        userId: org.id,\r
        type: 'info',\r
        icon: '📋',\r
        title: 'Attendance Report Ready',\r
        msg: \`Staff \${CU.name} sent attendance report for \${e.title}: \${verified}/\${eventRegs.length} verified\`,\r
        read: false,\r
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })\r
      });\r
\r
      saveDB();\r
      toast('Report sent to organizer!', 'success');\r
      renderPage('staff-reports');\r
    }\r
\r
    function downloadReport(eventId) {\r
      const e = DB.events.find(ev => ev.id == eventId);\r
      const eventRegs = DB.registrations.filter(r => r.eventId == eventId);\r
      const verified = eventRegs.filter(r => r.checkedIn);\r
\r
      let csv = 'Attendee,Email,Ticket Type,Check-In Time,Status\\n';\r
      verified.forEach(r => {\r
        const u = DB.users.find(u => u.id === r.attendeeId) || { name: 'Unknown', email: '' };\r
        const ticketType = r.seat === 'VIP' ? 'VIP' : r.seat === 'Premium' ? 'Premium' : 'General';\r
        csv += \`\${u.name},\${u.email},\${ticketType},\${r.checkInTime || 'N/A'},Verified\\n\`;\r
      });\r
\r
      const blob = new Blob([csv], { type: 'text/csv' });\r
      const url = window.URL.createObjectURL(blob);\r
      const a = document.createElement('a');\r
      a.href = url;\r
      a.download = \`\${e.title.replace(/\\s+/g, '_')}_Report.csv\`;\r
      a.click();\r
      window.URL.revokeObjectURL(url);\r
\r
      toast('Report downloaded!', 'success');\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  NOTIFICATIONS\r
    // ════════════════════════════════════════════════\r
    function visibleNotifications() {\r
      return CU?.role === 'staff' && CU.employeeType === 'SUPPORT_FINANCE'\r
        ? DB.notifications.filter(notification => notification.employeeType === 'SUPPORT_FINANCE')\r
        : DB.notifications;\r
    }\r
    function pageNotifications() {\r
      const notifications = visibleNotifications();\r
      const unread = notifications.filter(n => !n.read).length;\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left"><div class="page-title">Notifications</div><div class="page-sub">\${unread} unread notification\${unread !== 1 ? 's' : ''}</div></div>\r
    <div class="page-hd-right"><button class="btn btn-ghost btn-sm" onclick="markAllRead()">✓ Mark All Read</button></div>\r
  </div>\r
  <div class="card p-0 notif-panel">\r
    \${notifications.length === 0 ? \`<div class="empty"><div class="empty-icon">🔔</div><div class="empty-title">All caught up!</div></div>\` : \`\r
    \${notifications.map(n => \`\r
      <div class="notif-item\${n.read ? '' : ' unread'}" onclick="markNotifRead('\${n.id}')">\r
        <div class="notif-icon" style="background:\${n.type === 'success' ? 'var(--green-dim)' : n.type === 'warning' ? 'var(--yellow-dim)' : n.type === 'error' ? 'var(--red-dim)' : 'var(--accent-dim)'}">\${n.icon || '🔔'}</div>\r
        <div class="notif-content">\r
          <div class="notif-title" style="\${n.read ? '' : 'font-weight:600'}">\${n.title}</div>\r
          <div class="notif-msg">\${n.msg}</div>\r
          <div class="notif-time">\${n.time}</div>\r
        </div>\r
        \${!n.read ? \`<div class="unread-dot"></div>\` : ''}\r
      </div>\`).join('')}\`}\r
  </div>\`;\r
    }\r
    function markNotifRead(id) {\r
      const n = DB.notifications.find(n => n.id == id);\r
      if (!n) return;\r
      n.read = true;\r
      saveDB();\r
      updateNotifDot();\r
      if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType); else buildNav(CU.role);\r
      // Smart redirect: assignment/event-request notifications go to Event Requests tab for staff\r
      if (CU.role === 'staff' &&\r
        (n.title === 'Staff Assignment Pending' || n.title === 'New Assignment' ||\r
          (n.msg && (n.msg.toLowerCase().includes('assign') || n.msg.toLowerCase().includes('event request'))))) {\r
        goNav('staff-event-requests');\r
      } else {\r
        renderPage('notifications');\r
      }\r
    }\r
    function markAllRead() {\r
      visibleNotifications().forEach(n => n.read = true);\r
      renderPage('notifications'); updateNotifDot(); if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType); else buildNav(CU.role); toast('All notifications marked as read', 'success');\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  PROFILE\r
    // ════════════════════════════════════════════════\r
    function pageDepartmentEmployeeProfile() {\r
      const type = CU.employeeType;\r
      const profile = {\r
        REGISTRATION_VERIFICATION: {\r
          title: 'User Executive',\r
          purpose: 'Protect event access by reviewing registrations, validating attendee documents, and resolving account verification issues.',\r
          focus: ['Review pending registrations and identity documents', 'Verify attendee eligibility and ticket details', 'Resolve duplicate-account and registration queries'],\r
          primaryAction: "goNav('registrations')",\r
          primaryLabel: 'Open Registrations',\r
          secondaryAction: "goNav('attendees')",\r
          secondaryLabel: 'Manage Attendees',\r
        },\r
        EVENT_OPERATIONS: {\r
          title: 'Event Executive',\r
          purpose: 'Coordinate event readiness and live delivery, from event information and operational plans to post-event reporting.',\r
          focus: ['Maintain event schedules, venues, and operational details', 'Prepare and track event-operation tasks', 'Coordinate changes with organizers and clients'],\r
          primaryAction: "goNav('events')",\r
          primaryLabel: 'Manage Events',\r
          secondaryAction: "goNav('event-requests')",\r
          secondaryLabel: 'Open Operations',\r
        },\r
        SUPPORT_FINANCE: {\r
          title: 'Customer Support & Finance Executive',\r
          purpose: 'Resolve customer requests and maintain accurate payment, refund, and service-operation records.',\r
          focus: ['Respond to customer support requests', 'Review transactions and refund cases', 'Maintain service and finance operational reports'],\r
          primaryAction: "goNav('support-center')",\r
          primaryLabel: 'Open Support Center',\r
          secondaryAction: "goNav('finance')",\r
          secondaryLabel: 'Open Finance',\r
        },\r
      }[type];\r
\r
      if (!profile) return '';\r
\r
      const registrations = DB.registrations || [];\r
      const supportRequests = DB.supportRequests || [];\r
      const transactions = DB.financeTransactions || [];\r
      const events = DB.events || [];\r
      const verificationPending = registrations.filter(r => !r.verified || ['Pending Review', 'Flagged', 'pending'].includes(r.verificationStatus || r.status)).length;\r
      const verified = registrations.filter(r => r.verified || r.verificationStatus === 'Verified').length;\r
      const activeEvents = events.filter(e => ['upcoming', 'ongoing'].includes(e.status)).length;\r
      const operationalTasks = (DB.eventOperationsTasks || []).filter(task => !task.status || !['completed', 'done'].includes(String(task.status).toLowerCase())).length;\r
      const openSupport = supportRequests.filter(r => !['Resolved', 'Closed'].includes(r.status)).length;\r
      const refundsToReview = (DB.financeRefunds || []).filter(r => !['Approved', 'Completed', 'Rejected'].includes(r.status)).length;\r
      const metrics = type === 'REGISTRATION_VERIFICATION'\r
        ? [['Pending reviews', verificationPending, 'var(--yellow)'], ['Verified attendees', verified, 'var(--green)'], ['Registration records', registrations.length, 'var(--accent)']]\r
        : type === 'EVENT_OPERATIONS'\r
          ? [['Active events', activeEvents, 'var(--accent)'], ['Open operations tasks', operationalTasks, 'var(--yellow)'], ['Event requests', (DB.eventRequests || []).length, 'var(--green)']]\r
          : [['Open support requests', openSupport, 'var(--yellow)'], ['Transactions reviewed', transactions.length, 'var(--blue)'], ['Refunds awaiting review', refundsToReview, 'var(--red)']];\r
\r
      return \`\r
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">My Employee Profile</div><div class="page-sub">Your department responsibilities and work overview.</div></div><div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('settings')">Edit Profile</button></div></div>\r
  <div class="profile-banner">\r
    \${CU.avatarImage ? \`<div class="av av-xl"><img src="\${CU.avatarImage}" alt="\${CU.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">\${CU.avatar || CU.name[0]}</span></div>\` : \`<div class="av av-xl">\${CU.avatar || CU.name[0]}</div>\`}\r
    <div class="profile-info">\r
      <div class="profile-name">\${CU.name}</div>\r
      <div class="profile-role-tag">\${profile.title}</div>\r
      <div class="small mt-4">\${CU.service || EMPLOYEE_TYPE_LABELS[type]}</div>\r
      <span class="badge badge-green mt-8">Active employee account</span>\r
    </div>\r
  </div>\r
  <div class="grid-3 mb-20">\r
    \${metrics.map(([label, value, color]) => \`<div class="card"><div class="label">\${label}</div><div class="stat-value" style="color:\${color};margin-top:10px">\${value}</div></div>\`).join('')}\r
  </div>\r
  <div class="grid-2" style="align-items:start;gap:20px">\r
    <div class="card">\r
      <div class="h4 mb-14">Role & Responsibilities</div>\r
      <p style="font-size:13.5px;color:var(--text2);line-height:1.7;margin-bottom:16px">\${profile.purpose}</p>\r
      <div class="label mb-8">Core responsibilities</div>\r
      <div style="display:flex;flex-direction:column;gap:10px">\${profile.focus.map(item => \`<div style="display:flex;gap:9px;align-items:flex-start;color:var(--text2)"><span style="color:var(--green);font-weight:700">&#10003;</span><span>\${item}</span></div>\`).join('')}</div>\r
    </div>\r
    <div style="display:flex;flex-direction:column;gap:16px">\r
      <div class="card">\r
        <div class="h4 mb-14">Employee Details</div>\r
        <div class="info-row"><span class="info-label">Department</span><span class="info-value">\${EMPLOYEE_TYPE_LABELS[type]}</span></div>\r
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">\${CU.email}</span></div>\r
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">\${CU.phone || 'Not set'}</span></div>\r
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">\${CU.city || 'Not set'}</span></div>\r
        <div class="info-row"><span class="info-label">Member since</span><span class="info-value">\${CU.joined || 'Not set'}</span></div>\r
      </div>\r
      <div class="card">\r
        <div class="h4 mb-14">Work Tools</div>\r
        <div style="display:flex;flex-direction:column;gap:8px">\r
          <button class="btn btn-primary w-full" onclick="\${profile.primaryAction}">\${profile.primaryLabel}</button>\r
          <button class="btn btn-ghost w-full" onclick="\${profile.secondaryAction}">\${profile.secondaryLabel}</button>\r
          <button class="btn btn-ghost w-full" onclick="goNav('reports')">View Department Reports</button>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    function pageProfile() {\r
      if (isDepartmentEmployee()) return pageDepartmentEmployeeProfile();\r
      const assigns = CU.role === 'staff' ? DB.staffAssignments.filter(a => a.staffId === CU.id) : [];\r
      const regs = CU.role === 'attendee' ? DB.registrations.filter(r => r.attendeeId === CU.id) : [];\r
      const myEvs = CU.role === 'organizer' ? DB.events.filter(e => e.organizer === CU.id) : [];\r
      const isSF = CU.role === 'staff' && CU.employeeType === 'SUPPORT_FINANCE';\r
      const sfSupportHandled = (DB.supportRequests || []).length;\r
      const sfResolved = (DB.supportRequests || []).filter(r => r.status === 'Resolved' || r.status === 'Closed').length;\r
      const sfTxnsReviewed = (DB.financeTransactions || []).length;\r
      const sfReportsSubmitted = (DB.operationalReports || []).filter(r => r.status === 'Submitted' || r.status === 'Reviewed').length;\r
      return \`\r
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">My Profile</div></div><div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('settings')">✏️ Edit Profile</button></div></div>\r
  <div class="profile-banner">\r
    \${CU.avatarImage ? \`<div class="av av-xl"><img src="\${CU.avatarImage}" alt="\${CU.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">\${CU.avatar || CU.name[0]}</span></div>\` : \`<div class="av av-xl">\${CU.avatar || CU.name[0]}</div>\`}\r
    <div class="profile-info">\r
      <div class="profile-name">\${CU.name}</div>\r
      <div class="profile-role-tag">\${isSF ? 'Customer Support &amp; Finance Executive' : ROLE_LABELS[CU.role]}</div>\r
      \${CU.company ? \`<div class="small mt-4">\${CU.company}</div>\` : ''}\r
      \${CU.specialization ? \`<div class="small mt-4">Specialization: \${CU.specialization}</div>\` : ''}\r
      \${CU.service ? \`<div class="small mt-4">Service: \${CU.service}</div>\` : ''}\r
      <span class="badge badge-green mt-8">Active Account</span>\r
    </div>\r
  </div>\r
  <div class="grid-2" style="align-items:start;gap:20px">\r
    <div class="card">\r
      <div class="h4 mb-14">Contact Information</div>\r
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">\${CU.email}</span></div>\r
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">\${CU.phone || 'Not set'}</span></div>\r
      <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">\${CU.joined || '—'}</span></div>\r
      <div class="info-row"><span class="info-label">Role</span><span class="info-value"><span class="badge badge-\${ROLE_COLORS[CU.role]}">\${isSF ? 'Customer Support &amp; Finance Executive' : CU.role}</span></span></div>\r
      \${CU.bio ? \`<div class="mt-14"><div class="label mb-8">Bio</div><p style="font-size:13.5px;color:var(--text2);line-height:1.7">\${CU.bio}</p></div>\` : ''}\r
    </div>\r
    <div>\r
      \${isSF ? \`<div class="card mb-16">\r
        <div class="h4 mb-14">Work Summary</div>\r
        <div class="info-row"><span class="info-label">Support Requests Handled</span><span class="info-value" style="color:var(--accent);font-weight:700">\${sfSupportHandled}</span></div>\r
        <div class="info-row"><span class="info-label">Issues Resolved</span><span class="info-value" style="color:var(--green);font-weight:700">\${sfResolved}</span></div>\r
        <div class="info-row"><span class="info-label">Transactions Reviewed</span><span class="info-value" style="color:var(--blue);font-weight:700">\${sfTxnsReviewed}</span></div>\r
        <div class="info-row"><span class="info-label">Reports Submitted</span><span class="info-value" style="color:var(--purple);font-weight:700">\${sfReportsSubmitted}</span></div>\r
      </div>\` : CU.role === 'staff' ? \`<div class="card mb-16">\r
        <div class="h4 mb-14">Assignment Summary</div>\r
        <div class="info-row"><span class="info-label">Total Assignments</span><span class="info-value">\${assigns.length}</span></div>\r
        <div class="info-row"><span class="info-label">Accepted</span><span class="info-value" style="color:var(--green)">\${assigns.filter(a => a.status === 'accepted').length}</span></div>\r
        <div class="info-row"><span class="info-label">Pending</span><span class="info-value" style="color:var(--yellow)">\${assigns.filter(a => a.status === 'pending').length}</span></div>\r
        <div class="info-row"><span class="info-label">Total Earned</span><span class="info-value" style="color:var(--green);font-weight:700">₹\${assigns.filter(a => a.status === 'accepted').reduce((s, a) => s + a.fee, 0).toLocaleString()}</span></div>\r
      </div>\`: CU.role === 'attendee' ? \`<div class="card mb-16">\r
        <div class="h4 mb-14">Activity Summary</div>\r
        <div class="info-row"><span class="info-label">Events Registered</span><span class="info-value">\${regs.length}</span></div>\r
        <div class="info-row"><span class="info-label">Upcoming Events</span><span class="info-value" style="color:var(--accent)">\${regs.filter(r => { const e = DB.events.find(ev => ev.id === r.eventId); return e && e.status === 'upcoming'; }).length}</span></div>\r
        <div class="info-row"><span class="info-label">Events Attended</span><span class="info-value" style="color:var(--green)">\${regs.filter(r => r.checkedIn).length}</span></div>\r
        <div class="info-row"><span class="info-label">Total Spent</span><span class="info-value" style="color:var(--green);font-weight:700">₹\${regs.reduce((s, r) => s + r.amount, 0)}</span></div>\r
      </div>\`: CU.role === 'organizer' ? \`<div class="card mb-16">\r
        <div class="h4 mb-14">Event Summary</div>\r
        <div class="info-row"><span class="info-label">Total Events</span><span class="info-value">\${myEvs.length}</span></div>\r
        <div class="info-row"><span class="info-label">Upcoming</span><span class="info-value" style="color:var(--accent)">\${myEvs.filter(e => e.status === 'upcoming').length}</span></div>\r
        <div class="info-row"><span class="info-label">Completed</span><span class="info-value" style="color:var(--green)">\${myEvs.filter(e => e.status === 'completed').length}</span></div>\r
      </div>\`: ''}\r
      <div class="card">\r
        <div class="h4 mb-14">Quick Actions</div>\r
        <div style="display:flex;flex-direction:column;gap:8px">\r
          <button class="btn btn-ghost w-full" onclick="goNav('settings')">⚙️ Account Settings</button>\r
          <button class="btn btn-danger w-full" onclick="doLogout()">🚪 Sign Out</button>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  SETTINGS\r
    // ════════════════════════════════════════════════\r
    function pageSettings() {\r
      return \`\r
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Account Settings</div><div class="page-sub">Manage your personal information and account preferences.</div></div></div>\r
  <div class="grid-2" style="align-items:start;gap:20px">\r
    <div class="card card-lg">\r
      <div class="h4 mb-20">Personal Information</div>\r
      <div class="profile-banner" style="margin-bottom:20px;padding:18px">\r
        \${CU.avatarImage ? \`<div class="av av-lg"><img src="\${CU.avatarImage}" alt="\${CU.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">\${CU.avatar || CU.name[0]}</span></div>\` : \`<div class="av av-lg">\${CU.avatar || CU.name[0]}</div>\`}\r
        <div><div style="font-weight:700">\${CU.name}</div><div class="small">\${ROLE_LABELS[CU.role]}</div></div>\r
      </div>\r
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="st-name" value="\${CU.name}"></div>\r
      <div class="form-group"><label class="form-label">Email Address</label><input class="form-control" id="st-email" value="\${CU.email}"></div>\r
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" id="st-phone" value="\${CU.phone || ''}"></div>\r
      <div class="form-group"><label class="form-label">Bio</label><textarea class="form-control" id="st-bio">\${CU.bio || ''}</textarea></div>\r
      <button class="btn btn-primary w-full" onclick="saveSettings()" style="justify-content:center">Save Changes</button>\r
    </div>\r
    <div style="display:flex;flex-direction:column;gap:20px">\r
      <div class="card card-lg">\r
        <div class="h4 mb-20">Change Password</div>\r
        <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" id="st-cur" type="password" placeholder="Enter current password"></div>\r
        <div class="form-group"><label class="form-label">New Password</label><input class="form-control" id="st-new" type="password" placeholder="Min 6 characters"></div>\r
        <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-control" id="st-conf" type="password" placeholder="Re-enter new password"></div>\r
        <button class="btn btn-primary w-full" onclick="changePass()" style="justify-content:center">Update Password</button>\r
      </div>\r
      <div class="card">\r
        <div class="h4 mb-16">Preferences</div>\r
        <div class="info-row"><span class="info-label">Email Notifications</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>\r
        <div class="info-row"><span class="info-label">SMS Reminders</span><div class="toggle" onclick="this.classList.toggle('on')"></div></div>\r
        <div class="info-row"><span class="info-label">Event Recommendations</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>\r
      </div>\r
      <div class="card">\r
        <button class="btn btn-danger w-full mb-8" onclick="doLogout()" style="justify-content:center">Sign Out</button>\r
      </div>\r
    </div>\r
  </div>\`;\r
    }\r
    function saveSettings() {\r
      const name = v('st-name'), email = v('st-email'), phone = v('st-phone'), bio = v('st-bio');\r
      if (!name) { toast('Name is required', 'error'); return; }\r
      if (!email || !email.includes('@')) { toast('Enter a valid email', 'error'); return; }\r
      CU.name = name; CU.email = email; CU.phone = phone; CU.bio = bio;\r
      CU.avatar = (name.split(' ').map(n => n[0]).join('').toUpperCase()).slice(0, 2);\r
      const u = DB.users.find(u => u.id === CU.id);\r
      if (u) { Object.assign(u, { name, email, phone, bio, avatar: CU.avatar }); }\r
      g('sb-name').textContent = name;\r
      updateHeaderUser();\r
      g('sb-av').textContent = CU.avatar;\r
      toast('Settings saved successfully!', 'success');\r
    }\r
    function changePass() {\r
      const cur = v('st-cur'), nw = v('st-new'), conf = v('st-conf');\r
      if (!cur || !nw || !conf) { toast('Fill all password fields', 'error'); return; }\r
      if (cur !== CU.password) { toast('Current password is incorrect', 'error'); return; }\r
      if (nw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }\r
      if (nw !== conf) { toast('Passwords do not match', 'error'); return; }\r
      CU.password = nw;\r
      const u = DB.users.find(u => u.id === CU.id);\r
      if (u) u.password = nw;\r
      ['st-cur', 'st-new', 'st-conf'].forEach(id => { const el = g(id); if (el) el.value = ''; });\r
      toast('Password changed successfully!', 'success');\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  CLIENT PAGES\r
    // ════════════════════════════════════════════════\r
    function pageFindOrganizers() {\r
      const q = (sessionStorage.getItem('search_org_q') || '').toLowerCase();\r
      const rating = sessionStorage.getItem('search_org_rating') || 'all';\r
      const category = sessionStorage.getItem('search_org_category') || 'all';\r
\r
      let organizers = DB.users.filter(u => u.role === 'organizer');\r
\r
      if (q) {\r
        organizers = organizers.filter(o => o.name.toLowerCase().includes(q) || o.service.toLowerCase().includes(q));\r
      }\r
      if (category !== 'all') {\r
        organizers = organizers.filter(o => o.service === category || o.eventTypes?.includes(category));\r
      }\r
      if (rating !== 'all') {\r
        const minRating = parseFloat(rating);\r
        organizers = organizers.filter(o => (o.rating || 4) >= minRating);\r
      }\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Find Event Organisers</div>\r
      <div class="page-sub">Discover and connect with top-rated event organizers across India</div>\r
    </div>\r
  </div>\r
  \r
  <div class="filter-row">\r
    <div class="search-box input-group" style="flex:1;max-width:400px">\r
      <span class="input-icon">🔍</span>\r
      <input class="form-control" id="search-org-q" placeholder="Search by organizer name or specialization..." value="\${q}" oninput="searchOrganizers(this.value)">\r
    </div>\r
    <select class="form-control filter-select" id="search-org-rating" onchange="filterOrganizers()">\r
      <option value="all">All Ratings</option>\r
      <option value="4.5">4.5+ stars</option>\r
      <option value="4">4+ stars</option>\r
      <option value="3.5">3.5+ stars</option>\r
    </select>\r
    <select class="form-control filter-select" id="search-org-category" onchange="filterOrganizers()">\r
      <option value="all">All Categories</option>\r
      <option>Corporate Events</option>\r
      <option>Conferences</option>\r
      <option>Weddings & Social Events</option>\r
      <option>Workshops</option>\r
      <option>Product Launches</option>\r
    </select>\r
  </div>\r
  \r
  <div style="margin-bottom:16px;color:var(--text2);font-size:13px">Showing \${organizers.length} event organiser\${organizers.length !== 1 ? 's' : ''}</div>\r
  \r
  <div class="grid-3" style="gap:16px">\r
    \${organizers.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No organizers found</div><p>Try adjusting your search filters</p></div>\` : organizers.map(o => {\r
        const rt = o.rating || 4.2;\r
        const rv = o.reviews || (Math.floor(rt * 38) + 12);\r
        const ev = o.eventsCount || (Math.floor(rt * 65) + 20);\r
        const orgAv = o.avatarImage ? \`\r
          <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid \${o.color || 'var(--accent)'}40;position:relative">\r
            <img src="\${o.avatarImage}" alt="\${o.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:\${o.color || 'var(--accent)'}20;font-size:20px;font-weight:700;color:\${o.color || 'var(--accent)'}">\${o.avatar || o.name[0]}</div>\r
          </div>\r
        \` : \`<div style="width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:\${o.color || 'var(--accent)'}15;font-size:20px;font-weight:700;color:\${o.color || 'var(--accent)'};border:2px solid \${o.color || 'var(--accent)'}30">\${o.avatar || o.name[0]}</div>\`;\r
        return \`\r
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:12px;transition:transform .18s,box-shadow .18s;cursor:pointer" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='';this.style.boxShadow=''" onclick="viewOrganizerProfile('\${o.id}')">\r
        <div style="display:flex;align-items:center;gap:12px">\r
          \${orgAv}\r
          <div style="flex:1;min-width:0">\r
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">\r
              <span style="font-weight:700;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${o.name}</span>\r
              <span style="background:var(--yellow);color:#1a1400;padding:1px 7px;border-radius:10px;font-size:10.5px;font-weight:700;flex-shrink:0">⭐ \${rt.toFixed(1)}</span>\r
            </div>\r
            <div style="font-size:12px;color:var(--accent);font-weight:500;margin-bottom:2px">\${o.service || 'Event Organizer'}</div>\r
            <div style="font-size:11.5px;color:var(--text3)">📍 \${o.city || 'India'}</div>\r
          </div>\r
        </div>\r
        <p style="font-size:12px;color:var(--text2);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">\${o.bio || 'Professional event organizer with extensive industry experience.'}</p>\r
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">\r
          <span style="background:var(--surface3);padding:3px 10px;border-radius:6px;font-size:11px;color:var(--text2)"><strong style="color:var(--text)">\${ev}</strong> events</span>\r
          <span style="background:var(--surface3);padding:3px 10px;border-radius:6px;font-size:11px;color:var(--text2)"><strong style="color:var(--text)">\${rv}</strong> reviews</span>\r
          <span style="background:var(--green)14;padding:3px 10px;border-radius:6px;font-size:11px;color:var(--green);font-weight:600">96% satisfaction</span>\r
        </div>\r
        <button class="btn btn-primary btn-sm w-full" onclick="event.stopPropagation();viewOrganizerProfile('\${o.id}')" style="justify-content:center;padding:8px;font-size:12.5px">View Profile & Request Event</button>\r
      </div>\`;\r
      }).join('')}\r
  </div>\`;\r
    }\r
\r
    function searchOrganizers(q) {\r
      sessionStorage.setItem('search_org_q', q);\r
      renderPage('find-organizers');\r
    }\r
\r
    function filterOrganizers() {\r
      const rating = g('search-org-rating').value;\r
      const category = g('search-org-category').value;\r
      sessionStorage.setItem('search_org_rating', rating);\r
      sessionStorage.setItem('search_org_category', category);\r
      renderPage('find-organizers');\r
    }\r
\r
    function viewOrganizerProfile(organizerId) {\r
      const org = DB.users.find(u => String(u.id) === String(organizerId));\r
      if (!org) return;\r
\r
      const rating = org.rating || 4.2;\r
      const reviews = Math.floor(Math.random() * 200) + 50;\r
      const events = Math.floor(Math.random() * 300) + 50;\r
      const completedEvents = Math.floor(events * 0.9);\r
\r
      const orgModalAv = org.avatarImage ? \`\r
        <div style="width:80px;height:80px;border-radius:12px;overflow:hidden;flex-shrink:0;background:\${org.color || 'var(--accent)'}20;position:relative">\r
          <img src="\${org.avatarImage}" alt="\${org.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:60px;color:\${org.color || 'var(--accent)'}">\${org.avatar || org.name[0]}</div>\r
        </div>\r
      \` : \`<div style="font-size:60px;width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:\${org.color || 'var(--accent)'}20;border-radius:12px;flex-shrink:0">\${org.avatar || org.name[0]}</div>\`;\r
\r
      openModal(\`\${org.name} - Organizer Profile\`, \`\r
    <div style="background:linear-gradient(135deg,\${org.color || 'var(--accent)'}20,\${org.color || 'var(--accent)'}05);border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid \${org.color || 'var(--accent)'}30">\r
      <div style="display:flex;gap:16px;align-items:flex-start">\r
        \${orgModalAv}\r
        <div style="flex:1">\r
          <div style="font-weight:700;font-size:20px;margin-bottom:4px">\${org.name}</div>\r
          <div style="color:var(--accent);font-weight:500;margin-bottom:8px">\${org.service || 'Event Organizer'}</div>\r
          <div style="display:flex;gap:12px;margin-bottom:8px">\r
            <span style="background:var(--yellow);color:#1a1400;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">⭐ \${rating.toFixed(1)}</span>\r
            <span style="color:var(--text2);font-size:13px">\${reviews} reviews</span>\r
            <span style="color:var(--text2);font-size:13px">📍 \${org.city || 'India'}</span>\r
          </div>\r
          <div style="color:var(--text2);font-size:13px">\${org.bio || 'Professional event organizer'}</div>\r
        </div>\r
      </div>\r
    </div>\r
    \r
    <div style="margin-bottom:20px">\r
      <div class="h4 mb-12">Statistics</div>\r
      <div class="grid-3" style="gap:12px;margin-bottom:16px">\r
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">\r
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">COMPLETED EVENTS</div>\r
          <div style="font-size:24px;font-weight:800;color:var(--green)">\${completedEvents}</div>\r
        </div>\r
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">\r
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TOTAL REVIEWS</div>\r
          <div style="font-size:24px;font-weight:800;color:var(--blue)">\${reviews}</div>\r
        </div>\r
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">\r
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">SATISFACTION RATE</div>\r
          <div style="font-size:24px;font-weight:800;color:var(--green)">96%</div>\r
        </div>\r
      </div>\r
    </div>\r
    \r
    <div style="margin-bottom:20px">\r
      <div class="h4 mb-12">Contact Information</div>\r
      <div style="display:flex;flex-direction:column;gap:8px">\r
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">\r
          <span>✉️</span>\r
          <div>\r
            <div style="font-size:11px;color:var(--text3)">Email</div>\r
            <div style="font-weight:500">\${org.email}</div>\r
          </div>\r
        </div>\r
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">\r
          <span>📞</span>\r
          <div>\r
            <div style="font-size:11px;color:var(--text3)">Phone</div>\r
            <div style="font-weight:500">\${org.phone || '+91 9876543210'}</div>\r
          </div>\r
        </div>\r
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border-radius:8px">\r
          <span>🌐</span>\r
          <div>\r
            <div style="font-size:11px;color:var(--text3)">Location</div>\r
            <div style="font-weight:500">\${org.city || 'India'}</div>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
  \`, [\r
        { lbl: 'Request Event', cls: 'btn-primary', fn: \`closeModal();openRequestModal('\${organizerId}')\` }\r
      ], true);\r
    }\r
\r
    function contactOrganizer(organizerId) {\r
      const org = DB.users.find(u => u.id === organizerId);\r
      if (!org) return;\r
      toast(\`Opening contact form for \${org.name}...\`, 'info');\r
    }\r
\r
    function openRequestModal(organizerId) {\r
      const org = DB.users.find(u => String(u.id) === String(organizerId));\r
      openModal(\`Request Event - \${org.name}\`, \`\r
    <div class="form-group"><label class="form-label">Event Title *</label><input class="form-control" id="req-title" placeholder="e.g., Product Launch 2026"></div>\r
    <div class="form-group"><label class="form-label">Event Type *</label><select class="form-control" id="req-type"><option>Corporate Events</option><option>Conferences</option><option>Weddings</option><option>Workshops</option></select></div>\r
    <div class="form-group"><label class="form-label">Expected Date *</label><input class="form-control" id="req-date" type="date"></div>\r
    <div class="form-group"><label class="form-label">Expected Guests</label><input class="form-control" id="req-guests" type="number" placeholder="100"></div>\r
    <div class="form-group"><label class="form-label">Budget (INR) *</label><input class="form-control" id="req-budget" type="number" placeholder="50000"></div>\r
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="req-desc" placeholder="Tell the organizer about your event..."></textarea></div>\r
  \`, [{ lbl: 'Send Request', cls: 'btn-primary', fn: \`submitEventRequest('\${organizerId}')\` }]);\r
    }\r
\r
    function submitEventRequest(organizerId) {\r
      const title = v('req-title'), type = v('req-type'), date = v('req-date'), guests = v('req-guests') || 0, budget = parseInt(v('req-budget')) || 0, desc = v('req-desc');\r
      if (!title || !date || budget < 1000) { toast('Please fill required fields', 'error'); return; }\r
      DB.eventRequests.push({ id: DB._nextId.reqs++, clientId: CU.id, organizer: organizerId, title, type, date, guests, budget, desc, status: 'pending', created: today() });\r
      saveDB();\r
      closeModal();\r
      renderPage(_currentPage);\r
      toast('Request sent to organizer!', 'success');\r
    }\r
\r
    function pageFindStaff() {\r
      const staffList = DB.users.filter(u => u.role === 'staff');\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Find Staff</div>\r
      <div class="page-sub">Browse and hire experienced event staff members</div>\r
    </div>\r
  </div>\r
  \r
  <div class="filter-row">\r
    <div class="search-box input-group" style="flex:1;max-width:400px">\r
      <span class="input-icon">🔍</span>\r
      <input class="form-control" id="search-staff-q" placeholder="Search staff by name or expertise..." value="\${sessionStorage.getItem('search_staff_q') || ''}" oninput="searchStaff(this.value)">\r
    </div>\r
    <select class="form-control filter-select" id="search-staff-rating" onchange="filterStaff()">\r
      <option value="all">All Ratings</option>\r
      <option value="4.5">4.5+ stars</option>\r
      <option value="4">4+ stars</option>\r
      <option value="3.5">3.5+ stars</option>\r
    </select>\r
    <select class="form-control filter-select" id="search-staff-service" onchange="filterStaff()">\r
      <option value="all">All Services</option>\r
      <option>Event Manager</option>\r
      <option>Security</option>\r
      <option>Catering</option>\r
      <option>Sound Engineer</option>\r
      <option>Photography</option>\r
    </select>\r
  </div>\r
  \r
  <div style="margin-bottom:16px;color:var(--text2);font-size:13px">Showing \${staffList.length} staff member\${staffList.length !== 1 ? 's' : ''}</div>\r
  \r
  <div class="grid-3" style="gap:20px">\r
    \${staffList.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No staff found</div></div>\` : staffList.map(s => {\r
        const rating = s.rating || 4.0;\r
        const reviews = Math.floor(Math.random() * 150) + 20;\r
        const completedJobs = Math.floor(Math.random() * 200) + 30;\r
        const staffAvatarContent = s.avatarImage ? \`\r
          <img src="\${s.avatarImage}" alt="\${s.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
          <div style="display:none;font-size:80px;font-weight:700;color:\${s.color || 'var(--green)'}">\${s.avatar || s.name[0]}</div>\r
        \` : \`<div style="font-size:80px;font-weight:700;color:\${s.color || 'var(--green)'}">\${s.avatar || s.name[0]}</div>\`;\r
        return \`\r
      <div class="card" style="overflow:hidden;display:flex;flex-direction:column;position:relative">\r
        <div style="aspect-ratio:1;background:linear-gradient(135deg,\${s.color || 'var(--green)'}30,\${s.color || 'var(--green)'}10);display:flex;align-items:center;justify-content:center;margin-bottom:16px;border-radius:12px;position:relative;overflow:hidden">\r
          \${staffAvatarContent}\r
          <div style="position:absolute;top:12px;right:12px;background:var(--yellow);color:#1a1400;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;z-index:2">⭐ \${rating.toFixed(1)}</div>\r
        </div>\r
        <div style="flex:1;display:flex;flex-direction:column">\r
          <div style="font-weight:700;font-size:16px;margin-bottom:4px">\${s.name}</div>\r
          <div style="font-size:13px;color:var(--green);margin-bottom:8px;font-weight:500">\${s.service || 'Event Staff'}</div>\r
          <div style="font-size:12px;color:var(--text2);margin-bottom:8px">📞 \${s.phone || 'Contact available'}</div>\r
          <p style="font-size:12.5px;color:var(--text2);line-height:1.5;margin-bottom:12px;flex:1">\${s.bio || 'Professional event staff with proven experience'}</p>\r
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text3);margin-bottom:16px;padding:10px;background:var(--surface3);border-radius:8px">\r
            <div><strong style="color:var(--text)">\${completedJobs}</strong><div>Completed Jobs</div></div>\r
            <div><strong style="color:var(--text)">\${reviews}</strong><div>Reviews</div></div>\r
          </div>\r
          <div style="display:flex;gap:8px">\r
            <button class="btn btn-primary w-full" onclick="viewStaffProfile('\${s.id}')" style="flex:1">View Profile</button>\r
            <button class="btn btn-ghost btn-sm" onclick="assignStaffToEvent('\${s.id}')" style="padding:9px 12px">🤝</button>\r
          </div>\r
        </div>\r
      </div>\`;\r
      }).join('')}\r
  </div>\`;\r
    }\r
\r
    function searchStaff(q) {\r
      sessionStorage.setItem('search_staff_q', q);\r
      renderPage('find-staff');\r
    }\r
\r
    function filterStaff() {\r
      const rating = g('search-staff-rating')?.value || 'all';\r
      const service = g('search-staff-service')?.value || 'all';\r
      sessionStorage.setItem('search_staff_rating', rating);\r
      sessionStorage.setItem('search_staff_service', service);\r
      renderPage('find-staff');\r
    }\r
\r
    function viewStaffProfile(staffId) {\r
      const s = DB.users.find(u => String(u.id) === String(staffId));\r
      if (!s) return;\r
\r
      const rating = s.rating || 4.0;\r
      const reviews = s.reviews || (Math.floor(staffId * 37) % 130 + 25);\r
      const completedJobs = DB.staffAssignments.filter(a => a.staffId === staffId && a.status === 'accepted').length || (Math.floor(staffId * 53) % 170 + 30);\r
      const avail = getAvailability(staffId);\r
\r
      // Build availability calendar\r
      const _now = new Date();\r
      const _month = _now.getMonth(), _year = _now.getFullYear();\r
      const calMonthStr = _now.toLocaleString('en-US', { month: 'long', year: 'numeric' });\r
      const _firstDay = new Date(_year, _month, 1).getDay();\r
      const _daysInMonth = new Date(_year, _month + 1, 0).getDate();\r
      const _todayStr = _year + '-' + String(_month + 1).padStart(2, '0') + '-' + String(_now.getDate()).padStart(2, '0');\r
      const _asgn = DB.staffAssignments.filter(a => a.staffId === staffId && a.status === 'accepted').map(a => { const ev = DB.events.find(e => e.id === a.eventId); return ev ? ev.date : ''; }).filter(d => d);\r
      const _hd = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => '<div style="font-size:10px;font-weight:600;color:var(--text3);padding:3px 0;text-align:center">' + d + '</div>').join('');\r
      const _em = Array(_firstDay).fill('<div></div>').join('');\r
      const _db = Array.from({ length: _daysInMonth }, (_, i) => {\r
        const d = i + 1;\r
        const fd = _year + '-' + String(_month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');\r
        const isA = avail.includes(fd), isAsgn = _asgn.includes(fd), isTdy = fd === _todayStr;\r
        let bg = 'transparent', col = 'var(--text2)', bdr = '1px solid transparent', fw = '400';\r
        if (isAsgn) { bg = 'var(--accent)'; col = '#fff'; bdr = 'none'; fw = '700'; }\r
        else if (isA) { bg = 'rgba(34,197,94,0.18)'; col = 'var(--green)'; bdr = '1px solid var(--green)'; fw = '600'; }\r
        else if (isTdy) { bdr = '1px solid var(--text2)'; }\r
        return '<div style="padding:5px 2px;border-radius:6px;border:' + bdr + ';background:' + bg + ';color:' + col + ';font-weight:' + fw + ';font-size:12px;text-align:center">' + d + '</div>';\r
      }).join('');\r
      const calGrid = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:10px">' + _hd + _em + _db + '</div>';\r
      const calLegend = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px"><div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><div style="width:10px;height:10px;border-radius:3px;background:rgba(34,197,94,0.18);border:1px solid var(--green)"></div>Available</div><div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><div style="width:10px;height:10px;border-radius:3px;background:var(--accent)"></div>Assigned</div><div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><div style="width:10px;height:10px;border-radius:3px;border:1px solid var(--text2)"></div>Today</div></div>';\r
      const noAvail = '<div style="text-align:center;padding:12px;color:var(--text3);font-size:13px;background:var(--surface3);border-radius:8px">No availability dates set yet</div>';\r
      const calHTML = avail.length > 0 || _asgn.length > 0 ? calGrid + calLegend : noAvail;\r
\r
      const assCards = DB.staffAssignments.filter(a => a.staffId === staffId).slice(0, 4).map(a => {\r
        const ev = DB.events.find(e => e.id === a.eventId) || { title: 'Event', date: '', venue: '' };\r
        const sc = a.status === 'accepted' ? 'green' : a.status === 'pending' ? 'yellow' : 'red';\r
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface3);border-radius:8px;border:1px solid var(--border);margin-bottom:8px"><div><div style="font-weight:600;font-size:13px;margin-bottom:2px">' + ev.title + '</div><div style="font-size:11px;color:var(--text3)">' + a.role + ' \\u00b7 ' + ev.date + ' \\u00b7 ' + (ev.venue || ev.city || '') + '</div></div><span class="badge badge-' + sc + '">' + a.status + '</span></div>';\r
      }).join('');\r
\r
      const staffModalAv = s.avatarImage ? \`\r
        <div style="width:80px;height:80px;border-radius:12px;overflow:hidden;flex-shrink:0;background:\${s.color || 'var(--green)'}20;position:relative">\r
          <img src="\${s.avatarImage}" alt="\${s.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:60px;color:\${s.color || 'var(--green)'}">\${s.avatar || s.name[0]}</div>\r
        </div>\r
      \` : \`<div style="font-size:60px;width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:\${s.color || 'var(--green)'}20;border-radius:12px;flex-shrink:0">\${s.avatar || s.name[0]}</div>\`;\r
\r
      openModal(s.name, \`\r
    <div style="background:linear-gradient(135deg,\${s.color || 'var(--green)'}20,\${s.color || 'var(--green)'}05);border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid \${s.color || 'var(--green)'}30">\r
      <div style="display:flex;gap:16px;align-items:flex-start">\r
        \${staffModalAv}\r
        <div style="flex:1">\r
          <div style="font-weight:700;font-size:20px;margin-bottom:4px">\${s.name}</div>\r
          <div style="color:var(--green);font-weight:500;margin-bottom:8px">\${s.service || 'Event Staff'}</div>\r
          <div style="display:flex;gap:12px;margin-bottom:8px">\r
            <span style="background:var(--yellow);color:#1a1400;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">&#11088; \${rating.toFixed(1)}</span>\r
            <span style="color:var(--text2);font-size:13px">\${reviews} reviews</span>\r
          </div>\r
          <div style="color:var(--text2);font-size:13px">&#128241; \${s.phone || 'Contact available'}</div>\r
        </div>\r
      </div>\r
    </div>\r
\r
    <div style="margin-bottom:20px">\r
      <div class="h4 mb-12">Experience</div>\r
      <div class="grid-2" style="gap:12px;margin-bottom:16px">\r
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">\r
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">COMPLETED JOBS</div>\r
          <div style="font-size:24px;font-weight:800;color:var(--green)">\${completedJobs}</div>\r
        </div>\r
        <div style="background:var(--surface3);padding:12px;border-radius:8px;text-align:center">\r
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">AVERAGE RATING</div>\r
          <div style="font-size:24px;font-weight:800;color:var(--yellow)">\${rating.toFixed(1)}</div>\r
        </div>\r
      </div>\r
      \${s.bio ? \`<p style="font-size:13.5px;color:var(--text2);line-height:1.7">\${s.bio}</p>\` : ''}\r
    </div>\r
\r
    <div style="margin-bottom:20px;padding:16px;background:var(--surface2);border-left:4px solid var(--accent);border-radius:10px">\r
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">\r
        <span>&#128197; Availability &mdash; \${calMonthStr}</span>\r
        <span style="font-size:12px;font-weight:400;color:var(--text2)">\${avail.length} dates</span>\r
      </div>\r
      \${calHTML}\r
    </div>\r
\r
    \${DB.staffAssignments.filter(a => a.staffId === staffId).length > 0 ? \`\r
    <div style="margin-bottom:8px">\r
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">&#128203; Current Assignments</div>\r
      \${assCards}\r
    </div>\`: ''}\r
  \`, undefined, false);\r
\r
      setTimeout(() => {\r
        const modal = document.querySelector('.modal');\r
        if (modal) {\r
          const content = modal.querySelector('.modal-content');\r
          if (content) {\r
            const btnGroup = content.querySelector('.modal-buttons');\r
            if (!btnGroup) return;\r
            const sendBtn = document.createElement('button');\r
            sendBtn.className = 'btn btn-ghost';\r
            sendBtn.textContent = 'Send Request';\r
            sendBtn.onclick = () => sendStaffRequest(staffId);\r
            btnGroup.insertBefore(sendBtn, btnGroup.firstChild);\r
          }\r
        }\r
      }, 100);\r
    }\r
\r
    function assignStaffToEvent(staffId) {\r
      const s = DB.users.find(u => String(u.id) === String(staffId));\r
      const myEvs = DB.events.filter(e => String(e.organizer) === String(CU.id));\r
      if (!s) return;\r
      openModal(\`Assign \${s.name}\`, \`\r
    <div class="form-group">\r
      <label class="form-label">Select Event *</label>\r
      <select class="form-control" id="assign-event-id">\r
        <option value="">-- Choose an event --</option>\r
        \${myEvs.map(e => \`<option value="\${e.id}">\${e.title} (\${e.date})</option>\`).join('')}\r
      </select>\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Role *</label>\r
      <select class="form-control" id="assign-role"><option>Event Manager</option><option>Security</option><option>Catering</option><option>Sound Engineer</option><option>Photography</option></select>\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Fee (₹) *</label>\r
      <input class="form-control" id="assign-fee" type="number" placeholder="5000">\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Notes</label>\r
      <textarea class="form-control" id="assign-notes" placeholder="Special instructions or requirements..."></textarea>\r
    </div>\r
  \`, [{ lbl: 'Assign Staff', cls: 'btn-primary', fn: \`confirmStaffAssignment('\${staffId}')\` }]);\r
    }\r
\r
    function confirmStaffAssignment(staffId) {\r
      const rawEventId = v('assign-event-id');\r
      const eventId = isNaN(rawEventId) ? rawEventId : parseInt(rawEventId);\r
      const role = v('assign-role');\r
      const fee = parseInt(v('assign-fee')) || 0;\r
      const notes = v('assign-notes');\r
\r
      if (!eventId || !role || !fee) { toast('Please fill all required fields', 'error'); return; }\r
\r
      const newAsgn = {\r
        id: DB._nextId.assignments++,\r
        eventId,\r
        staffId: isNaN(staffId) ? staffId : parseInt(staffId),\r
        role,\r
        fee,\r
        status: 'pending',\r
        notes,\r
        assignedAt: new Date().toISOString()\r
      };\r
\r
      DB.staffAssignments.push(newAsgn);\r
\r
      // Sync with backend if possible\r
      if (typeof apiCreateStaffAssignment === 'function') {\r
        apiCreateStaffAssignment({\r
          eventId: String(newAsgn.eventId),\r
          staffId: String(newAsgn.staffId),\r
          organizerId: String(CU.id)\r
        }).catch(err => console.error('Backend sync failed:', err));\r
      }\r
\r
      saveDB();\r
      closeModal();\r
      toast(\`Assignment sent to \${DB.users.find(u => u.id === staffId)?.name}!\`, 'success');\r
    }\r
\r
    function sendStaffRequest(staffId) {\r
      const staff = DB.users.find(u => u.id === staffId);\r
      if (!staff) return;\r
\r
      openModal(\`Request \${staff.name}\`, \`\r
    <div class="form-group">\r
      <label class="form-label">Event Type *</label>\r
      <select class="form-control" id="req-type">\r
        <option value="">-- Select --</option>\r
        <option>Photography</option>\r
        <option>Catering</option>\r
        <option>Sound & AV</option>\r
        <option>Event Management</option>\r
        <option>Security</option>\r
        <option>Decoration</option>\r
      </select>\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Event Date *</label>\r
      <input class="form-control" id="req-date" type="date">\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Number of Hours *</label>\r
      <input class="form-control" id="req-hours" type="number" placeholder="e.g., 8" min="1">\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Proposed Fee (₹) *</label>\r
      <input class="form-control" id="req-fee" type="number" placeholder="5000">\r
    </div>\r
    <div class="form-group">\r
      <label class="form-label">Event Details</label>\r
      <textarea class="form-control" id="req-details" placeholder="Brief description of what you need..."></textarea>\r
    </div>\r
  \`, [{ lbl: 'Send Request', cls: 'btn-primary', fn: \`confirmSendStaffRequest('\${staffId}')\` }]);\r
    }\r
\r
    function confirmSendStaffRequest(staffId) {\r
      const type = v('req-type');\r
      const date = v('req-date');\r
      const hours = parseInt(v('req-hours'));\r
      const fee = parseInt(v('req-fee'));\r
      const details = v('req-details');\r
\r
      if (!type || !date || !hours || !fee) {\r
        toast('Please fill all required fields', 'error');\r
        return;\r
      }\r
\r
      const staff = DB.users.find(u => u.id === staffId);\r
      const organizer = DB.users.find(u => u.id === CU.id);\r
\r
      DB.staffRequests.push({\r
        id: DB._nextId.staffReqs++,\r
        staffId,\r
        organizerId: CU.id,\r
        type,\r
        date,\r
        hours,\r
        fee,\r
        details,\r
        status: 'pending',\r
        createdAt: new Date().toLocaleDateString('en-US'),\r
        acceptedAt: null\r
      });\r
\r
      DB.notifications.push({\r
        id: DB._nextId.notifs++,\r
        title: \`New Staff Request from \${organizer.name}\`,\r
        msg: \`\${organizer.name} sent a \${type} request for \${date}. Fee: ₹\${fee}\`,\r
        time: 'Now',\r
        read: false,\r
        type: 'info',\r
        icon: '📬',\r
        toUserId: staffId,\r
        fromUserId: CU.id\r
      });\r
\r
      saveDB();\r
      closeModal();\r
      toast(\`Request sent to \${staff.name}!\`, 'success');\r
    }\r
\r
    function getStaffRequests(staffId) {\r
      return DB.staffRequests.filter(r => r.staffId === staffId && r.status === 'pending');\r
    }\r
\r
    function getStaffRequestsSent(organizerId) {\r
      return DB.staffRequests.filter(r => r.organizerId === organizerId);\r
    }\r
\r
    function acceptStaffRequest(requestId) {\r
      const req = DB.staffRequests.find(r => String(r.id) === String(requestId));\r
      if (!req) return;\r
\r
      req.status = 'accepted';\r
      req.acceptedAt = new Date().toLocaleDateString('en-US');\r
\r
      const organizer = DB.users.find(u => String(u.id) === String(req.organizerId));\r
      DB.notifications.push({\r
        id: DB._nextId.notifs++,\r
        title: req.type + ' Request Accepted',\r
        msg: \`\${DB.users.find(u => String(u.id) === String(req.staffId))?.name} accepted your \${req.type} request for \${req.date}\`,\r
        time: 'Now',\r
        read: false,\r
        type: 'success',\r
        icon: '✅',\r
        toUserId: req.organizerId\r
      });\r
\r
      saveDB();\r
      renderPage(_currentPage);\r
      toast('Request accepted!', 'success');\r
    }\r
\r
    function rejectStaffRequest(requestId) {\r
      const req = DB.staffRequests.find(r => String(r.id) === String(requestId));\r
      if (!req) return;\r
\r
      req.status = 'rejected';\r
\r
      DB.notifications.push({\r
        id: DB._nextId.notifs++,\r
        title: req.type + ' Request Rejected',\r
        msg: \`\${DB.users.find(u => u.id === req.staffId)?.name} rejected your \${req.type} request for \${req.date}\`,\r
        time: 'Now',\r
        read: false,\r
        type: 'warning',\r
        icon: '❌',\r
        toUserId: req.organizerId\r
      });\r
\r
      saveDB();\r
      renderPage(_currentPage);\r
      toast('Request rejected', 'info');\r
    }\r
\r
    function pageUpcomingEvents() {\r
      const today = new Date();\r
      today.setHours(0, 0, 0, 0);\r
      const upcoming = DB.events.filter(e => {\r
        const eDate = new Date(e.date);\r
        return eDate >= today && e.status === 'upcoming';\r
      }).sort((a, b) => new Date(a.date) - new Date(b.date));\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Upcoming Events</div>\r
      <div class="page-sub">Events happening soon that you might be interested in</div>\r
    </div>\r
  </div>\r
  <div class="events-grid">\${upcoming.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No upcoming events</div></div>\` : upcoming.map(e => evCard(e, CU.role === 'client' ? 'client' : 'attendee')).join('')}</div>\`;\r
    }\r
\r
    function pageCompletedEvents() {\r
      const completed = DB.events.filter(e => e.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Completed Events</div>\r
      <div class="page-sub">Events that have been successfully completed</div>\r
    </div>\r
  </div>\r
  <div class="events-grid">\${completed.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✅</div><div class="empty-title">No completed events</div></div>\` : completed.map(e => {\r
        const bannerContent = e.image ? \`\r
          <img src="\${e.image}" alt="\${e.title || 'Event'}" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\r
          <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">\${e.emoji || '📅'}</div>\r
          <div class="ev-banner-overlay"></div>\r
        \` : \`<span style="font-size:52px">\${e.emoji || '📅'}</span>\`;\r
        return \`<div class="ev-card">\r
    <div class="ev-banner" style="background:\${e.color || 'var(--accent)'}18">\r
      \${bannerContent}\r
      <div class="ev-banner-tag"><span class="badge badge-green">✓ Completed</span></div>\r
      <div class="ev-banner-price">\${e.price === 0 ? 'Free' : '₹' + e.price}</div>\r
    </div>\r
    <div class="ev-body">\r
      <div class="ev-title">\${e.title}</div>\r
      <div class="ev-meta">\r
        <div class="ev-meta-row"><span>📅</span>\${e.date} · \${e.time}</div>\r
        <div class="ev-meta-row"><span>📍</span>\${e.venue}</div>\r
        <div class="ev-meta-row"><span>🏷️</span>\${e.category}</div>\r
      </div>\r
      <div style="margin-bottom:12px">\r
        <div class="flex justify-between ev-cap mb-4"><span>\${e.registered}/\${e.capacity} attended</span></div>\r
        <div style="font-size:12px;color:var(--green);margin-top:8px">✓ Event Successfully Completed</div>\r
      </div>\r
      <div class="ev-footer">\r
        <div class="flex gap-6" style="width:100%;justify-content:space-between">\r
          <button class="btn btn-ghost btn-xs w-full" onclick="openViewEventDrawer('\${e.id}')" title="View event details">👁️ View Details</button>\r
          <button class="btn btn-primary btn-xs" onclick="viewEventReport('\${e.id}')" title="View event report">📊 View Report</button>\r
        </div>\r
        <div class="tag-list" style="flex:1;justify-content:flex-end">\${(e.tags || []).slice(0, 2).map(t => \`<span class="tag">\${t}</span>\`).join('')}</div>\r
      </div>\r
    </div>\r
  </div>\`;\r
      }).join('')}</div>\`;\r
    }\r
\r
    function pageStaffRequests() {\r
      const requests = getStaffRequests(CU.id);\r
      const pending = requests.filter(r => r.status === 'pending');\r
      const accepted = DB.staffRequests.filter(r => r.staffId === CU.id && r.status === 'accepted');\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Staff Requests</div>\r
      <div class="page-sub">Event requests from organizers (\${pending.length} pending, \${accepted.length} accepted)</div>\r
    </div>\r
  </div>\r
  \r
  \${pending.length > 0 ? \`\r
  <div class="card mb-20" style="border-left:4px solid var(--yellow)">\r
    <div class="h4 mb-16">📬 Pending Requests (\${pending.length})</div>\r
    <div style="display:flex;flex-direction:column;gap:12px">\r
      \${pending.map(r => {\r
        const org = DB.users.find(u => u.id === r.organizerId);\r
        return \`\r
        <div style="padding:16px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">\r
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">\r
            <div>\r
              <div style="font-weight:700;font-size:15px">\${r.type} Request</div>\r
              <div class="small" style="color:var(--text2)">From: \${org?.name || 'Unknown'}</div>\r
            </div>\r
            <span class="badge badge-yellow">Pending</span>\r
          </div>\r
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;font-size:13px">\r
            <div><div class="small">📅 Date</div><div style="font-weight:600">\${new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div>\r
            <div><div class="small">⏱️ Hours</div><div style="font-weight:600">\${r.hours} hrs</div></div>\r
            <div><div class="small">💰 Fee</div><div style="font-weight:600;color:var(--green)">₹\${r.fee}</div></div>\r
          </div>\r
          \${r.details ? \`<div style="padding:10px;background:var(--surface3);border-radius:6px;border-left:2px solid var(--accent);margin-bottom:12px;font-size:13px;color:var(--text2)"><strong>Details:</strong> \${r.details}</div>\` : ''}\r
          <div style="display:flex;gap:8px">\r
            <button class="btn btn-success btn-sm" onclick="acceptStaffRequest('\${r.id}')">✓ Accept</button>\r
            <button class="btn btn-danger btn-sm" onclick="rejectStaffRequest('\${r.id}')">✕ Reject</button>\r
          </div>\r
        </div>\r
        \`;\r
      }).join('')}\r
    </div>\r
  </div>\r
  \`: ''}\r
  \r
  \${accepted.length > 0 ? \`\r
  <div class="card" style="border-left:4px solid var(--green)">\r
    <div class="h4 mb-16">✅ Accepted Requests (\${accepted.length})</div>\r
    <div style="display:flex;flex-direction:column;gap:12px">\r
      \${accepted.map(r => {\r
        const org = DB.users.find(u => u.id === r.organizerId);\r
        return \`\r
        <div style="padding:16px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);opacity:0.8">\r
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">\r
            <div>\r
              <div style="font-weight:700;font-size:15px">\${r.type} Request</div>\r
              <div class="small" style="color:var(--text2)">From: \${org?.name || 'Unknown'}</div>\r
            </div>\r
            <span class="badge badge-green">✓ Accepted</span>\r
          </div>\r
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;font-size:13px">\r
            <div><div class="small">📅 Date</div><div style="font-weight:600">\${new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div>\r
            <div><div class="small">⏱️ Hours</div><div style="font-weight:600">\${r.hours} hrs</div></div>\r
            <div><div class="small">💰 Fee</div><div style="font-weight:600;color:var(--green)">₹\${r.fee}</div></div>\r
          </div>\r
          <div style="font-size:12px;color:var(--text3)">Accepted on \${r.acceptedAt}</div>\r
        </div>\r
        \`;\r
      }).join('')}\r
    </div>\r
  </div>\r
  \`: ''}\r
  \r
  \${pending.length === 0 && accepted.length === 0 ? \`\r
  <div class="empty">\r
    <div class="empty-icon">📭</div>\r
    <div class="empty-title">No requests yet</div>\r
    <p class="empty-desc">When organizers send you requests, they will appear here.</p>\r
  </div>\r
  \`: ''}\r
  \`;\r
    }\r
\r
    function pageOngoingEvents() {\r
      const ongoing = DB.events.filter(e => e.status === 'ongoing');\r
\r
      return \`\r
  <div class="page-hd">\r
    <div class="page-hd-left">\r
      <div class="page-title">Ongoing Events</div>\r
      <div class="page-sub">Events currently happening right now</div>\r
    </div>\r
  </div>\r
  <div class="events-grid">\${ongoing.length === 0 ? \`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>\` : ongoing.map(e => evCard(e, CU.role === 'client' ? 'client' : 'attendee')).join('')}</div>\`;\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  MODAL SYSTEM\r
    // ════════════════════════════════════════════════\r
    function openModal(title, body, btns = [], showCancel = true) {\r
      g('modal-title').textContent = title;\r
      g('modal-body').innerHTML = body;\r
      const foot = g('modal-foot');\r
      foot.innerHTML = '';\r
      if (showCancel) { const c = document.createElement('button'); c.className = 'btn btn-ghost'; c.textContent = 'Cancel'; c.onclick = closeModal; foot.appendChild(c); }\r
      btns.forEach(b => { const btn = document.createElement('button'); btn.className = 'btn ' + b.cls; btn.textContent = b.lbl; btn.setAttribute('onclick', b.fn); foot.appendChild(btn); });\r
      if (!showCancel && !btns.length) foot.style.display = 'none'; else foot.style.display = '';\r
      const ov = g('modal-overlay');\r
      ov.classList.remove('hidden'); // ensure visible\r
      requestAnimationFrame(() => ov.classList.add('open'));\r
    }\r
    function closeModal() {\r
      const ov = g('modal-overlay');\r
      ov.classList.remove('open');\r
    }\r
    function closeModalOnBg(e) { if (e.target === g('modal-overlay')) closeModal(); }\r
\r
    // DRAWER\r
    function openDrawer(title, body) {\r
      g('drawer-title').textContent = title;\r
      g('drawer-body').innerHTML = body;\r
      g('drawer-overlay').classList.add('open');\r
      g('drawer').classList.add('open');\r
    }\r
    function closeDrawer() {\r
      g('drawer-overlay').classList.remove('open');\r
      g('drawer').classList.remove('open');\r
    }\r
\r
    // CONFIRM\r
    function confirm2(title, msg, cb) {\r
      g('confirm-title').textContent = title;\r
      g('confirm-msg').textContent = msg;\r
      _confirmCb = cb;\r
      const ov = g('confirm-overlay');\r
      ov.classList.remove('hidden');\r
      requestAnimationFrame(() => ov.classList.add('open'));\r
    }\r
    function closeConfirm() {\r
      g('confirm-overlay').classList.remove('open');\r
      _confirmCb = null;\r
    }\r
    function closeConfirmOnBg(e) { if (e.target === g('confirm-overlay')) closeConfirm(); }\r
    function runConfirm() { if (_confirmCb) _confirmCb(); closeConfirm(); }\r
\r
    // TOAST\r
    function toast(msg, type = 'info') {\r
      const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };\r
      const el = document.createElement('div');\r
      el.className = \`toast \${type}\`;\r
      el.innerHTML = \`<span class="toast-icon">\${icons[type]}</span><span class="toast-msg">\${msg}</span>\`;\r
      g('toasts').appendChild(el);\r
      setTimeout(() => { el.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3500);\r
    }\r
\r
    // ════════════════════════════════════════════════\r
    //  HELPERS\r
    // ════════════════════════════════════════════════\r
    function g(id) { return document.getElementById(id) }\r
    function v(id) { const el = g(id); return el ? el.value.trim() : '' }\r
    function today() { return new Date().toISOString().split('T')[0] }\r
    function showErr(id) { const el = g(id); if (el) el.classList.add('show') }\r
    function hideErr(id) { const el = g(id); if (el) el.classList.remove('show') }\r
    function evStatBadge(s) { return { upcoming: 'purple', full: 'red', completed: 'green' }[s] || 'gray' }\r
    function reqBadge(s) { return { pending: 'yellow', approved: 'green', rejected: 'red', in_review: 'purple' }[s] || 'gray' }\r
\r
    // ════════════════════════════════════════════════\r
    //  BOOTSTRAP\r
    // ════════════════════════════════════════════════\r
    // CAROUSEL FUNCTIONS\r
    // ════════════════════════════════════════════════\r
    function scrollCarousel(direction) {\r
      const carousel = g('event-carousel');\r
      if (!carousel) return;\r
      const scrollAmount = 300;\r
      if (direction === 'left') {\r
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });\r
      } else {\r
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });\r
      }\r
    }\r
\r
    // Auto-enable carousel scrolling with keyboard arrows (optional)\r
    document.addEventListener('keydown', (e) => {\r
      if (e.key === 'ArrowLeft' && g('event-carousel')) scrollCarousel('left');\r
      if (e.key === 'ArrowRight' && g('event-carousel')) scrollCarousel('right');\r
    });\r
\r
    // ════════════════════════════════════════════════\r
    //  CROSS-TAB DATA SYNCHRONIZATION\r
    // ════════════════════════════════════════════════\r
    // The 'storage' event fires ONLY in tabs that did NOT make the change.\r
    // We debounce re-renders to avoid blinking when multiple tabs are active.\r
    let _syncDebounceTimer = null;\r
    window.addEventListener('storage', function (e) {\r
      if (e.key !== 'ffsd_db' || !e.newValue) return;\r
\r
      // Skip if the data content hasn't meaningfully changed (same length = same data)\r
      if (e.newValue === e.oldValue) return;\r
\r
      // Clear any pending re-render and schedule a new one after a short delay.\r
      // This collapses rapid consecutive saves (e.g. from the other tab's own renders)\r
      // into a single update, eliminating the visible flicker.\r
      clearTimeout(_syncDebounceTimer);\r
      _syncDebounceTimer = setTimeout(function () {\r
        try {\r
          loadDB(false);\r
          if (CU && _currentPage) {\r
            renderPage(_currentPage);\r
            updateNotifDot();\r
          }\r
        } catch (err) {\r
          console.warn('[Sync] Failed to reload from storage event:', err);\r
        }\r
      }, 600); // 600ms debounce — imperceptible delay, eliminates flicker\r
    });\r
\r
\r
    // Local changes already update the page directly. Other browser tabs are\r
    // handled by the storage event above, so a polling-based full re-render is\r
    // unnecessary and caused the visible dashboard flicker after login.\r
\r
    // ════════════════════════════════════════════════\r
    function getRoleWorkspace(user) {\r
      if (!user) return null;\r
      const role = (user.role || '').toLowerCase();\r
      const empType = String(user.employeeType || '').toUpperCase();\r
\r
      if ((role === 'staff' || role === 'employee') && empType) {\r
        const employeePages = {\r
          REGISTRATION_VERIFICATION: { key: 'employee1' },\r
          EVENT_OPERATIONS: { key: 'employee2' },\r
          SUPPORT_FINANCE: { key: 'employee3' },\r
        };\r
        if (employeePages[empType]) return employeePages[empType];\r
      }\r
\r
      const rolePages = {\r
        superuser: { key: 'super-admin' },\r
        super_admin: { key: 'super-admin' },\r
        organizer: { key: 'organizer' },\r
        event_organizer: { key: 'organizer' },\r
        client: { key: 'client' },\r
        staff: { key: 'staff' },\r
        event_staff: { key: 'staff' },\r
        attendee: { key: 'attendee' },\r
        employee1: { key: 'employee1' },\r
        employee2: { key: 'employee2' },\r
        employee3: { key: 'employee3' },\r
      };\r
      return rolePages[role] || null;\r
    }\r
\r
    function routeToRoleWorkspace(user) {\r
      const workspace = getRoleWorkspace(user);\r
      if (!workspace || window.EventFlowRole?.key === workspace.key) return false;\r
      window.location.replace((workspace.key === 'super-admin' ? '/admin' : '/' + workspace.key));\r
      return true;\r
    }\r
\r
    document.addEventListener('DOMContentLoaded', function boot() {\r
      // Restore the session synchronously. Waiting on a health request caused a\r
      // visible landing-page-to-dashboard swap and unnecessarily logged out\r
      // users whenever the optional backend was offline.\r
      loadDB(false);\r
      try {\r
        const saved = sessionStorage.getItem('ef_cu');\r
        if (saved) {\r
          CU = JSON.parse(saved);\r
          const workspace = getRoleWorkspace(CU);\r
          if (workspace && routeToRoleWorkspace(CU)) return;\r
          if (!workspace && window.EventFlowRole?.key !== 'landing') {\r
            window.location.replace('/landing');\r
            return;\r
          }\r
          initApp();\r
          showPage('app');\r
          document.documentElement.classList.remove('restoring-session');\r
          return;\r
        }\r
      } catch (e) {\r
        try { sessionStorage.removeItem('ef_cu'); } catch (ignore) { }\r
      }\r
      if (window.EventFlowRole?.key !== 'landing') {\r
        window.location.replace('/landing');\r
        return;\r
      }\r
      document.documentElement.classList.remove('restoring-session');\r
      showPage('landing');\r
    });\r
\r
\r
/* ===== EventFlow source: validation.js ===== */\r
// Global Validation Script for Specified Input Fields\r
    document.addEventListener('DOMContentLoaded', () => {\r
      function getErrorSpan(input) {\r
        let next = input.nextElementSibling;\r
        if (next && next.classList.contains('form-error')) return next;\r
        let span = document.createElement('span');\r
        span.className = 'form-error';\r
        input.parentNode.insertBefore(span, input.nextSibling);\r
        return span;\r
      }\r
\r
      function validateInput(target) {\r
        if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') return true;\r
        if (target.type === 'file' || target.type === 'checkbox' || target.type === 'radio') return true;\r
        if (target.disabled || target.readOnly) return true;\r
\r
        const fg = target.closest('.form-group');\r
        const labelText = fg ? (fg.querySelector('.form-label') ? fg.querySelector('.form-label').textContent.toLowerCase() : '') : '';\r
        const id = (target.id || '').toLowerCase();\r
        const type = (target.type || '').toLowerCase();\r
\r
        // To support contact forms that use div labels\r
        let previousElement = target.previousElementSibling;\r
        let prevLabel = previousElement && previousElement.textContent ? previousElement.textContent.toLowerCase() : '';\r
\r
        let fieldType = null;\r
        if (/^(full name|name|first name|last name|city|city\\s*\\/\\s*location)$/i.test(labelText.replace(/\\*/g, '').trim()) || /^(rg-name|newusername|edit-usr-name|contact-name|name)$/.test(id)) fieldType = 'name';\r
        else if (labelText.includes('email') || type === 'email' || id.includes('email') || prevLabel.includes('email')) fieldType = 'email';\r
        else if (labelText.includes('phone') || type === 'tel' || id.includes('phone') || prevLabel.includes('phone')) fieldType = 'phone';\r
        else if (labelText.includes('date') || type === 'date' || id.includes('date')) fieldType = 'date';\r
\r
        if (!fieldType) return true;\r
\r
        let val = target.value.trim();\r
        let isValid = true;\r
        let errorMsg = '';\r
\r
        if (val === '') {\r
          if (labelText.includes('*') || target.hasAttribute('required')) {\r
            isValid = false;\r
            errorMsg = 'This field is required';\r
          } else {\r
            target.classList.remove('is-error');\r
            target.classList.remove('is-valid');\r
            const span = getErrorSpan(target);\r
            if (span) { span.classList.remove('show'); span.textContent = ''; }\r
            return true;\r
          }\r
        } else {\r
          if (fieldType === 'name') {\r
            if (!/^[\\p{L}\\p{M} .,'’()-]+$/u.test(val)) {\r
              isValid = false;\r
              errorMsg = 'Use letters and normal name or city characters only';\r
            }\r
          } else if (fieldType === 'email') {\r
            if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val)) {\r
              isValid = false;\r
              errorMsg = 'Enter a valid email format';\r
            }\r
          } else if (fieldType === 'phone') {\r
            if (!/^\\d{10}$/.test(val)) {\r
              isValid = false;\r
              errorMsg = 'Enter a mobile number with exactly 10 digits';\r
            }\r
          } else if (fieldType === 'date') {\r
            const selected = new Date(val);\r
            const todayDate = new Date();\r
            todayDate.setHours(0, 0, 0, 0);\r
            if (id !== 'rg-date-of-birth' && selected < todayDate || id === 'rg-date-of-birth' && (Number.isNaN(selected.getTime()) || selected > todayDate)) {\r
              isValid = false;\r
              errorMsg = id === 'rg-date-of-birth' ? 'Date of birth cannot be in the future' : 'Only future dates are allowed';\r
            }\r
          }\r
        }\r
\r
        const span = getErrorSpan(target);\r
        if (isValid) {\r
          target.classList.remove('is-error');\r
          target.classList.add('is-valid');\r
          span.classList.remove('show');\r
          span.textContent = '';\r
          return true;\r
        } else {\r
          target.classList.remove('is-valid');\r
          target.classList.add('is-error');\r
          span.classList.add('show');\r
          span.textContent = errorMsg;\r
          return false;\r
        }\r
      }\r
\r
      document.addEventListener('input', (e) => {\r
        if (e.target.tagName === 'INPUT') validateInput(e.target);\r
      });\r
      document.addEventListener('change', (e) => {\r
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') validateInput(e.target);\r
      });\r
      document.addEventListener('focusout', (e) => {\r
        if (e.target.tagName === 'INPUT') validateInput(e.target);\r
      });\r
\r
      document.addEventListener('focusin', (e) => {\r
        const target = e.target;\r
        if (target.tagName === 'INPUT') {\r
          const fg = target.closest('.form-group');\r
          const labelText = fg ? (fg.querySelector('.form-label') ? fg.querySelector('.form-label').textContent.toLowerCase() : '') : '';\r
          const id = (target.id || '').toLowerCase();\r
          let isDateField = (target.type === 'date' || labelText.includes('date') || id.includes('date'));\r
\r
          if (isDateField) {\r
            const todayStr = new Date().toISOString().split('T')[0];\r
            if (target.type !== 'date') target.type = 'date';\r
            if (id !== 'rg-date-of-birth' && target.min !== todayStr) target.min = todayStr;\r
          }\r
        }\r
      });\r
\r
      document.addEventListener('click', (e) => {\r
        const btn = e.target.closest('button');\r
        if (!btn) return;\r
\r
        if (btn.classList.contains('btn-primary') || btn.classList.contains('btn-success') || btn.id === 'login-btn') {\r
          const onclickCode = btn.getAttribute('onclick') || '';\r
          if (onclickCode.includes('open') || onclickCode.includes('goNav') || onclickCode.includes('showPage') || onclickCode.includes('doLogin') || onclickCode.includes('gotoLogin') || onclickCode.includes('fillLogin') || onclickCode.includes('selectEmployee') || onclickCode.includes('doLogout')) return;\r
\r
          // Scope validation exclusively to modals or explicit form containers\r
          const formScope = btn.closest('.modal-box, form');\r
          if (!formScope) return;\r
\r
          // Only validate inputs that are currently visible\r
          const inputs = formScope.querySelectorAll('input, select, textarea');\r
          let hasError = false;\r
          inputs.forEach(input => {\r
            if (input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0) {\r
              const isValid = validateInput(input);\r
              if (!isValid) hasError = true;\r
            }\r
          });\r
\r
          if (hasError) {\r
            e.stopImmediatePropagation();\r
            e.stopPropagation();\r
            e.preventDefault();\r
            if (typeof toast === 'function') toast('Please fix the errors before submitting', 'error');\r
          }\r
        }\r
      }, true);\r
    });\r
\r
\r
\r
/* ===== Role-owned frontend configuration ===== */\r
window.EventFlowRole = {\r
  key: 'super-admin',\r
  label: 'Super Admin'\r
};\r
`;function o(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{id:"landing",children:[e.jsxs("nav",{className:"l-nav",children:[e.jsx("span",{className:"l-nav-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"l-nav-links",children:[e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('find-events');",n),children:"Find Events"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('gallery');",n),children:"Gallery"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About Us"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact"})]}),e.jsx("div",{className:"l-nav-actions",children:e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("gotoLogin('attendee')",n),children:"Sign In"})})]}),e.jsxs("section",{className:"hero",children:[e.jsxs("div",{className:"hero-bg",children:[e.jsx("div",{className:"orb1"}),e.jsx("div",{className:"orb2"}),e.jsx("div",{className:"grid-lines"})]}),e.jsxs("div",{className:"hero-content",children:[e.jsx("div",{className:"hero-pill",children:" Event Registration & Attendee Management Platform"}),e.jsxs("h1",{className:"hero-h1",children:["The Smartest Way to",e.jsx("br",{}),e.jsx("span",{className:"grad",children:"Manage Events"})]}),e.jsx("p",{className:"hero-p",children:"EventFlow unifies event planning, attendee registration, staff coordination, and real-time on-site verification in one centralized platform."}),e.jsx("div",{className:"hero-btns",children:e.jsx("button",{className:"btn btn-primary btn-lg",onClick:n=>t("showPage('find-events')",n),children:"🎟️ Explore Events"})}),e.jsxs("div",{className:"hero-stats",children:[e.jsxs("div",{className:"hero-stat",children:[e.jsx("div",{className:"hero-stat-val",style:{color:"var(--accent)"},children:"2,400+"}),e.jsx("div",{className:"hero-stat-lbl",children:"Events Managed"})]}),e.jsxs("div",{className:"hero-stat",children:[e.jsx("div",{className:"hero-stat-val",style:{color:"var(--green)"},children:"98K+"}),e.jsx("div",{className:"hero-stat-lbl",children:"Attendees Registered"})]}),e.jsxs("div",{className:"hero-stat",children:[e.jsx("div",{className:"hero-stat-val",style:{color:"var(--yellow)"},children:"500+"}),e.jsx("div",{className:"hero-stat-lbl",children:"Organizers Onboard"})]}),e.jsxs("div",{className:"hero-stat",children:[e.jsx("div",{className:"hero-stat-val",style:{color:"var(--blue)"},children:"99.8%"}),e.jsx("div",{className:"hero-stat-lbl",children:"Platform Uptime"})]})]})]})]}),e.jsxs("section",{className:"l-section l-section-alt",id:"features",children:[e.jsx("div",{className:"l-eyebrow",children:"Platform Features"}),e.jsx("h2",{className:"l-heading",children:"Everything You Need"}),e.jsx("p",{className:"l-desc",children:"A complete toolkit designed for every role in the event ecosystem."}),e.jsxs("div",{className:"features-grid",children:[e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--accent-dim)",color:"var(--accent)"},children:"📋"}),e.jsx("div",{className:"feat-title",children:"Smart Registration"}),e.jsx("p",{className:"feat-desc",children:"Streamlined attendee registration with instant QR ticket generation, automated email confirmations, and real-time capacity tracking."})]}),e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--green-dim)",color:"var(--green)"},children:"👥"}),e.jsx("div",{className:"feat-title",children:"Staff Coordination"}),e.jsx("p",{className:"feat-desc",children:"Assign staff with availability tracking, role management, and budget controls. Staff can accept or decline assignments in real time."})]}),e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--blue-dim)",color:"var(--blue)"},children:"✅"}),e.jsx("div",{className:"feat-title",children:"Live Verification"}),e.jsx("p",{className:"feat-desc",children:"On-site QR code scanning for fast and accurate attendee check-in. Eliminate queues and manual entry errors completely."})]}),e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--yellow-dim)",color:"var(--yellow)"},children:"💳"}),e.jsx("div",{className:"feat-title",children:"Secure Payments"}),e.jsx("p",{className:"feat-desc",children:"Integrated payment processing for paid events with instant receipt generation, refund workflows, and revenue reporting."})]}),e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--orange-dim)",color:"var(--orange)"},children:"📊"}),e.jsx("div",{className:"feat-title",children:"Analytics & Reports"}),e.jsx("p",{className:"feat-desc",children:"Live dashboards with registration rates, revenue breakdowns, attendance heat maps, and post-event performance summaries."})]}),e.jsxs("div",{className:"feat-card",children:[e.jsx("div",{className:"feat-icon",style:{background:"var(--red-dim)",color:"var(--red)"},children:"🔔"}),e.jsx("div",{className:"feat-title",children:"Smart Notifications"}),e.jsx("p",{className:"feat-desc",children:"Automated reminders, status updates, and confirmations keep clients, attendees, and staff informed throughout the event lifecycle."})]})]})]}),e.jsxs("section",{className:"l-section",id:"roles",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"l-eyebrow",children:"Role-Based Access Control"}),e.jsx("h2",{className:"l-heading",children:"Built for Every Stakeholder"}),e.jsx("p",{className:"l-desc",style:{margin:"0 auto"},children:"Each actor gets a tailored interface with precisely the permissions they need."})]}),e.jsxs("div",{className:"roles-grid",children:[e.jsxs("div",{className:"role-card",onClick:n=>t("gotoLogin('superuser')",n),children:[e.jsx("div",{className:"role-card-emoji",children:"🛡️"}),e.jsx("div",{className:"role-card-title",children:"Super Admin"}),e.jsx("p",{className:"role-card-desc",children:"Full CRUD access across all modules. Manage users, roles, events, and system settings."}),e.jsx("span",{className:"badge badge-red",children:"Full Control"})]}),e.jsxs("div",{className:"role-card",onClick:n=>t("gotoLogin('organizer')",n),children:[e.jsx("div",{className:"role-card-emoji",children:"🎯"}),e.jsx("div",{className:"role-card-title",children:"Event Organizer"}),e.jsx("p",{className:"role-card-desc",children:"Plan events, manage staff assignments, coordinate with clients, and generate event reports."}),e.jsx("span",{className:"badge badge-purple",children:"Operational"})]}),e.jsxs("div",{className:"role-card",onClick:n=>t("gotoLogin('client')",n),children:[e.jsx("div",{className:"role-card-emoji",children:"💼"}),e.jsx("div",{className:"role-card-title",children:"Client"}),e.jsx("p",{className:"role-card-desc",children:"Submit event requests, review proposals, approve plans, and receive post-event reports."}),e.jsx("span",{className:"badge badge-yellow",children:"Requestor"})]}),e.jsxs("div",{className:"role-card",onClick:n=>t("gotoLogin('attendee')",n),children:[e.jsx("div",{className:"role-card-emoji",children:"🎟️"}),e.jsx("div",{className:"role-card-title",children:"Attendee"}),e.jsx("p",{className:"role-card-desc",children:"Browse events, register, make payments, receive digital tickets, and verify attendance on-site."}),e.jsx("span",{className:"badge badge-green",children:"End User"})]})]})]}),e.jsxs("section",{className:"l-section l-section-alt",id:"how",children:[e.jsx("div",{className:"l-eyebrow",children:"How It Works"}),e.jsx("h2",{className:"l-heading",children:"Simple. Fast. Reliable."}),e.jsxs("div",{className:"grid-3",style:{marginTop:"48px",gap:"28px"},children:[e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:"64px",height:"64px",background:"var(--accent-dim)",border:"1px solid rgba(124,111,247,.3)",borderRadius:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 18px"},children:"📋"}),e.jsx("div",{className:"h4 mb-8",children:"1. Request or Create"}),e.jsx("p",{className:"muted",children:"Clients submit event requests. Organizers create and plan events with full detail."})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:"64px",height:"64px",background:"var(--green-dim)",border:"1px solid rgba(34,211,165,.3)",borderRadius:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 18px"},children:"🎟️"}),e.jsx("div",{className:"h4 mb-8",children:"2. Register & Pay"}),e.jsx("p",{className:"muted",children:"Attendees browse, register, and pay securely. Instant ticket generation with unique QR codes."})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:"64px",height:"64px",background:"var(--blue-dim)",border:"1px solid rgba(66,153,225,.3)",borderRadius:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",margin:"0 auto 18px"},children:"✅"}),e.jsx("div",{className:"h4 mb-8",children:"3. Attend & Verify"}),e.jsx("p",{className:"muted",children:"On-site QR scanning for instant check-in. Real-time attendance tracking and reporting."})]})]})]}),e.jsxs("section",{className:"l-section",style:{textAlign:"center",paddingTop:"80px",paddingBottom:"80px"},children:[e.jsx("h2",{className:"l-heading",children:"Ready to Transform Your Events?"}),e.jsx("p",{className:"l-desc",style:{margin:"0 auto 32px"},children:"Join thousands of organizers and attendees already using EventFlow."}),e.jsxs("div",{style:{display:"flex",gap:"14px",justifyContent:"center"},children:[e.jsx("button",{className:"btn btn-primary btn-lg",onClick:n=>t("gotoLogin('organizer')",n),children:"Start Organizing →"}),e.jsx("button",{className:"btn btn-ghost btn-lg",onClick:n=>t("gotoLogin('attendee')",n),children:"Browse Events"})]})]}),e.jsxs("footer",{className:"l-footer",children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontFamily:"var(--font-head)",fontWeight:"700",display:"block",marginBottom:"12px"},children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"small",style:{color:"var(--text2)",lineHeight:"1.6",marginBottom:"8px"},children:[e.jsx("div",{children:"📧 support@eventflow.com"}),e.jsx("div",{children:"📞 +1 (555) 123-4567"}),e.jsx("div",{children:"📍 123 Event Boulevard, Chennai, CA 94105"})]})]}),e.jsx("span",{className:"small",children:"© 2026 EventFlow Inc. — Event Registration & Attendee Management Platform"}),e.jsxs("div",{style:{display:"flex",gap:"16px"},children:[e.jsx("a",{className:"small",href:"#",style:{color:"var(--text3)"},onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact Us"}),e.jsx("a",{className:"small",href:"#",style:{color:"var(--text3)"},onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About"}),e.jsx("a",{className:"small",href:"#",style:{color:"var(--text3)"},children:"Privacy"}),e.jsx("a",{className:"small",href:"#",style:{color:"var(--text3)"},children:"Terms"})]})]})]}),e.jsx("div",{id:"login",children:e.jsxs("div",{className:"login-card",children:[e.jsx("div",{className:"login-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsx("p",{className:"login-sub",id:"login-subtitle",children:"Sign in to your dashboard"}),e.jsx("div",{className:"login-hint",id:"login-hint",children:"📝 Demo credentials available below"}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Email Address"}),e.jsxs("div",{className:"input-group",children:[e.jsx("span",{className:"input-icon",children:"✉️"}),e.jsx("input",{className:"form-control",id:"l-email",placeholder:"you@example.com",type:"email"})]}),e.jsx("span",{className:"form-error",id:"l-email-err",children:"Enter a valid email address"})]}),e.jsxs("div",{className:"form-group",style:{marginBottom:"20px"},children:[e.jsx("label",{className:"form-label",children:"Password"}),e.jsxs("div",{className:"input-group",children:[e.jsx("span",{className:"input-icon",children:"🔒"}),e.jsx("input",{className:"form-control",id:"l-pass",onKeyDown:n=>t("if(event.key==='Enter')doLogin()",n),placeholder:"••••••••",type:"password"})]}),e.jsx("span",{className:"form-error",id:"l-pass-err",children:"Password must be at least 4 characters"})]}),e.jsx("button",{className:"btn btn-primary btn-lg w-full",onClick:n=>t("doLogin()",n),children:"Sign In →"}),e.jsx("div",{className:"divider",children:"Demo Credentials (Click to Auto-Fill)"}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"10px",padding:"14px",marginBottom:"16px",fontSize:"12.5px",display:"flex",flexDirection:"column",gap:"8px",maxHeight:"210px",overflowY:"auto"},children:[e.jsxs("div",{onClick:n=>t("fillLogin('staff@example.com', 'Staff@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-green",style:{marginRight:"4px"},children:"Staff"})," ",e.jsx("strong",{children:"James Wilson:"}),"staff@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Staff@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('arjun.events@eventflow.com', 'Employee@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-purple",style:{marginRight:"4px"},children:"Employee"})," ",e.jsx("strong",{children:"User Executive:"})," arjun.events@eventflow.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Employee@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('employee@example.com', 'Employee@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-purple",style:{marginRight:"4px"},children:"Employee"})," ",e.jsx("strong",{children:"Event Executive:"})," employee@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Employee@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('marcus.ops@eventflow.com', 'Employee@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-purple",style:{marginRight:"4px"},children:"Employee"})," ",e.jsx("strong",{children:"Support & Finance:"})," marcus.ops@eventflow.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Employee@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('organizer@example.com', 'Organizer@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-purple",style:{marginRight:"4px"},children:"Organizer"})," ",e.jsx("strong",{children:"Sarah Chen:"}),"organizer@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Organizer@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('client@example.com', 'Client@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-yellow",style:{marginRight:"4px"},children:"Client"})," ",e.jsx("strong",{children:"Michael Torres:"}),"client@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Client@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('attendee@example.com', 'Attendee@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-blue",style:{marginRight:"4px"},children:"Attendee"})," ",e.jsx("strong",{children:"Priya Patel:"}),"attendee@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Attendee@123"})]}),e.jsxs("div",{onClick:n=>t("fillLogin('superadmin@example.com', 'Admin@123')",n),style:{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",borderRadius:"6px",background:"var(--surface)"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"badge badge-red",style:{marginRight:"4px"},children:"Super Admin"})," ",e.jsx("strong",{children:"Alex Johnson:"})," superadmin@example.com"]}),e.jsx("span",{style:{color:"var(--accent)",fontFamily:"monospace",fontSize:"11px"},children:"Admin@123"})]})]}),e.jsxs("p",{style:{textAlign:"center",fontSize:"13px",color:"var(--text2)"},children:["Don't have an account? ",e.jsx("a",{href:"#",onClick:n=>t("openRegisterModal()",n),style:{color:"var(--accent)"},children:"Create one"})]}),e.jsx("p",{style:{textAlign:"center",fontSize:"13px",color:"var(--text2)",marginTop:"12px"},children:e.jsx("a",{href:"#",style:{color:"var(--text2)"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Back to Home"})})]})}),e.jsxs("div",{id:"find-events",style:{background:"var(--bg)",minHeight:"100vh",padding:"80px 20px 20px",display:"none"},children:[e.jsxs("nav",{className:"l-nav",style:{zIndex:"300"},children:[e.jsx("span",{className:"l-nav-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"l-nav-links",children:[e.jsx("a",{href:"#",style:{color:"var(--accent)"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Home"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('find-events');",n),children:"Find Events"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('gallery');",n),children:"Gallery"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About Us"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact"})]}),e.jsx("div",{className:"l-nav-actions",children:e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("gotoLogin('attendee')",n),children:"Sign In"})})]}),e.jsxs("div",{style:{maxWidth:"1200px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"40px"},children:[e.jsx("a",{href:"#",style:{color:"var(--text2)",fontSize:"13px"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Back to Home"}),e.jsx("h1",{className:"h1",style:{marginTop:"12px"},children:"Explore Events"}),e.jsx("p",{className:"muted",children:"Discover upcoming events and register for ones that interest you."})]}),e.jsxs("style",{children:[".fe-grid ","{","display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 22px;","}",".fe-card ","{","background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: transform .2s, box-shadow .2s; cursor: pointer; display: flex; flex-direction: column;","}",".fe-card:hover ","{","transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);","}",".fe-card-img ","{","position: relative; height: 160px; overflow: hidden; background: var(--surface2); flex-shrink: 0;","}",".fe-card-img img ","{","width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s;","}",".fe-card:hover .fe-card-img img ","{","transform: scale(1.06);","}",".fe-card-img-fallback ","{","width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 52px;","}",".fe-card-img-overlay ","{","position: absolute; inset: 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 55%);","}",".fe-card-price ","{","position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); color: #fff; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 20px;","}",".fe-card-body ","{","padding: 16px; flex: 1; display: flex; flex-direction: column;","}",".fe-card-title ","{","font-weight: 700; font-size: 15px; margin-bottom: 4px; line-height: 1.3;","}",".fe-card-meta ","{","font-size: 12px; color: var(--text2); margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap;","}",".fe-card-desc ","{","font-size: 12.5px; color: var(--text2); line-height: 1.55; flex: 1; margin-bottom: 12px;","}",".fe-card-actions ","{","display: flex; gap: 8px; margin-top: auto;","}"]}),e.jsxs("div",{className:"fe-grid",children:[e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Tech Innovation Summit 2026",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-tech-summit.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"💻"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"₹150"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Tech Innovation Summit 2026"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-04-15"}),e.jsx("span",{children:"📍 Bangalore"})]}),e.jsx("p",{className:"fe-card-desc",children:"Annual technology conference featuring keynotes from industry leaders and live demos."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(1)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]}),e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Corporate Annual Gala 2026",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-annual-gala.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"🥂"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"₹250"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Corporate Annual Gala 2026"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-04-22"}),e.jsx("span",{children:"📍 Delhi"})]}),e.jsx("p",{className:"fe-card-desc",children:"Exclusive annual corporate dinner and awards ceremony for top performers."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(2)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]}),e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Spring Music Festival",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-music-fest.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"🎵"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"₹75"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Spring Music Festival"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-05-01"}),e.jsx("span",{children:"📍 Pune"})]}),e.jsx("p",{className:"fe-card-desc",children:"Outdoor music festival featuring 15+ artists across multiple genres."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(3)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]}),e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Digital Marketing Workshop",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-marketing-workshop.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"📱"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"₹80"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Digital Marketing Workshop"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-05-10"}),e.jsx("span",{children:"📍 Hyderabad"})]}),e.jsx("p",{className:"fe-card-desc",children:"Hands-on full-day workshop on modern digital marketing strategies and tools."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(4)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]}),e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Startup Pitch Night",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-pitch-night.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"🚀"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"FREE"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Startup Pitch Night"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-05-15"}),e.jsx("span",{children:"📍 Chennai"})]}),e.jsx("p",{className:"fe-card-desc",children:"Monthly startup pitch competition with VC judges and networking opportunities."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(5)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]}),e.jsxs("div",{className:"fe-card",children:[e.jsxs("div",{className:"fe-card-img",children:[e.jsx("img",{alt:"Photography Masterclass",onError:n=>t("this.style.display='none';this.nextElementSibling.style.display='flex'",n),src:"/images/events/event-photography.jpg"}),e.jsx("div",{className:"fe-card-img-fallback",style:{display:"none"},children:"📷"}),e.jsx("div",{className:"fe-card-img-overlay"}),e.jsx("span",{className:"fe-card-price",children:"₹120"})]}),e.jsxs("div",{className:"fe-card-body",children:[e.jsx("div",{className:"fe-card-title",children:"Photography Masterclass"}),e.jsxs("div",{className:"fe-card-meta",children:[e.jsx("span",{children:"📅 2026-06-01"}),e.jsx("span",{children:"📍 Pune"}),e.jsx("span",{className:"badge badge-green",style:{fontSize:"10px"},children:"12/30 spots"})]}),e.jsx("p",{className:"fe-card-desc",children:"Hands-on photography workshop for intermediate photographers with pro mentors."}),e.jsxs("div",{className:"fe-card-actions",children:[e.jsx("button",{className:"btn btn-ghost btn-xs w-full",onClick:n=>t("viewPublicEventDetails(7)",n),children:"👁️ Details"}),e.jsx("button",{className:"btn btn-primary btn-xs w-full",onClick:n=>t("gotoLogin('attendee')",n),children:"Register"})]})]})]})]})]})]}),e.jsxs("div",{id:"gallery",style:{background:"var(--bg)",minHeight:"100vh",padding:"60px 20px",display:"none"},children:[e.jsxs("nav",{className:"l-nav",style:{zIndex:"300"},children:[e.jsx("span",{className:"l-nav-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"l-nav-links",children:[e.jsx("a",{href:"#",style:{color:"var(--accent)"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Home"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('find-events');",n),children:"Find Events"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('gallery');",n),children:"Gallery"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About Us"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact"})]}),e.jsx("div",{className:"l-nav-actions",children:e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("gotoLogin('attendee')",n),children:"Sign In"})})]}),e.jsxs("div",{className:"l-container",style:{maxWidth:"1200px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"40px"},children:[e.jsx("a",{href:"#",style:{color:"var(--text2)",fontSize:"13px"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Back to Home"}),e.jsx("h1",{className:"h1",style:{marginTop:"12px"},children:"Event Gallery"}),e.jsx("p",{className:"muted",children:"Showcase of our successful events and happy attendees."})]}),e.jsxs("style",{children:[".gallery-grid ","{","columns: 3; column-gap: 16px;","}","@media(max-width:900px) ","{",".gallery-grid ","{","columns: 2;","}","}","@media(max-width:560px) ","{",".gallery-grid ","{","columns: 1;","}","}",".gallery-item ","{","break-inside: avoid; margin-bottom: 16px; border-radius: 14px; overflow: hidden; position: relative; cursor: pointer; display: block;","}",".gallery-item img ","{","width: 100%; display: block; transition: transform .35s;","}",".gallery-item:hover img ","{","transform: scale(1.05);","}",".gallery-item-overlay ","{","position: absolute; inset: 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 50%); opacity: 0; transition: opacity .3s; display: flex; align-items: flex-end; padding: 14px;","}",".gallery-item:hover .gallery-item-overlay ","{","opacity: 1;","}",".gallery-item-label ","{","color: #fff; font-weight: 600; font-size: 13px; line-height: 1.3;","}"]}),e.jsxs("div",{className:"gallery-grid",children:[e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Tech Innovation Summit",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-tech-summit.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Tech Innovation Summit 2026"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Spring Music Festival",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-music-fest.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Spring Music Festival"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Corporate Annual Gala",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-annual-gala.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Corporate Annual Gala 2026"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Hackathon",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-hackathon.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"DevSprint Hackathon"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Photography Masterclass",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-photography.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Photography Masterclass"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"FinTech Summit",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-fintech.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"FinTech Innovation Summit"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Startup Pitch Night",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-pitch-night.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Startup Pitch Night"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Digital Marketing Workshop",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-marketing-workshop.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Digital Marketing Workshop"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"AI Summit",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-ai-summit.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"AI & Machine Learning Summit"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Wedding Gala",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-wedding.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Grand Wedding Celebration"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Healthcare Forum",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-healthcare-forum.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Healthcare Innovation Forum"})})]}),e.jsxs("div",{className:"gallery-item",children:[e.jsx("img",{alt:"Cybersecurity Conference",onError:n=>t("this.parentElement.style.background='var(--surface2)';this.style.display='none'",n),src:"/images/events/event-cybersecurity.jpg"}),e.jsx("div",{className:"gallery-item-overlay",children:e.jsx("div",{className:"gallery-item-label",children:"Cybersecurity Conference"})})]})]})]})]}),e.jsxs("div",{id:"about",style:{background:"var(--bg)",minHeight:"100vh",padding:"60px 20px",display:"none"},children:[e.jsxs("nav",{className:"l-nav",style:{zIndex:"300"},children:[e.jsx("span",{className:"l-nav-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"l-nav-links",children:[e.jsx("a",{href:"#",style:{color:"var(--accent)"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Home"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('find-events');",n),children:"Find Events"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('gallery');",n),children:"Gallery"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About Us"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact"})]}),e.jsx("div",{className:"l-nav-actions",children:e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("gotoLogin('attendee')",n),children:"Sign In"})})]}),e.jsxs("div",{className:"l-container",style:{maxWidth:"800px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"40px"},children:[e.jsx("a",{href:"#",style:{color:"var(--text2)",fontSize:"13px"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Back to Home"}),e.jsx("h1",{className:"h1",style:{marginTop:"12px"},children:"About EventFlow"})]}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px",lineHeight:"1.8",color:"var(--text2)"},children:[e.jsx("p",{style:{marginBottom:"16px"},children:"EventFlow is a comprehensive event management and attendee registration platform designed to simplify every aspect of event planning and execution."}),e.jsxs("p",{style:{marginBottom:"16px"},children:[e.jsx("strong",{style:{color:"var(--text)"},children:"Our Mission:"})," To empower event organizers, clients, and attendees with intelligent tools that make event management seamless, secure, and delightful."]}),e.jsx("p",{style:{marginBottom:"16px"},children:e.jsx("strong",{style:{color:"var(--text)"},children:"What We Offer:"})}),e.jsxs("ul",{style:{marginLeft:"20px",marginBottom:"16px"},children:[e.jsx("li",{style:{marginBottom:"8px"},children:"✨ Smart registration with instant QR ticket generation"}),e.jsx("li",{style:{marginBottom:"8px"},children:"🎯 Staff coordination and assignment management"}),e.jsx("li",{style:{marginBottom:"8px"},children:"✅ Live verification and on-site check-in"}),e.jsx("li",{style:{marginBottom:"8px"},children:"💰 Secure payment processing"}),e.jsx("li",{style:{marginBottom:"8px"},children:"📊 Real-time analytics and reporting"})]}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:"var(--text)"},children:"Founded in 2026"}),", EventFlow has grown to manage 2,400+ events with 98,000+ attendees and 500+ organizers worldwide."]})]})]})]}),e.jsxs("div",{id:"contact",style:{background:"var(--bg)",minHeight:"100vh",padding:"60px 20px",display:"none"},children:[e.jsxs("nav",{className:"l-nav",style:{zIndex:"300"},children:[e.jsx("span",{className:"l-nav-logo",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})}),e.jsxs("div",{className:"l-nav-links",children:[e.jsx("a",{href:"#",style:{color:"var(--accent)"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Home"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('find-events');",n),children:"Find Events"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('gallery');",n),children:"Gallery"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('about');",n),children:"About Us"}),e.jsx("a",{href:"#",onClick:n=>t("event.preventDefault();showPage('contact');",n),children:"Contact"})]}),e.jsx("div",{className:"l-nav-actions",children:e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("gotoLogin('attendee')",n),children:"Sign In"})})]}),e.jsxs("div",{className:"l-container",style:{maxWidth:"800px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"40px"},children:[e.jsx("a",{href:"#",style:{color:"var(--text2)",fontSize:"13px"},onClick:n=>t("event.preventDefault();showPage('landing');",n),children:"← Back to Home"}),e.jsx("h1",{className:"h1",style:{marginTop:"12px"},children:"Contact Us"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"40px"},children:[e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px"},children:[e.jsx("div",{style:{fontSize:"28px",marginBottom:"12px"},children:"📧"}),e.jsx("div",{style:{fontWeight:"700",marginBottom:"4px"},children:"Email"}),e.jsx("p",{style:{color:"var(--text2)",fontSize:"13px"},children:"support@eventflow.com"})]}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px"},children:[e.jsx("div",{style:{fontSize:"28px",marginBottom:"12px"},children:"📞"}),e.jsx("div",{style:{fontWeight:"700",marginBottom:"4px"},children:"Phone"}),e.jsx("p",{style:{color:"var(--text2)",fontSize:"13px"},children:"+1 (555) 123-4567"})]}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px"},children:[e.jsx("div",{style:{fontSize:"28px",marginBottom:"12px"},children:"📍"}),e.jsx("div",{style:{fontWeight:"700",marginBottom:"4px"},children:"Address"}),e.jsx("p",{style:{color:"var(--text2)",fontSize:"13px"},children:"123 Event Boulevard, Chennai, CA 94105"})]}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px"},children:[e.jsx("div",{style:{fontSize:"28px",marginBottom:"12px"},children:"🕐"}),e.jsx("div",{style:{fontWeight:"700",marginBottom:"4px"},children:"Hours"}),e.jsx("p",{style:{color:"var(--text2)",fontSize:"13px"},children:"Mon-Fri: 9AM - 6PM PT"})]})]}),e.jsxs("div",{style:{background:"var(--surface2)",borderRadius:"12px",padding:"24px"},children:[e.jsx("div",{style:{fontWeight:"700",marginBottom:"16px"},children:"Send us a message"}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Name"}),e.jsx("input",{className:"form-control",id:"contact-name",placeholder:"Your name"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Email"}),e.jsx("input",{className:"form-control",id:"contact-email",placeholder:"your@email.com",type:"email"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Message"}),e.jsx("textarea",{className:"form-control",id:"contact-message",placeholder:"Your message…",style:{minHeight:"100px"}})]}),e.jsx("button",{className:"btn btn-primary btn-lg w-full",onClick:n=>t("sendContactMessage()",n),children:"Send Message"})]})]})]}),e.jsx("div",{id:"app",children:e.jsxs("div",{className:"app-shell",children:[e.jsxs("aside",{className:"sidebar",children:[e.jsx("div",{className:"sb-logo",children:e.jsx("div",{className:"sb-logo-mark",children:e.jsx("span",{className:"brand-logo",children:e.jsx("span",{className:"brand-logo-art",children:e.jsx("img",{src:"/images/eventflow-logo.png",alt:"EventFlow",width:"2172",height:"724",decoding:"async"})})})})}),e.jsx("nav",{className:"sb-nav",id:"sb-nav"}),e.jsx("div",{className:"sb-bottom",children:e.jsxs("div",{className:"sb-user",onClick:n=>t("goNav('settings')",n),children:[e.jsx("div",{className:"av",id:"sb-av",children:"?"}),e.jsxs("div",{className:"sb-user-info",children:[e.jsx("div",{className:"sb-user-name",id:"sb-name",children:"User"}),e.jsx("div",{className:"sb-user-role",id:"sb-role-lbl",children:"Role"})]}),e.jsx("span",{style:{color:"var(--text3)",fontSize:"12px"},children:"⚙"})]})})]}),e.jsxs("div",{className:"main",children:[e.jsxs("div",{className:"topbar",children:[e.jsx("div",{className:"topbar-title",id:"topbar-title",children:"User"}),e.jsxs("div",{className:"topbar-right",children:[e.jsxs("button",{className:"notif-trigger",onClick:n=>t("goNav('notifications')",n),children:["🔔",e.jsx("span",{className:"notif-badge",id:"notif-count-dot"})]}),e.jsx("button",{className:"btn btn-ghost btn-sm",onClick:n=>t("doLogout()",n),children:"Sign Out"})]})]}),e.jsx("div",{className:"page",id:"page-content"})]})]})}),e.jsx("div",{className:"overlay",id:"modal-overlay",onClick:n=>t("closeModalOnBg(event)",n),children:e.jsxs("div",{className:"modal-box",id:"modal-box",children:[e.jsxs("div",{className:"modal-head",children:[e.jsx("span",{className:"modal-title",id:"modal-title"}),e.jsx("button",{className:"modal-close-btn",onClick:n=>t("closeModal()",n),children:"✕"})]}),e.jsx("div",{className:"modal-body",id:"modal-body"}),e.jsx("div",{className:"modal-foot",id:"modal-foot"})]})}),e.jsx("div",{className:"overlay",id:"confirm-overlay",onClick:n=>t("closeConfirmOnBg(event)",n),children:e.jsxs("div",{className:"modal-box",style:{maxWidth:"360px"},children:[e.jsxs("div",{className:"modal-head",children:[e.jsx("span",{className:"modal-title",id:"confirm-title",children:"Confirm Action"}),e.jsx("button",{className:"modal-close-btn",onClick:n=>t("closeConfirm()",n),children:"✕"})]}),e.jsx("div",{className:"modal-body",children:e.jsx("p",{id:"confirm-msg",style:{color:"var(--text2)",fontSize:"13.5px",lineHeight:"1.6"}})}),e.jsxs("div",{className:"modal-foot",children:[e.jsx("button",{className:"btn btn-ghost",onClick:n=>t("closeConfirm()",n),children:"Cancel"}),e.jsx("button",{className:"btn btn-danger",id:"confirm-ok",onClick:n=>t("runConfirm()",n),children:"Confirm"})]})]})}),e.jsx("div",{className:"drawer-overlay",id:"drawer-overlay",onClick:n=>t("closeDrawer()",n)}),e.jsxs("div",{className:"drawer",id:"drawer",children:[e.jsxs("div",{className:"drawer-head",children:[e.jsx("span",{className:"h4",id:"drawer-title",children:"Details"}),e.jsx("button",{className:"modal-close-btn",onClick:n=>t("closeDrawer()",n),children:"✕"})]}),e.jsx("div",{className:"drawer-body",id:"drawer-body"})]}),e.jsx("div",{id:"toasts"}),e.jsx(r,{source:s,role:"admin"})]})}export{o as default};
