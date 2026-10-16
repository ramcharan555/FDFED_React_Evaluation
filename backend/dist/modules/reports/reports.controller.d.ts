import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateEventCompletionReportDto, CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
import { UserRole } from '../../common/constants';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    createEventReport(dto: CreateEventReportDto, role: UserRole, userId: string): any;
    uploadEventReport(eventId: string, file: Express.Multer.File | undefined, role: UserRole, userId: string): any;
    getEventReportFile(reportId: string, role: UserRole, userId: string, response: Response): Promise<StreamableFile>;
    findAllEventReports(role: UserRole, userId: string): any[];
    createCompletionReport(eventId: string, dto: CreateEventCompletionReportDto, files: Express.Multer.File[] | undefined, role: UserRole, userId: string): any;
    findAllCompletionReports(role: UserRole, userId: string): import("../../common/data-store").EventCompletionReport[];
    getCompletionReportPhoto(eventId: string, fileName: string, role: UserRole, userId: string, response: Response): Promise<StreamableFile>;
    createStaffReport(dto: CreateStaffReportDto, role: UserRole, userId: string): any;
    findAllStaffReports(role: UserRole, userId: string): any[];
}
//# sourceMappingURL=reports.controller.d.ts.map