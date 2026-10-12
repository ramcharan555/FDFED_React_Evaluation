import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'superadmin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'Admin@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
