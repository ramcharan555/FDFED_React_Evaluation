export declare const SUPPORT_REPORT_CATEGORIES: string[];
export declare class CreateSupportReportDto {
    title: string;
    category: string;
    scope: string;
    period: string;
    summary: string;
    status?: 'draft' | 'submitted';
    sourceReference?: string;
}
export declare class ReviewSupportReportDto {
    feedback?: string;
}
declare const CreateOperationalReportDto_base: import("@nestjs/common").Type<Omit<CreateSupportReportDto, "category">>;
export declare class CreateOperationalReportDto extends CreateOperationalReportDto_base {
    category: string;
}
export {};
//# sourceMappingURL=support-report.dto.d.ts.map