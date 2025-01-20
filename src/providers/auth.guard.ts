import {
CanActivate,
ExecutionContext,
Injectable,
UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../providers/role.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RoleService } from '../modules/user/role.service';

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
        const [type, token] = request.headers.authorization?.split(' ') ?? [];

        if (type !== 'Bearer' || !token) {
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
            
            const hasRole = userRoles.some((x) => {
                return requiredRoles.find(y => String(y) === String(x.id));
            })

            if (!hasRole) {
                throw new UnauthorizedException('Yetkiniz yok. Rolünüz yeterli değil.');
            }

            return true;
        } catch (e) {   
            throw new UnauthorizedException();
        }
        return false;
    }
}