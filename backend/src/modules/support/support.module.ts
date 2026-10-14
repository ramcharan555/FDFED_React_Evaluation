import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportMailService } from './support-mail.service';
import { SupportService } from './support.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportMailService],
})
export class SupportModule {}
