import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SupportTicket, User } from '../../common/data-store';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

@Injectable()
export class SupportMailService {
  async sendResolvedEmail(ticket: SupportTicket, requester: User): Promise<boolean> {
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
    } catch (error) {
      console.warn('Support ticket resolved, but the notification email could not be sent.', error);
      return false;
    } finally {
      transport.close();
    }
  }
}
