import { Response } from 'express';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly service;
    constructor(service: FinanceService);
    private auth;
    private mutate;
    config(req: any): {
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
    account(req: any): {
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
    updateAccount(req: any, body: any): any;
    password(req: any, body: any): any;
    dashboard(req: any, q: any): {
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
    transactions(req: any, q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    transaction(req: any, id: string): any;
    refunds(req: any, q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    refund(req: any, id: string): any;
    review(req: any, id: string, body: any): any;
    settlements(req: any, q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    settlement(req: any, id: string): any;
    calculate(req: any, body: any): any;
    settlementAction(req: any, id: string, body: any): any;
    revenue(req: any, q: any): {
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
    policies(req: any): any[];
    policy(req: any, body: any): any;
    grant(req: any, body: any): any;
    reconciliation(req: any, q: any): {
        available: boolean;
        reason: string;
        records: never[];
    };
    report(req: any, q: any): {
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
    submitReport(req: any, body: any): any;
    submittedReports(req: any, q: any): {
        records: any[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    submittedReport(req: any, id: string): any;
    reviewSubmittedReport(req: any, id: string, body: any): any;
    exportSubmittedReport(req: any, id: string, format: string, res: Response): void;
    export(req: any, q: any, res: Response): void;
}
//# sourceMappingURL=finance.controller.d.ts.map