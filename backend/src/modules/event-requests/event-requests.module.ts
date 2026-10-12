import { Module } from '@nestjs/common';
import { EventRequestsController } from './event-requests.controller';
import { EventRequestsService } from './event-requests.service';

@Module({
  controllers: [EventRequestsController],
  providers: [EventRequestsService],
})
export class EventRequestsModule {}
