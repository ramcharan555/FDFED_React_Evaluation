import {
  IsString, IsNotEmpty, IsNumber, IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Registration ID', example: 'reg-001' })
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @ApiProperty({ description: 'Payment amount', example: 99 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'],
    example: 'Credit Card',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2024-06-01' })
  @IsString()
  @IsNotEmpty()
  paymentDate!: string;
}
