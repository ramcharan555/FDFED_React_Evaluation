export declare class CreateEventReportDto {
    eventId: string;
    organizerId: string;
    clientId?: string;
    submittedByStaffId?: string;
    reportTitle: string;
    reportDetails: string;
    submissionDate: string;
}
export declare class CreateStaffReportDto {
    staffId: string;
    organizerId: string;
    eventId: string;
    reportText: string;
}
export declare class CreateEventReviewDto {
    reviewerId: string;
    eventId: string;
    rating: number;
    comment: string;
}
export declare class CreateStaffReviewDto {
    reviewerId: string;
    staffId: string;
    eventId: string;
    rating: number;
    comment: string;
}
//# sourceMappingURL=report.dto.d.ts.map