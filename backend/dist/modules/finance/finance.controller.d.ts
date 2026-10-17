import { UserRole } from '../../common/constants';
import { Response } from 'express';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly service;
    constructor(service: FinanceService);
    dashboard(userId: string, role: UserRole, query: Record<string, unknown>): {
        currency: string;
        eventRevenue: {
            eventId: string | null;
            eventName: string;
            revenue: number;
            ticketsSold: number;
        }[];
        revenueTrend: {
            date: string;
            revenue: number;
        }[];
        totals: {
            grossRevenue: number;
            netRevenue: number;
            successfulPayments: number;
            failedPayments: number;
            pendingPayments: number;
            refundedAmount: number;
            pendingRefundRequests: number;
            ticketsSold: number;
            platformCommission: null;
        };
        capabilities: {
            commissionConfigured: boolean;
            organizerPayouts: boolean;
            gatewayReconciliation: boolean;
            paymentProvider: string;
        };
        recentTransactions: {
            eventId: string | null;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            currency: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "refunded";
            paymentDate: string;
            paymentMethod: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        recentRefunds: {
            originalPaymentAmount: number | null;
            eventId: string | null;
            organizerId: string | null;
            organizerName: string;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            refundId: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "not_applicable";
            reason: string;
            requestedAt: Date;
            processedAt?: Date;
            reviews?: Array<{
                actorUserId: string;
                note: string;
                at: string;
            }>;
        }[];
    };
    transactions(userId: string, role: UserRole, query: Record<string, unknown>): {
        data: {
            eventId: string | null;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            currency: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "refunded";
            paymentDate: string;
            paymentMethod: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        filters: {
            events: {
                eventId: string;
                name: string;
            }[];
            methods: string[];
        };
    };
    exportTransactions(userId: string, role: UserRole, query: Record<string, unknown>): string;
    transaction(id: string, userId: string, role: UserRole): {
        refunds: {
            originalPaymentAmount: number | null;
            eventId: string | null;
            organizerId: string | null;
            organizerName: string;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            refundId: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "not_applicable";
            reason: string;
            requestedAt: Date;
            processedAt?: Date;
            reviews?: Array<{
                actorUserId: string;
                note: string;
                at: string;
            }>;
        }[];
        eventId: string | null;
        eventName: string;
        attendeeName: string;
        attendeeEmail: string;
        currency: string;
        paymentId: string;
        registrationId: string;
        amount: number;
        status: "pending" | "completed" | "failed" | "refunded";
        paymentDate: string;
        paymentMethod: string;
        createdAt: Date;
        updatedAt: Date;
    };
    refunds(userId: string, role: UserRole, query: Record<string, unknown>): {
        data: {
            originalPaymentAmount: number | null;
            eventId: string | null;
            organizerId: string | null;
            organizerName: string;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            refundId: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "not_applicable";
            reason: string;
            requestedAt: Date;
            processedAt?: Date;
            reviews?: Array<{
                actorUserId: string;
                note: string;
                at: string;
            }>;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        filters: {
            events: {
                eventId: string;
                name: string;
            }[];
            organizers: {
                organizerId: string;
                name: string;
            }[];
        };
    };
    refund(id: string, userId: string, role: UserRole): {
        originalPaymentAmount: number | null;
        eventId: string | null;
        organizerId: string | null;
        organizerName: string;
        eventName: string;
        attendeeName: string;
        attendeeEmail: string;
        refundId: string;
        paymentId: string;
        registrationId: string;
        amount: number;
        status: "pending" | "completed" | "failed" | "not_applicable";
        reason: string;
        requestedAt: Date;
        processedAt?: Date;
        reviews?: Array<{
            actorUserId: string;
            note: string;
            at: string;
        }>;
    };
    reviewRefund(id: string, userId: string, role: UserRole, body: Record<string, unknown>): {
        originalPaymentAmount: number | null;
        eventId: string | null;
        organizerId: string | null;
        organizerName: string;
        eventName: string;
        attendeeName: string;
        attendeeEmail: string;
        refundId: string;
        paymentId: string;
        registrationId: string;
        amount: number;
        status: "pending" | "completed" | "failed" | "not_applicable";
        reason: string;
        requestedAt: Date;
        processedAt?: Date;
        reviews?: Array<{
            actorUserId: string;
            note: string;
            at: string;
        }>;
    };
    overview(userId: string, role: UserRole, query: Record<string, unknown>): {
        eventRevenue: {
            refundedAmount: number;
            netRevenue: number;
            commissionAmount: null;
            organizerPayable: null;
            eventId: string | null;
            eventName: string;
            revenue: number;
            ticketsSold: number;
        }[];
        paymentStatuses: {
            status: string;
            count: number;
        }[];
        commissionTrend: null;
        refundTrend: {
            date: string;
            requested: number;
            completed: number;
        }[];
        generatedAt: string;
        currency: string;
        revenueTrend: {
            date: string;
            revenue: number;
        }[];
        totals: {
            grossRevenue: number;
            netRevenue: number;
            successfulPayments: number;
            failedPayments: number;
            pendingPayments: number;
            refundedAmount: number;
            pendingRefundRequests: number;
            ticketsSold: number;
            platformCommission: null;
        };
        capabilities: {
            commissionConfigured: boolean;
            organizerPayouts: boolean;
            gatewayReconciliation: boolean;
            paymentProvider: string;
        };
        recentTransactions: {
            eventId: string | null;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            currency: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "refunded";
            paymentDate: string;
            paymentMethod: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        recentRefunds: {
            originalPaymentAmount: number | null;
            eventId: string | null;
            organizerId: string | null;
            organizerName: string;
            eventName: string;
            attendeeName: string;
            attendeeEmail: string;
            refundId: string;
            paymentId: string;
            registrationId: string;
            amount: number;
            status: "pending" | "completed" | "failed" | "not_applicable";
            reason: string;
            requestedAt: Date;
            processedAt?: Date;
            reviews?: Array<{
                actorUserId: string;
                note: string;
                at: string;
            }>;
        }[];
    };
    reconciliation(userId: string, role: UserRole): {
        data: never[];
        available: boolean;
        reason: string;
    };
    reports(userId: string, role: UserRole, query: Record<string, unknown>): {
        type: string;
        rows: Record<string, unknown>[];
        total: number;
        generatedAt: string;
        filters: {
            from: {} | null;
            to: {} | null;
            eventId: string | null;
            organizerId: string | null;
            status: string | null;
        };
        options: {
            events: {
                id: string;
                name: string;
            }[];
            organizers: {
                id: string;
                name: string;
            }[];
        };
        currency: string;
        summary: {
            grossRevenue: number;
            refundedAmount: number;
            netRevenue: number;
        };
    };
    submissions(userId: string, role: UserRole): {
        id: string;
        userId: string;
        userName: string;
        title: string;
        summary: string;
        reportType: string;
        filters: Record<string, unknown>;
        metrics: Record<string, number>;
        rows: Record<string, unknown>[];
        status: "Submitted" | "Reviewed";
        feedback: string;
        createdAt: Date;
        reviewedAt?: Date;
    }[];
    submitReport(userId: string, role: UserRole, body: Record<string, unknown>): {
        id: string;
        userId: string;
        userName: string;
        title: string;
        summary: string;
        reportType: string;
        filters: Record<string, unknown>;
        metrics: {
            grossRevenue: number;
            refundedAmount: number;
            netRevenue: number;
            recordCount: number;
        };
        rows: Record<string, unknown>[];
        status: "Submitted";
        feedback: string;
        createdAt: Date;
    };
    reviewReport(id: string, userId: string, role: UserRole, body: Record<string, unknown>): {
        id: string;
        userId: string;
        userName: string;
        title: string;
        summary: string;
        reportType: string;
        filters: Record<string, unknown>;
        metrics: Record<string, number>;
        rows: Record<string, unknown>[];
        status: "Submitted" | "Reviewed";
        feedback: string;
        createdAt: Date;
        reviewedAt?: Date;
    };
    reportCsv(userId: string, role: UserRole, query: Record<string, unknown>): string;
    reportPdf(userId: string, role: UserRole, query: Record<string, unknown>, response: Response): void;
}
//# sourceMappingURL=finance.controller.d.ts.map