import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';

@Injectable()
export class EventPlansService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  create(dto: CreateEventPlanDto, role: UserRole): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can create event plans');
    }

    const clientExists = this.db.clients.find(c => c.clientId === dto.clientId);
    if (!clientExists) throw new NotFoundException('Client not found');

    const planId = this.db.generateId('plan');
    const plan = {
      eventPlanId: planId,
      eventId: dto.eventId,
      clientId: dto.clientId,
      organizerId: dto.organizerId,
      title: dto.title,
      description: dto.description,
      budget: dto.budget,
      capacity: dto.capacity,
      status: 'submitted' as const,
      approvalStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventPlans.push(plan);

    // Notify client
    const client = this.db.clients.find(c => c.clientId === dto.clientId);
    if (client) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: client.userId,
        eventId: dto.eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `New event plan "${dto.title}" submitted for your review`,
        type: 'event_plan',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Event plan created', data: plan };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let plans = [...this.db.eventPlans];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (client) plans = plans.filter(p => p.clientId === client.clientId);
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (organizer) plans = plans.filter(p => p.organizerId === organizer.organizerId);
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return plans;
  }

  findOne(planId: string): any {
    // Note: Role-based access control should be added here
    const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
    if (!plan) throw new NotFoundException(`Event plan ${planId} not found`);
    return plan;
  }

  updateApproval(planId: string, dto: UpdateEventPlanApprovalDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can approve/reject event plans');
    }
    const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
    if (!plan) throw new NotFoundException(`Event plan ${planId} not found`);

    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (!client || client.clientId !== plan.clientId) {
        throw new ForbiddenException('You can only approve/reject plans for your own events');
      }
    }

    plan.approvalStatus = dto.approvalStatus;
    plan.status = dto.approvalStatus === 'approved' ? 'approved' : 'rejected';
    plan.updatedAt = new Date();

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
    if (organizer) {
      const orgUser = this.db.findUserById(organizer.userId);
      if (orgUser) {
        this.db.notifications.push({
          notificationId: this.db.generateId('notif'),
          userId: orgUser.userId,
          eventId: plan.eventId,
          registrationId: undefined,
          paymentId: undefined,
          message: `Event plan "${plan.title}" has been ${dto.approvalStatus} by client`,
          type: `plan_${dto.approvalStatus}`,
          read: false,
          dateTime: new Date(),
          createdAt: new Date(),
        });
      }
    }

    return { success: true, message: `Plan ${dto.approvalStatus}`, data: plan };
  }
}
