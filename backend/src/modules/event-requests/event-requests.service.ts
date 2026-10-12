import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventRequestDto, UpdateEventRequestStatusDto } from './dto/event-request.dto';

@Injectable()
export class EventRequestsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  create(dto: CreateEventRequestDto, role: UserRole): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can create event requests');
    }
    const requestId = this.db.generateId('req');
    const request = {
      requestId,
      clientId: dto.clientId,
      organizerId: dto.organizerId,
      eventName: dto.eventName,
      eventDate: dto.eventDate,
      budget: dto.budget,
      capacity: dto.capacity,
      requirements: dto.requirements || '',
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventRequests.push(request);

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === dto.organizerId);
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: organizer ? organizer.userId : dto.organizerId,
      eventId: undefined,
      registrationId: undefined,
      paymentId: undefined,
      message: `New event request: "${dto.eventName}" from client ${dto.clientId}`,
      type: 'event_request',
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });

    return { success: true, message: 'Event request created', data: request };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let requests = [...this.db.eventRequests];
    if (role === UserRole.CLIENT) {
      // Client sees only their own requests
      const client = this.db.clients.find(c => c.userId === userId);
      if (client) requests = requests.filter(r => r.clientId === client.clientId);
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (organizer) requests = requests.filter(r => r.organizerId === organizer.organizerId);
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return requests;
  }

  findOne(requestId: string, role: UserRole, userId?: string): any {
    const request = this.db.eventRequests.find(r => r.requestId === requestId);
    if (!request) throw new NotFoundException(`Event request ${requestId} not found`);
    
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (!client || client.clientId !== request.clientId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== request.organizerId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    
    return request;
  }

  updateStatus(requestId: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN && role !== UserRole.CLIENT) {
      throw new ForbiddenException('Access denied');
    }
    const request = this.db.eventRequests.find(r => r.requestId === requestId);
    if (!request) throw new NotFoundException(`Event request ${requestId} not found`);

    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (!client || client.clientId !== request.clientId) {
        throw new ForbiddenException('You can only update your own requests');
      }
      if (dto.status !== 'cancelled') {
        throw new ForbiddenException('Clients can only cancel requests');
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== request.organizerId) {
        throw new ForbiddenException('You can only update requests assigned to you');
      }
    }

    // Only organizer or super admin can approve/reject
    if ((dto.status === 'approved' || dto.status === 'rejected') &&
      role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can approve/reject event requests');
    }

    request.status = dto.status;
    request.updatedAt = new Date();

    // If approved, create an event record
    if (dto.status === 'approved') {
      const eventId = this.db.generateId('evt');
      const event = {
        eventId,
        organizerId: request.organizerId,
        clientId: request.clientId,
        name: request.eventName,
        category: 'Corporate', // Default to Corporate
        date: request.eventDate,
        time: '10:00',
        location: 'TBD',
        capacity: request.capacity,
        ticketPrice: 0,
        status: 'ongoing' as const,
        description: request.requirements,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.db.events.push(event);
    }

    // Notify client about status change
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    if (client) {
      const clientUser = this.db.findUserById(client.userId);
      if (clientUser) {
        this.db.notifications.push({
          notificationId: this.db.generateId('notif'),
          userId: clientUser.userId,
          eventId: undefined,
          registrationId: undefined,
          paymentId: undefined,
          message: `Your event request "${request.eventName}" has been ${dto.status}`,
          type: `request_${dto.status}`,
          read: false,
          dateTime: new Date(),
          createdAt: new Date(),
        });
      }
    }

    return { success: true, message: `Request status updated to ${dto.status}`, data: request };
  }
}
