"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportMailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character]);
}
let SupportMailService = class SupportMailService {
    async sendResolvedEmail(ticket, requester) {
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || 587);
        const from = process.env.SMTP_FROM;
        const user = process.env.SMTP_USER;
        const password = process.env.SMTP_PASSWORD;
        if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
            return false;
        }
        const transport = nodemailer.createTransport({
            host,
            port,
            secure: process.env.SMTP_SECURE === 'true',
            ...(user && password ? { auth: { user, pass: password } } : {}),
        });
        try {
            await transport.sendMail({
                from,
                to: requester.email,
                subject: `EventFlow support request ${ticket.ticketId} resolved`,
                text: [
                    `Hello ${requester.name},`,
                    '',
                    `Your EventFlow support request ${ticket.ticketId} has been resolved.`,
                    `Concern: ${ticket.concern}`,
                    ticket.response ? `Support reply: ${ticket.response}` : '',
                    '',
                    'If you still need assistance, please submit a new support request.',
                    '',
                    'EventFlow Customer Support',
                ].join('\n'),
                html: `<p>Hello ${escapeHtml(requester.name)},</p>
          <p>Your EventFlow support request <strong>${escapeHtml(ticket.ticketId)}</strong> has been resolved.</p>
          <p><strong>Concern:</strong> ${escapeHtml(ticket.concern)}</p>
          ${ticket.response ? `<p><strong>Support reply:</strong> ${escapeHtml(ticket.response)}</p>` : ''}
          <p>If you still need assistance, please submit a new support request.</p>
          <p>EventFlow Customer Support</p>`,
            });
            return true;
        }
        catch (error) {
            console.warn('Support ticket resolved, but the notification email could not be sent.', error);
            return false;
        }
        finally {
            transport.close();
        }
    }
};
exports.SupportMailService = SupportMailService;
exports.SupportMailService = SupportMailService = __decorate([
    (0, common_1.Injectable)()
], SupportMailService);
//# sourceMappingURL=support-mail.service.js.map