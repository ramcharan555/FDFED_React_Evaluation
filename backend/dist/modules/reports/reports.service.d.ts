import { UserRole } from '../../common/constants';
import { CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
export declare class ReportsService {
    private db;
    constructor();
    createEventReport(dto: CreateEventReportDto, role: UserRole): any;
    findAllEventReports(role: UserRole, userId?: string): any[];
    createStaffReport(dto: CreateStaffReportDto, role: UserRole): any;
    findAllStaffReports(role: UserRole, userId?: string): any[];
}
//# sourceMappingURL=reports.service.d.ts.map