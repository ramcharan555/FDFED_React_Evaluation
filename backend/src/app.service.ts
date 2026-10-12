import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcome() {
    return {
      message: '🎉 Welcome to Event Management & Coordination System API',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        users: '/users',
        events: '/events',
        'event-requests': '/event-requests',
        'event-plans': '/event-plans',
        attendees: '/attendees',
        registrations: '/registrations',
        payments: '/payments',
        staff: '/staff',
        'staff-assignments': '/staff-assignments',
        attendance: '/attendance',
        reports: '/reports',
        reviews: '/reviews',
        notifications: '/notifications',
        analytics: '/analytics',
        'activity-logs': '/activity-logs',
        'api-docs': '/api',
      },
      docs: 'Visit http://localhost:3001/api for Swagger documentation',
      roles: ['super_admin', 'client', 'event_organizer', 'event_staff', 'attendee'],
      'pass-role-header': 'Add header: x-role: super_admin|client|event_organizer|event_staff|attendee',
    };
  }

  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
