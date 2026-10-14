import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUPPORT_CONCERNS } from '../support.constants';

export class CreateSupportTicketDto {
  @ApiProperty({ enum: Object.keys(SUPPORT_CONCERNS) })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.keys(SUPPORT_CONCERNS))
  requestType!: string;

  @ApiProperty({ description: 'Concern selected from the request type options' })
  @IsString()
  @IsNotEmpty()
  concern!: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  attachmentIds?: string[];
}

export class UpdateSupportTicketStatusDto {
  @ApiProperty({ enum: ['open', 'in_progress', 'resolved'] })
  @IsString()
  @IsIn(['open', 'in_progress', 'resolved'])
  status!: 'open' | 'in_progress' | 'resolved';
}
