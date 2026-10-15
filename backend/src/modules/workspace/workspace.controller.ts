import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RoleGuard } from '../../common/guards/role.guard';
import { WorkspaceService } from './workspace.service';
import { DataStore } from '../../common/data-store';
import { UpdateEventDto } from '../events/dtos/event.dto';
@Controller('api/workspace')
@UseGuards(RoleGuard)
export class WorkspaceController {
  constructor(private service: WorkspaceService) {}
  private mutate(operation: () => any) {
    const db = DataStore.getInstance();
    const snapshot = Object.fromEntries(Object.entries(db).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, structuredClone(value)]));
    try { const result = operation(); db.persist(); return result; } catch (error) { Object.assign(db, snapshot); throw error; }
  }
  @Get() snapshot(@Req() req: any) { return this.service.snapshot(req.user.userId); }
  @Patch('account') account(@Req() req: any, @Body() body: any) { return this.mutate(() => this.service.account(req.user.userId, body)); }
  @Post('password') password(@Req() req: any, @Body() body: any) { return this.mutate(() => this.service.password(req.user.userId, body)); }
  @Patch('registrations/:id/review') registration(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.reviewRegistration(req.user.userId, id, body)); }
  @Patch('events/:id/status') event(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.eventAction(req.user.userId, id, body)); }
  @Put('events/:id') editEvent(@Req() req: any, @Param('id') id: string, @Body() body: UpdateEventDto) { return this.mutate(() => this.service.editEvent(req.user.userId, id, body)); }
  @Patch('users/:id') editUser(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.editUser(req.user.userId, id, body)); }
  @Patch('users/:id/status') user(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.userStatus(req.user.userId, id, body)); }
  @Post('tasks') task(@Req() req: any, @Body() body: any) { return this.mutate(() => this.service.task(req.user.userId, undefined, body)); }
  @Patch('tasks/:id') updateTask(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.task(req.user.userId, id, body)); }
  @Post('reports') report(@Req() req: any, @Body() body: any) { return this.mutate(() => this.service.submitReport(req.user.userId, body)); }
  @Post('reports/:id/review') review(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(() => this.service.reviewReport(req.user.userId, id, body)); }
}
