import { EmployeeType, UserRole } from '../../common/constants';
import { EventsService } from '../events/events.service';
export declare class WorkspaceService {
    private events;
    private db;
    constructor(events: EventsService);
    actor(id: string): import("../../common/data-store").User;
    private department;
    private log;
    private notify;
    private safeUser;
    snapshot(id: string): {
        generatedAt: Date;
        actor: {
            userId: string;
            name: string;
            email: string;
            bio?: string;
            preferences?: {
                emailNotifications: boolean;
                smsReminders: boolean;
                eventRecommendations: boolean;
            };
            userRole: UserRole;
            employeeType?: EmployeeType | string;
            status: "active" | "inactive" | "suspended";
            address?: string;
            phoneNo?: string;
            createdAt: Date;
            updatedAt: Date;
        };
        permissions: {
            admin: boolean;
            employee: boolean;
            operations: boolean;
            verify: boolean;
            manageEvents: boolean;
            manageUsers: boolean;
        };
        users: ({
            userId: string;
            name: string;
            email: string;
            bio?: string;
            preferences?: {
                emailNotifications: boolean;
                smsReminders: boolean;
                eventRecommendations: boolean;
            };
            userRole: UserRole;
            employeeType?: EmployeeType | string;
            status: "active" | "inactive" | "suspended";
            address?: string;
            phoneNo?: string;
            createdAt: Date;
            updatedAt: Date;
        } | {
            email?: string | undefined;
            phoneNo?: string | undefined;
            userId: string;
            name: string;
            userRole: UserRole;
            employeeType: string | undefined;
            status: "active" | "inactive" | "suspended";
        })[];
        events: {
            registered: number;
            eventId: string;
            organizerId: string;
            clientId?: string;
            superAdminId?: string;
            name: string;
            category: string;
            date: string;
            time: string;
            location: string;
            capacity: number;
            ticketPrice: number;
            status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
            description?: string;
            city?: string;
            registrationDeadline?: string;
            cancellationDeadline?: string;
            eligibility?: string;
            waitlistEnabled?: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        registrations: {
            attendeeName: string | undefined;
            attendeeUserId: string | undefined;
            email: string | undefined;
            eventName: string | undefined;
            registrationId: string;
            attendeeId: string;
            eventId: string;
            registrationDate: string;
            status: "pending_payment" | "registered" | "waitlisted" | "cancelled" | "no-show" | "attended";
            additionalInfo?: string;
            ticketType: string;
            ticketPriceAtBooking?: number;
            qrCode?: string;
            verificationId?: string;
            cancellationReason?: string;
            cancelledAt?: Date;
            offerExpiresAt?: Date;
            reservationExpiresAt?: Date;
            createdAt: Date;
            updatedAt: Date;
            reviewStatus?: "pending" | "approved" | "flagged";
            reviewedBy?: string;
            reviewReason?: string;
        }[];
        payments: import("../../common/data-store").Payment[];
        refunds: import("../../common/data-store").Refund[];
        requests: import("../../common/data-store").EventRequest[];
        assignments: {
            eventName: string | undefined;
            assignmentId: string;
            eventId: string;
            organizerId: string;
            staffId: string;
            status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
            assignedAt: Date;
            updatedAt: Date;
        }[];
        clientId: string | undefined;
        viewRevenue: boolean;
        financeGrants: any[];
        clients: {
            clientId: string;
            name: string | undefined;
        }[];
        organizers: {
            organizerId: string;
            userId: string;
            name: string | undefined;
        }[];
        staff: import("../../common/data-store").EventStaff[];
        attendees: import("../../common/data-store").Attendee[];
        notifications: import("../../common/data-store").Notification[];
        reports: any[];
        eventReports: import("../../common/data-store").EventReport[];
        tasks: any[];
        supportTickets: {
            requesterName: string | undefined;
            ticketId: string;
            userId: string;
            requestType: string;
            concern: string;
            description: string;
            response?: string;
            messages?: Array<{
                sender: "requester" | "support";
                message: string;
                createdAt: Date;
            }>;
            attachments: Omit<import("../../common/data-store").SupportAttachment, "userId" | "filePath" | "createdAt">[];
            status: "open" | "in_progress" | "resolved";
            createdAt: Date;
            updatedAt: Date;
            resolutionEmailSentAt?: Date;
        }[];
        summary: {
            users: number;
            events: number;
            registrations: number;
            checkedIn: number;
            pendingPayments: number;
            gross: number;
            refunded: number;
            net: number;
            pendingRequests: number;
            pendingReports: number;
            openTasks: number;
        };
    };
    account(id: string, body: any): {
        user: {
            userId: string;
            name: string;
            email: string;
            bio?: string;
            preferences?: {
                emailNotifications: boolean;
                smsReminders: boolean;
                eventRecommendations: boolean;
            };
            userRole: UserRole;
            employeeType?: EmployeeType | string;
            status: "active" | "inactive" | "suspended";
            address?: string;
            phoneNo?: string;
            createdAt: Date;
            updatedAt: Date;
        };
        reauthenticate: boolean;
    };
    password(id: string, body: any): {
        success: boolean;
    };
    reviewRegistration(id: string, registrationId: string, body: any): import("../../common/data-store").Registration;
    eventAction(id: string, eventId: string, body: any): any;
    editEvent(id: string, eventId: string, body: any): any;
    editUser(id: string, targetId: string, body: any): {
        userId: string;
        name: string;
        email: string;
        bio?: string;
        preferences?: {
            emailNotifications: boolean;
            smsReminders: boolean;
            eventRecommendations: boolean;
        };
        userRole: UserRole;
        employeeType?: EmployeeType | string;
        status: "active" | "inactive" | "suspended";
        address?: string;
        phoneNo?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    userStatus(id: string, targetId: string, body: any): {
        userId: string;
        name: string;
        email: string;
        bio?: string;
        preferences?: {
            emailNotifications: boolean;
            smsReminders: boolean;
            eventRecommendations: boolean;
        };
        userRole: UserRole;
        employeeType?: EmployeeType | string;
        status: "active" | "inactive" | "suspended";
        address?: string;
        phoneNo?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    task(id: string, taskId: string | undefined, body: any): any;
    submitReport(id: string, body: any): any;
    reviewReport(id: string, reportId: string, body: any): any;
}
//# sourceMappingURL=workspace.service.d.ts.map