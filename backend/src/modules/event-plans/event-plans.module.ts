import { Module } from '@nestjs/common';
import { EventPlansController } from './event-plans.controller';
import { EventPlansService } from './event-plans.service';

@Module({
  controllers: [EventPlansController],
  providers: [EventPlansService],
})
export class EventPlansModule {}
