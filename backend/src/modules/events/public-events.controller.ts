import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('api/public/events')
export class PublicEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get published events for the public attendee catalog' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by event name or location' })
  @ApiResponse({ status: 200, description: 'List of published events' })
  findAll(@Query('search') search?: string) {
    return this.eventsService.findAllPublic(search);
  }
}
