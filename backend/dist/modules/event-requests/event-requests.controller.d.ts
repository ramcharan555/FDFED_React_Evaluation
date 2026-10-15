import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto, UpdateEventRequestStatusDto, RequestMissingInfoDto, ProvideMissingInfoDto, SendProposalDto, ReviseProposalDto, RejectRequestDto, ClientResponseDto, UpdateAgreementStatusDto, UpdatePaymentStatusDto, ConfirmBookingDto } from './dto/event-request.dto';
import { UserRole } from '../../common/constants';
export declare class EventRequestsController {
    private readonly service;
    constructor(service: EventRequestsService);
    checkAvailability(organizerId: string, date: string): {
        available: boolean;
        reason?: string;
        pastDate?: boolean;
        conflictEvent?: any;
    };
    create(dto: CreateEventRequestDto, role: UserRole, userId: string): any;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string, role: UserRole, userId: string): any;
    startReview(id: string, role: UserRole, userId: string): any;
    requestMissingInfo(id: string, dto: RequestMissingInfoDto, role: UserRole, userId: string): any;
    provideMissingInfo(id: string, dto: ProvideMissingInfoDto, role: UserRole, userId: string): any;
    sendProposal(id: string, dto: SendProposalDto, role: UserRole, userId: string): any;
    reviseProposal(id: string, dto: ReviseProposalDto, role: UserRole, userId: string): any;
    rejectRequest(id: string, dto: RejectRequestDto, role: UserRole, userId: string): any;
    clientResponse(id: string, dto: ClientResponseDto, role: UserRole, userId: string): any;
    updateAgreementStatus(id: string, dto: UpdateAgreementStatusDto, role: UserRole, userId: string): any;
    updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto, role: UserRole, userId: string): any;
    confirmBooking(id: string, dto: ConfirmBookingDto, role: UserRole, userId: string): any;
    updateStatus(id: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId: string): any;
}
//# sourceMappingURL=event-requests.controller.d.ts.map