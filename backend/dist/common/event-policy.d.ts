export interface EventPolicy {
    version: string;
    cancellation: {
        minimumNoticeDays: number;
        feePercent: number;
    };
    sections: Array<{
        title: string;
        items: string[];
    }>;
}
export declare function getEventPolicy(): EventPolicy;
export declare class EventPolicyAcknowledgementDto {
    policyAccepted: boolean;
    acceptedPolicyVersion: string;
}
export declare function assertEventPolicyAccepted(acknowledgement: {
    policyAccepted?: boolean;
    acceptedPolicyVersion?: string;
}, policy: EventPolicy): void;
//# sourceMappingURL=event-policy.d.ts.map