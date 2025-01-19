import {
CanActivate,
ExecutionContext,
Injectable,
UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from 'src/providers/role.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RoleService } from 'src/modules/role/role.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService, 
        private reflector: Reflector,
        private roleService: RoleService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                secret: process.env.JWT_SECRET
                }
            );

            request['user'] = payload;

            const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(process.env.METADATA_ROLES, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!requiredRoles) {
                return true;
            }

            const userRoles = await this.roleService.findUserRoles(payload.sub);
            
            return userRoles.some((x) => {
                return requiredRoles.find(y => String(y) === String(x.id));
            })
        } catch (e) {   
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}