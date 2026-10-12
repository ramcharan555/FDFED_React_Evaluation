import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Welcome endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is running',
  })
  getWelcome() {
    return this.appService.getWelcome();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
