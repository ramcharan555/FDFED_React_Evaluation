import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { EventRequestsService } from './event-requests.service';
import {
  CreateEventRequestDto,
  UpdateEventRequestStatusDto,
  RequestMissingInfoDto,
  ProvideMissingInfoDto,
  SendProposalDto,
  ReviseProposalDto,
  RejectRequestDto,
  ClientResponseDto,
  UpdateAgreementStatusDto,
  UpdatePaymentStatusDto,
  ConfirmBookingDto,
} from './dto/event-request.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';
import { EventPolicyAcknowledgementDto, getEventPolicy } from '../../common/event-policy';

@ApiTags('event-requests')
@Controller('api/event-requests')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role (client, event_organizer, super_admin)', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership checks', required: false })
export class EventRequestsController {
  constructor(private readonly service: EventRequestsService) {}

  @Get('policies')
  @ApiOperation({ summary: 'Read the event rules, cancellation policy, and terms acknowledged by clients and organizers' })
  policies() {
    return { success: true, data: getEventPolicy() };
  }

  @Get('check-availability')
  @ApiOperation({ summary: 'Check date availability for an organizer' })
  @ApiQuery({ name: 'organizerId', required: true, example: 'org-001' })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-05' })
  @ApiResponse({ status: 200, description: 'Date availability check results' })
  checkAvailability(
    @Query('organizerId') organizerId: string,
    @Query('date') date: string,
  ) {
    return this.service.checkDateAvailability(organizerId, date);
  }

  @Get('organizers')
  @ApiOperation({ summary: 'List public organizer profiles for event requests' })
  findOrganizers(@UserRoleDecorator() role: UserRole) {
    return this.service.findOrganizers(role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create event request (CLIENT only)' })
  @ApiResponse({ status: 201, description: 'Event request created' })
  @ApiResponse({ status: 400, description: 'Past date or invalid data' })
  @ApiResponse({ status: 403, description: 'Only CLIENT can create event requests' })
  @ApiResponse({ status: 409, description: 'Duplicate active request exists' })
  create(
    @Body() dto: CreateEventRequestDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.create(dto, role, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List event requests (role-filtered)' })
  @ApiResponse({ status: 200, description: 'List of event requests filtered by role' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event request by ID' })
  @ApiResponse({ status: 200, description: 'Event request details' })
  @ApiResponse({ status: 404, description: 'Event request not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findOne(id, role, userId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Organizer starts review (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Status moved to under_review' })
  startReview(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.startReview(id, role, userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Organizer accepts an event request and starts planning' })
  acceptRequest(@Param('id') id: string, @Body() acknowledgement: EventPolicyAcknowledgementDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.acceptRequest(id, role, userId, acknowledgement);
  }

  @Post(':id/accept-counteroffer')
  @ApiOperation({ summary: 'Organizer accepts the client counteroffer and starts planning' })
  acceptCounteroffer(@Param('id') id: string, @Body() acknowledgement: EventPolicyAcknowledgementDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.acceptCounteroffer(id, role, userId, acknowledgement);
  }

  @Post(':id/request-info')
  @ApiOperation({ summary: 'Request missing information from client (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Query recorded and client notified' })
  requestMissingInfo(
    @Param('id') id: string,
    @Body() dto: RequestMissingInfoDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.requestMissingInfo(id, dto, role, userId);
  }

  @Post(':id/provide-info')
  @ApiOperation({ summary: 'Client provides missing information (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Information provided and organizer notified' })
  provideMissingInfo(
    @Param('id') id: string,
    @Body() dto: ProvideMissingInfoDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.provideMissingInfo(id, dto, role, userId);
  }

  @Post(':id/proposal')
  @ApiOperation({ summary: 'Send proposal to client (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Proposal recorded and status moved to proposal_sent' })
  sendProposal(
    @Param('id') id: string,
    @Body() dto: SendProposalDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.sendProposal(id, dto, role, userId);
  }

  @Post(':id/revise-proposal')
  @ApiOperation({ summary: 'Revise proposal to client (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Revised proposal version recorded' })
  reviseProposal(
    @Param('id') id: string,
    @Body() dto: ReviseProposalDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.reviseProposal(id, dto, role, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject request with mandatory reason (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Request rejected and reason recorded' })
  rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.rejectRequest(id, dto, role, userId);
  }

  @Post(':id/client-response')
  @ApiOperation({ summary: 'Client responds to proposal: accept, request_revision, reject, withdraw (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Client decision recorded' })
  clientResponse(
    @Param('id') id: string,
    @Body() dto: ClientResponseDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.clientResponse(id, dto, role, userId);
  }

  @Post(':id/agreement')
  @ApiOperation({ summary: 'Update agreement status' })
  @ApiResponse({ status: 200, description: 'Agreement status updated' })
  updateAgreementStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAgreementStatusDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updateAgreementStatus(id, dto, role, userId);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Update deposit / payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updatePaymentStatus(id, dto, role, userId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm booking after agreement and deposit satisfied (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Booking confirmed and event created' })
  @ApiResponse({ status: 400, description: 'Missing agreement or deposit satisfaction' })
  confirmBooking(
    @Param('id') id: string,
    @Body() dto: ConfirmBookingDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.confirmBooking(id, dto, role, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event request status (backward-compatible)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventRequestStatusDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updateStatus(id, dto, role, userId);
  }
}
