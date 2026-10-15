import {
  IsString, IsNotEmpty, IsNumber, IsPositive, IsIn,
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
    description: 'Simulated payment provider. No card or bank details are accepted.',
    enum: ['DEMO_PROVIDER'],
    example: 'DEMO_PROVIDER',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['DEMO_PROVIDER'])
  paymentMethod!: string;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2024-06-01' })
  @IsString()
  @IsNotEmpty()
  paymentDate!: string;
}
