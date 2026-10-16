import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';
import { WorkspaceService } from './workspace.service';
import { UpdateUserDto } from '../users/dto/user.dto';
import { UpdateEventDto } from '../events/dtos/event.dto';

@ApiTags('workspace')
@Controller('api/workspace')
@UseGuards(RoleGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get()
  snapshot(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.workspace.snapshot(role, userId);
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateUserDto,
    @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.workspace.updateCustomer(id, dto, role, userId);
  }

  @Delete('customers/:id')
  removeCustomer(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.workspace.removeCustomer(id, role, userId);
  }

  @Patch('events/:id')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto,
    @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.workspace.updateEvent(id, dto, role, userId);
  }
}
