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

  async checkCredentials(username: string, pass: string): Promise<{id: number, roles: string}> {
    const user = await this.usersService.getOneByUsername(username);
    if (!user || !await bcrypt.compare(pass, user.password) || !user.isActive) {
      return null;
    }
    const { password, ...result } = user;
    return result;
  }

  async generateToken(
    userId: number,
    roles: string
  ): Promise<{ accessToken: string }> {
    const payload = { 
      sub: userId,
      roles: roles
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
