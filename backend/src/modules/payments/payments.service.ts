import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  create(dto: CreatePaymentDto, role: UserRole): any {
    if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE can make payments');
    }

    const registration = this.db.registrations.find(r => r.registrationId === dto.registrationId);
    if (!registration) throw new NotFoundException(`Registration ${dto.registrationId} not found`);

    // Prevent double payment
    const existing = this.db.payments.find(p => p.registrationId === dto.registrationId && p.status === 'completed');
    if (existing) throw new ConflictException('Payment already completed for this registration');

    const paymentId = this.db.generateId('pay');
    const payment = {
      paymentId,
      registrationId: dto.registrationId,
      amount: dto.amount,
      status: 'completed' as const,
      paymentDate: dto.paymentDate,
      paymentMethod: dto.paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.payments.push(payment);

    // Update registration status to confirmed
    if (registration.status !== 'cancelled') {
      registration.status = 'registered';
      registration.updatedAt = new Date();
    }

    // Notify attendee
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
    if (attendee) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: attendee.userId,
        eventId: registration.eventId,
        registrationId: dto.registrationId,
        paymentId,
        message: `Payment of ₹${dto.amount} confirmed for "${event?.name || registration.eventId}"`,
        type: 'payment_confirmed',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Payment successful', data: payment };
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

  findOne(id: string): any {
    const payment = this.db.payments.find(p => p.paymentId === id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }
}
