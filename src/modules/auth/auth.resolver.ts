import { Args, ObjectType, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UnauthorizedException } from '@nestjs/common';

@ObjectType()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Query(() => String)
  async login(
    @Args('username', { type: () => String }) username: string,
    @Args('password', { type: () => String }) password: string,
  ): Promise<string> {
    const user = await this.authService.checkCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }
    return this.authService.generateToken(user.id);
  }
}
