import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SupportReportsController } from './support-reports.controller';
import { SupportReportsService } from './support-reports.service';
import { OperationalReportsController } from './operational-reports.controller';

@Module({
  controllers: [ReportsController, SupportReportsController, OperationalReportsController],
  providers: [ReportsService, SupportReportsService],
})
export class ReportsModule {}
