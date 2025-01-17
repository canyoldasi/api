import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService
  ) {}

  async checkCredentials(username: string, pass: string): Promise<User> {
    const user = await this.usersService.getOneByUsername(username);
    if (!user || user.length == 0 || !await bcrypt.compare(pass, user[0].password) || !user[0].isActive) {
      return null;
    }
    return user[0];
  }

  async generateToken(
    userId: number,
    roles: UserRole[]
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
