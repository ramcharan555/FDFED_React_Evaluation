import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyAttendanceDto {
  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Staff ID performing verification', example: 'staff-001' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiPropertyOptional({ description: 'QR code to verify', example: 'QR-001-EVT-001' })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Verification ID', example: 'VER-001-001' })
  @IsString()
  @IsOptional()
  verificationId?: string;

  @ApiProperty({ description: 'Check-in time', example: '09:15 AM' })
  @IsString()
  @IsNotEmpty()
  checkInTime!: string;
}
