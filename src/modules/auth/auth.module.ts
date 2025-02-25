import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../providers/jwt.strategy';
import { AuthResolver } from './auth.resolver';

@Module({
  controllers: [],
  providers: [AuthService, JwtStrategy, AuthResolver],
  imports: [UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '100d'
      }
    }),
  ]
})
export class AuthModule {}
