"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORT_CONCERNS = void 0;
exports.canSubmitSupportCategory = canSubmitSupportCategory;
const constants_1 = require("../../common/constants");
exports.SUPPORT_CONCERNS = {
    'Account Related Problems': [
        'Unable to log in',
        'Change password not working',
        'Forgot password / password reset failed',
        'Username not changing',
        'Email address not updating',
        'Phone number not updating',
        'Account verification failed',
        'Profile details not saving',
        'Account locked or suspended',
        'Unable to access my account',
    ],
    'Payment Issues': [
        'Payment is not working',
        'Payment completed but showing failed',
        'Money deducted but ticket not generated',
        'Payment failed but amount deducted',
        'Refund not received',
        'Refund amount is incorrect',
        'Duplicate payment / charged twice',
        'Payment method not accepted',
        'Invoice or receipt not generated',
        'Unable to download payment receipt',
    ],
    'Ticket & Registration Issues': [
        'Ticket not received after registration',
        'Ticket cancellation not working',
        'Unable to register for an event',
        'QR code not generated',
        'QR code not scanning',
        'Ticket details are incorrect',
        'Unable to download ticket',
        'Registration confirmation not received',
        'Ticket showing invalid',
        'Unable to transfer ticket',
    ],
    'Event Related Issues': [
        'Event details are incorrect',
        'Event date or time changed',
        'Event location is incorrect',
        'Event cancelled but no notification received',
        'Unable to find a registered event',
        'Event not appearing in my dashboard',
        'Unable to contact event organizer',
        'Event access or entry issue',
    ],
    'Account Deletion & Privacy': [
        'Request permanent account deletion',
        'Account deletion not working',
        'Cancel an account deletion request',
        'Request a copy of my personal data',
        'Request correction of personal data',
        'Privacy or data security concern',
        'Remove saved personal information',
    ],
    'Notifications & Communication': [
        'Not receiving email notifications',
        'Not receiving SMS notifications',
        'Event reminder not received',
        'Payment confirmation not received',
        'Receiving duplicate notifications',
        'Unable to change notification preferences',
        'Important updates not showing',
    ],
    'Website & Technical Problems': [
        'Website not loading',
        'Page showing an error',
        'Button not working',
        'Dashboard not displaying correctly',
        'Unable to upload a file',
        'Application running slowly',
        'Session keeps expiring',
        'Mobile layout not working',
        'Other technical issue',
    ],
    'Organizer & Client Support': [
        'Unable to create an event',
        'Unable to edit event details',
        'Event publishing failed',
        'Unable to manage registrations',
        'Event approval pending',
        'Event capacity not updating',
        'Unable to view analytics',
        'Unable to download event reports',
        'Unable to assign staff',
        'Event revenue not showing correctly',
    ],
    'Event Staff & Check-in Support': [
        'Unable to scan attendee QR code',
        'Valid ticket showing invalid',
        'Attendee already checked in incorrectly',
        'Check-in not updating',
        'Assigned event not showing',
        'Unable to access staff dashboard',
        'Scanner or camera not working',
        'Attendance report not generating',
    ],
    'Other Issues': [
        'My issue is not listed',
        'General inquiry',
        'Feedback or suggestion',
        'Report a bug',
        'Report suspicious activity',
        'Other support request',
    ],
};
const GENERAL_CATEGORIES = [
    'Account Related Problems',
    'Payment Issues',
    'Ticket & Registration Issues',
    'Event Related Issues',
    'Account Deletion & Privacy',
    'Notifications & Communication',
    'Website & Technical Problems',
    'Other Issues',
];
function canSubmitSupportCategory(role, requestType) {
    if (!exports.SUPPORT_CONCERNS[requestType])
        return false;
    if (role === constants_1.UserRole.SUPER_ADMIN)
        return true;
    if (requestType === 'Organizer & Client Support') {
        return role === constants_1.UserRole.EVENT_ORGANIZER || role === constants_1.UserRole.CLIENT;
    }
    if (requestType === 'Event Staff & Check-in Support') {
        return role === constants_1.UserRole.EVENT_STAFF;
    }
    return GENERAL_CATEGORIES.includes(requestType);
}
//# sourceMappingURL=support.constants.js.map