import { Inject, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private jwtService: JwtService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async checkCredentials(username: string, password: string): Promise<User> {
        this.logger.log(`username: ${username} password: ${password}`);
        const user = await this.usersService.getOneByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password)) || !user.isActive) {
            return null;
        }
        return user;
    }

    async generateToken(userId: string): Promise<string> {
        const payload = {
            sub: userId,
        };
        return await this.jwtService.signAsync(payload);
    }
}
