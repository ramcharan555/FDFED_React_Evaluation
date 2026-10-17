export declare class CreateStaffAssignmentDto {
    role?: string;
    fee?: number;
    notes?: string;
    eventId: string;
    organizerId: string;
    staffId: string;
}
export declare class UpdateAssignmentStatusDto {
    status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
}
//# sourceMappingURL=staff-assignment.dto.d.ts.map