export declare class CreateAttendeeDto {
    name: string;
    email: string;
    phone?: string;
    password?: string;
}
export declare class UpdateAttendeeDto {
    name?: string;
    email?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'suspended';
}
export declare class AttendeeResponseDto {
    attendeeId: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    createdAt: Date;
}
//# sourceMappingURL=attendee.dto.d.ts.map