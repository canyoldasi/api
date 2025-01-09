import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { eaConstant } from './constant';
import { JwtStrategy } from 'src/providers/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [UserModule,
    JwtModule.register({
      global: true,
      secret: eaConstant.secret,
      signOptions: {
        expiresIn: '24h'
      }
    })
  ]
})
export class AuthModule {}
