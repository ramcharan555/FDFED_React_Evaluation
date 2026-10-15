import { WorkspaceService } from './workspace.service';
import { UpdateEventDto } from '../events/dtos/event.dto';
export declare class WorkspaceController {
    private service;
    constructor(service: WorkspaceService);
    private mutate;
    snapshot(req: any): {
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
            userRole: import("../../common/constants").UserRole;
            employeeType?: import("../../common/constants").EmployeeType | string;
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
            userRole: import("../../common/constants").UserRole;
            employeeType?: import("../../common/constants").EmployeeType | string;
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
            userRole: import("../../common/constants").UserRole;
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
    account(req: any, body: any): any;
    password(req: any, body: any): any;
    registration(req: any, id: string, body: any): any;
    event(req: any, id: string, body: any): any;
    editEvent(req: any, id: string, body: UpdateEventDto): any;
    editUser(req: any, id: string, body: any): any;
    user(req: any, id: string, body: any): any;
    task(req: any, body: any): any;
    updateTask(req: any, id: string, body: any): any;
    report(req: any, body: any): any;
    review(req: any, id: string, body: any): any;
}
//# sourceMappingURL=workspace.controller.d.ts.map