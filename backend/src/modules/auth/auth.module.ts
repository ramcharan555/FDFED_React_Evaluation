import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
  secret: jwtConfig.secret,
  signOptions: { expiresIn: jwtConfig.expiresIn as any }, // ✅ quick fix
}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // Export for other modules
})
export class AuthModule {}
