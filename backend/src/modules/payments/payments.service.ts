import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreatePaymentDto } from './dto/payment.dto';
import { QrCodeService } from '../../common/utils/qr-code.service';

@Injectable()
export class PaymentsService {
  private db: DataStore;
  private processingRegistrations = new Set<string>();
  constructor() { this.db = DataStore.getInstance(); }

  async create(dto: CreatePaymentDto, role: UserRole, userId?: string): Promise<any> {
    if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE can make payments');
    }

    const registration = this.db.registrations.find(r => r.registrationId === dto.registrationId);
    if (!registration) throw new NotFoundException(`Registration ${dto.registrationId} not found`);
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      if (!attendee || attendee.attendeeId !== registration.attendeeId) throw new ForbiddenException('You can only pay for your own registration');
    }
    if (registration.status !== 'pending_payment') throw new ConflictException('Registration is not awaiting payment');
    if (this.processingRegistrations.has(registration.registrationId)) throw new ConflictException('Payment is already being processed');
    if (registration.reservationExpiresAt && registration.reservationExpiresAt < new Date()) {
      registration.status = 'cancelled'; registration.cancellationReason = 'Payment reservation expired'; registration.cancelledAt = new Date(); registration.updatedAt = new Date();
      throw new ConflictException('Payment reservation expired; register again');
    }
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event || event.status !== 'published') throw new ConflictException('Event is no longer open');
    if (dto.amount !== event.ticketPrice) throw new ConflictException('Payment amount does not match the ticket price');

    // Prevent double payment
    const existing = this.db.payments.find(p => p.registrationId === dto.registrationId && p.status === 'completed');
    if (existing) throw new ConflictException('Payment already completed for this registration');

    if (dto.paymentMethod !== 'DEMO_PROVIDER') throw new BadRequestException('Only the simulated demo payment provider is configured');
    this.processingRegistrations.add(registration.registrationId);
    try {
      const verificationId = QrCodeService.generateVerificationId();
      const qrCode = await QrCodeService.generateQRCode(verificationId);
      if (registration.status !== 'pending_payment') throw new ConflictException('Registration is no longer awaiting payment');
      const paymentId = this.db.generateId('pay');
      const now = new Date();
      const payment = {
        paymentId,
        registrationId: dto.registrationId,
        amount: dto.amount,
        status: 'completed' as const,
        paymentDate: dto.paymentDate,
        paymentMethod: 'DEMO_PROVIDER',
        createdAt: now,
        updatedAt: now,
      };
      this.db.payments.push(payment);

      registration.status = 'registered'; registration.reservationExpiresAt = undefined;
      registration.verificationId = verificationId; registration.qrCode = qrCode; registration.updatedAt = now;

      const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
      if (attendee) {
        this.db.notifications.push({
          notificationId: this.db.generateId('notif'),
          userId: attendee.userId,
          eventId: registration.eventId,
          registrationId: dto.registrationId,
          paymentId,
          message: `Simulated payment of ₹${dto.amount} confirmed for "${event.name}"`,
          type: 'payment_confirmed',
          read: false,
          dateTime: now,
          createdAt: now,
        });
      }

      return { success: true, simulated: true, message: 'Demo payment successful', data: { ...payment, simulated: true, registration } };
    } finally {
      this.processingRegistrations.delete(registration.registrationId);
    }
  }

  processRefund(refundId: string, role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can process refunds');
    const refund = this.db.refunds.find(item => item.refundId === refundId);
    if (!refund) throw new NotFoundException(`Refund ${refundId} not found`);
    if (refund.status !== 'pending') throw new ConflictException('Refund is not pending');

    const payment = this.db.payments.find(item => item.paymentId === refund.paymentId);
    if (!payment || payment.status !== 'completed') throw new ConflictException('Completed payment not found for refund');
    const registration = this.db.registrations.find(item => item.registrationId === refund.registrationId);
    const attendee = registration && this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
    const now = new Date();

    refund.status = 'completed';
    refund.processedAt = now;
    payment.status = 'refunded';
    payment.updatedAt = now;
    if (attendee) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: attendee.userId,
        eventId: registration?.eventId,
        registrationId: refund.registrationId,
        paymentId: payment.paymentId,
        message: `Demo refund of ₹${refund.amount} completed.`,
        type: 'refund_completed',
        read: false,
        dateTime: now,
        createdAt: now,
      });
    }

    return { success: true, simulated: true, data: refund };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let payments = [...this.db.payments];
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      if (attendee) {
        const regIds = this.db.registrations.filter(r => r.attendeeId === attendee.attendeeId).map(r => r.registrationId);
        payments = payments.filter(p => regIds.includes(p.registrationId));
      } else payments = [];
    } else if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (client) {
        const eventIds = this.db.events.filter(e => (e as any).clientId === client.clientId).map(e => e.eventId);
        const regIds = this.db.registrations.filter(r => eventIds.includes(r.eventId)).map(r => r.registrationId);
        payments = payments.filter(p => regIds.includes(p.registrationId));
      } else payments = [];
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return payments;
  }

  findOne(id: string, role: UserRole, userId?: string): any {
    const payment = this.db.payments.find(p => p.paymentId === id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      const registration = this.db.registrations.find(r => r.registrationId === payment.registrationId);
      if (!attendee || registration?.attendeeId !== attendee.attendeeId) throw new ForbiddenException('You can only view your own payment');
    } else if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Access denied');
    return payment;
  }
}
