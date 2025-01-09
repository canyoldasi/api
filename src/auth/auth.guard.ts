import {
CanActivate,
ExecutionContext,
Injectable,
UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eaConstant } from './constant';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { EARole } from 'src/providers/ea-role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                secret: eaConstant.secret
                }
            );
            // We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = payload;

            const requiredRoles = this.reflector.getAllAndOverride<EARole[]>(eaConstant.roleMetaData, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!requiredRoles) {
                return true;
            }
            const { user } = context.switchToHttp().getRequest();
            return requiredRoles.some((role) => user.roles?.includes(role));
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}