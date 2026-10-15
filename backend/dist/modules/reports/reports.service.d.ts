import { createReadStream } from 'fs';
import { EventCompletionReport } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventCompletionReportDto, CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
export declare class ReportsService {
    private db;
    constructor();
    createEventReport(dto: CreateEventReportDto, role: UserRole): any;
    findAllEventReports(role: UserRole, userId?: string): any[];
    createCompletionReport(eventId: string, dto: CreateEventCompletionReportDto, files: Express.Multer.File[], role: UserRole, userId?: string): any;
    findAllCompletionReports(role: UserRole, userId?: string): EventCompletionReport[];
    getCompletionReportPhoto(eventId: string, fileName: string, role: UserRole, userId?: string): Promise<{
        stream: ReturnType<typeof createReadStream>;
        mimeType: string;
        fileName: string;
    }>;
    private getCompletionReport;
    createStaffReport(dto: CreateStaffReportDto, role: UserRole): any;
    findAllStaffReports(role: UserRole, userId?: string): any[];
}
//# sourceMappingURL=reports.service.d.ts.map