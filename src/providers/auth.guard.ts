import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_METADATA_NAME, Permission } from 'src/constants';
import { UserService } from 'src/modules/user/user.service';
import FastifyRequestCustom from './fastify-request-custom';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private userService: UserService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const gqlContext = ctx.getContext();
        const raw = gqlContext.req || gqlContext.request?.raw;
        const request = raw as FastifyRequestCustom;

        const authHeader = request?.headers?.authorization;
        const [type, token] = authHeader?.split(' ') ?? [];

        if (authHeader && type !== 'Bearer') {
            throw new UnauthorizedException('Token türü Bearer olmalıdır');
        }

        let userId: string;

        if (token) {
            try {
                const payload = await this.jwtService.verifyAsync(token, {
                    secret: process.env.JWT_SECRET,
                });

                userId = payload.sub;
            } catch (e) {
                throw new UnauthorizedException(
                    'Token geçersiz veya güvenlik kontrolü esnasında hata oluştu: ' + e.toString()
                );
            }
        }

        const user: User = userId ? await this.userService.getOne(userId) : null;

        //kullanıcının izinlerini veritabanından çek
        const assignedPermissions = userId ? await user.role.rolePermissions : [];

        //gerekli izinleri tespit et
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_METADATA_NAME, [
            context.getHandler(),
            context.getClass(),
        ]);

        //izin kısıtlaması varsa detay kontrollere başla
        if (requiredPermissions && requiredPermissions.length > 0) {
            //gerekli izinlerin tamamına sahip mi
            const hasPermission = requiredPermissions.every((permission) => {
                return assignedPermissions.some((rp) => rp.permission === permission);
            });

            //izni yoksa erişemesin
            if (!hasPermission) {
                return false;
            }
        }

        //uygulamanın kalanında kullanılabilsin diye kullanıcının bilgilerini request'e koyuyorum
        request.user = user;

        //tüm kontrollerden geçtiyse izin ver erişsin
        return true;
    }
}
