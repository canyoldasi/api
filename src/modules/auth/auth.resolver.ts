import { Args, Context, ObjectType, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserResponseDTO } from '../user/get-user-response.dto';

@ObjectType()
export class AuthResolver {
    constructor(private authService: AuthService) {}

    @Query(() => String)
    async login(
        @Args('username', { type: () => String }) username: string,
        @Args('password', { type: () => String }) password: string
    ): Promise<string> {
        const user = await this.authService.checkCredentials(username, password);
        if (!user) {
            throw new UnauthorizedException('Geçersiz kimlik bilgileri');
        }
        return this.authService.generateToken(user.id);
    }

    @Query(() => UserResponseDTO, { nullable: true })
    async me(@Context() context: any): Promise<UserResponseDTO | null> {
        const r = context.req?.user || context.request?.raw.user;
        return r;
    }
}
