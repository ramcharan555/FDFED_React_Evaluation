import { ReportsService } from './reports.service';
import { CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
import { UserRole } from '../../common/constants';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    createEventReport(dto: CreateEventReportDto, role: UserRole): any;
    findAllEventReports(role: UserRole, userId: string): any[];
    createStaffReport(dto: CreateStaffReportDto, role: UserRole): any;
    findAllStaffReports(role: UserRole, userId: string): any[];
}
//# sourceMappingURL=reports.controller.d.ts.map