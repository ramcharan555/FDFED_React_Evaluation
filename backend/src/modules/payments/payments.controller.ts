import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('payments')
@Controller('api/payments')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership', required: false })
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process payment (ATTENDEE only). Blocks duplicate payment.' })
  @ApiResponse({ status: 201, description: 'Payment processed. Ticket confirmed.' })
  @ApiResponse({ status: 403, description: 'Only ATTENDEE can make payments' })
  @ApiResponse({ status: 409, description: 'Payment already completed for this registration' })
  create(@Body() dto: CreatePaymentDto, @UserRoleDecorator() role: UserRole) {
    return this.service.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'List payments (role-filtered)' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
