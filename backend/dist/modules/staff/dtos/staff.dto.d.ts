export declare class CreateStaffDto {
    name: string;
    email: string;
    phone?: string;
    availableDates?: string[];
    password?: string;
}
export declare class UpdateStaffDto {
    name?: string;
    email?: string;
    availableDates?: string[];
    status?: 'available' | 'unavailable' | 'busy';
    phone?: string;
}
export declare class StaffResponseDto {
    staffId: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    availableDates: string[];
    rating: number;
    status: string;
    createdAt: Date;
}
//# sourceMappingURL=staff.dto.d.ts.map