export declare function minor(value: number): number;
export declare class FinanceService {
    private db;
    actor(id: string, permission?: string): import("../../common/data-store").User;
    admin(id: string): import("../../common/data-store").User;
    account(id: string): {
        name: string;
        email: string;
        phoneNo: string;
        bio: string;
        preferences: {
            emailNotifications: boolean;
            smsReminders: boolean;
            eventRecommendations: boolean;
        };
    };
    updateAccount(id: string, body: any): {
        reauthenticate: boolean;
        name: string;
        email: string;
        phoneNo: string;
        bio: string;
        preferences: {
            emailNotifications: boolean;
            smsReminders: boolean;
            eventRecommendations: boolean;
        };
    };
    password(id: string, body: any): {
        success: boolean;
    };
    audit(actorId: string, entityId: string, action: string, previousStatus: string, newStatus: string, metadata?: any): void;
    filters(q: any): {
        start: number | undefined;
        end: number | undefined;
        page: number;
        pageSize: number;
    };
    context(registrationId: string): {
        bookingId: string;
        eventId: string | undefined;
        eventName: string;
        organizerId: string | undefined;
        organizerName: string | undefined;
        attendeeName: string;
        bookingStatus: "cancelled" | "pending_payment" | "registered" | "waitlisted" | "no-show" | "attended" | undefined;
        cancellationReason: string | undefined;
        cancellationDeadline: string | undefined;
        eventStatus: "completed" | "cancelled" | "draft" | "published" | "ongoing" | undefined;
    };
    paymentRows(): {
        amount: number;
        currency: string;
        method: string;
        gateway: string;
        status: "pending" | "completed" | "failed" | "refunded";
        date: string | Date;
        createdAt: Date;
        gatewayPaymentId: null;
        reconciliationStatus: string;
        bookingId: string;
        eventId: string | undefined;
        eventName: string;
        organizerId: string | undefined;
        organizerName: string | undefined;
        attendeeName: string;
        bookingStatus: "cancelled" | "pending_payment" | "registered" | "waitlisted" | "no-show" | "attended" | undefined;
        cancellationReason: string | undefined;
        cancellationDeadline: string | undefined;
        eventStatus: "completed" | "cancelled" | "draft" | "published" | "ongoing" | undefined;
        id: string;
    }[];
    refundRows(): {
        amount: number;
        originalAmount: number;
        currency: string;
        status: "pending" | "completed" | "approved" | "failed" | "under_review" | "rejected" | "processing" | "not_applicable";
        reason: string;
        date: Date;
        processedAt: Date | undefined;
        bookingId: string;
        eventId: string | undefined;
        eventName: string;
        organizerId: string | undefined;
        organizerName: string | undefined;
        attendeeName: string;
        bookingStatus: "cancelled" | "pending_payment" | "registered" | "waitlisted" | "no-show" | "attended" | undefined;
        cancellationReason: string | undefined;
        cancellationDeadline: string | undefined;
        eventStatus: "completed" | "cancelled" | "draft" | "published" | "ongoing" | undefined;
        id: string;
        paymentId: string;
    }[];
    select(rows: any[], q: any, statuses?: string[]): any[];
    page(rows: any[], q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    transactions(q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    refunds(q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    settlements(q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    detail(kind: string, id: string): any;
    policy(eventId: string, when: any): any;
    captured(): {
        amount: number;
        currency: string;
        method: string;
        gateway: string;
        status: "pending" | "completed" | "failed" | "refunded";
        date: string | Date;
        createdAt: Date;
        gatewayPaymentId: null;
        reconciliationStatus: string;
        bookingId: string;
        eventId: string | undefined;
        eventName: string;
        organizerId: string | undefined;
        organizerName: string | undefined;
        attendeeName: string;
        bookingStatus: "cancelled" | "pending_payment" | "registered" | "waitlisted" | "no-show" | "attended" | undefined;
        cancellationReason: string | undefined;
        cancellationDeadline: string | undefined;
        eventStatus: "completed" | "cancelled" | "draft" | "published" | "ongoing" | undefined;
        id: string;
    }[];
    revenue(q: any): {
        id: string;
        eventId: string;
        eventName: string;
        organizerId: string;
        organizerName: string | undefined;
        tickets: number;
        gross: number;
        refunds: number;
        net: number;
        commission: any;
        payable: number | null;
        currency: string;
    }[];
    bucket(value: any, interval: string): string;
    dashboard(q: any): {
        generatedAt: Date;
        currency: string;
        summary: {
            gross: number;
            refunded: number;
            net: number;
            successful: number;
            failed: number;
            pending: number;
            commission: number | null;
            pendingRefunds: number;
            pendingSettlements: number;
            completedSettlements: number;
            tickets: number;
            organizerPayables: number | null;
            outstanding: number | null;
        };
        trends: any[];
        paymentStatus: {
            label: string;
            value: number;
        }[];
        events: {
            id: string;
            eventId: string;
            eventName: string;
            organizerId: string;
            organizerName: string | undefined;
            tickets: number;
            gross: number;
            refunds: number;
            net: number;
            commission: any;
            payable: number | null;
            currency: string;
        }[];
        activity: any[];
    };
    config(id: string): {
        currency: string;
        timezone: string;
        provider: string;
        reconciliationAvailable: boolean;
        payoutAvailable: boolean;
        policies: any[];
        canApproveRefund: boolean;
        canApproveSettlement: boolean;
        isAdmin: boolean;
        events: {
            id: string;
            name: string;
        }[];
        organizers: {
            id: string;
            name: string | undefined;
        }[];
    };
    reviewRefund(id: string, actorId: string, body: any): any;
    createSettlement(actorId: string, body: any): {
        id: string;
        eventId: string;
        eventName: string;
        organizerId: string;
        organizerName: string | undefined;
        from: any;
        to: any;
        lines: {
            paymentId: any;
            gross: any;
            refunds: number;
            commission: number;
            policyId: any;
            basisPoints: any;
            payable: number;
        }[];
        gross: number;
        refunds: number;
        commission: number;
        amount: number;
        currency: string;
        status: string;
        date: Date;
        simulatedSource: boolean;
    };
    settlementAction(id: string, actorId: string, body: any): any;
    addPolicy(actorId: string, body: any): {
        id: string;
        eventId: any;
        basisPoints: any;
        effectiveDate: any;
        createdBy: string;
        createdAt: Date;
    };
    grant(actorId: string, body: any): {
        success: boolean;
    };
    private submissionSummary;
    submitReport(actorId: string, body: any): any;
    submittedReports(actorId: string, q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    submittedReport(actorId: string, id: string): any;
    reviewSubmittedReport(actorId: string, id: string, body: any): any;
    report(q: any): {
        allRecords: any[];
        unavailable: string | undefined;
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        type: any;
        generatedAt: Date;
        filters: any;
        totals: {
            recordCount: number;
            amount: number | null;
        };
        chart: unknown[];
        summary: {
            gross: number;
            refunded: number;
            net: number;
            successful: number;
            failed: number;
            pending: number;
            commission: number | null;
            pendingRefunds: number;
            pendingSettlements: number;
            completedSettlements: number;
            tickets: number;
            organizerPayables: number | null;
            outstanding: number | null;
        };
    };
}
//# sourceMappingURL=finance.service.d.ts.map