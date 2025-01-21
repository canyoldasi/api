import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService
  ) {}

  async checkCredentials(username: string, password: string): Promise<User> {
    console.log(`username: ${username} password: ${password}`)
    const user = await this.usersService.getOneByUsername(username);
    if (!user || !await bcrypt.compare(password, user.password) || !user.isActive) {
      return null;
    }
    return user;
  }

  async generateToken(
    userId: string
  ): Promise<string> {
    const payload = { 
      sub: userId
    };
    return await this.jwtService.signAsync(payload);
  }
}
