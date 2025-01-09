import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService
  ) {}

  async checkCredentials(username: string, pass: string): Promise<{id: number}> {
    const user = await this.usersService.getOneByUsername(username);
    if (!user || !await bcrypt.compare(pass, user.password) || !user.isActive) {
      return null;
    }
    const { password, ...result } = user;
    return result;
  }

  async generateToken(
    userId: number
  ): Promise<{ accessToken: string }> {
    const payload = { sub: userId};
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
