import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const SUPPORT_REPORT_CATEGORIES = [
  'Registration & User Management', 'Event Operations Report', 'Support & Issue Summary',
];

export class CreateSupportReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: SUPPORT_REPORT_CATEGORIES })
  @IsIn(SUPPORT_REPORT_CATEGORIES)
  category!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  scope!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  period!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  summary!: string;

  @ApiPropertyOptional({ enum: ['draft', 'submitted'] })
  @IsOptional()
  @IsIn(['draft', 'submitted'])
  status?: 'draft' | 'submitted';

  @ApiPropertyOptional({ description: 'Stable reference used to retry a submission without duplicating it' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sourceReference?: string;
}

export class ReviewSupportReportDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}

export class CreateOperationalReportDto extends OmitType(CreateSupportReportDto, ['category'] as const) {
  @IsIn(['Support Report', 'Finance Report', 'Combined Operational Report'])
  category!: string;
}
