import {
CanActivate,
ExecutionContext,
Injectable,
UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RoleService } from '../modules/user/role.service';
import { METADATA_NAME_PERMISSIONS, Permission } from 'src/constants';

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
            throw new UnauthorizedException('Token türü Bearer olmalıdır');
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                secret: process.env.JWT_SECRET
                }
            );

            const userId = payload.sub;

            //kullanıcının rollerini veritabanından çek
            const assignedRoles = await this.roleService.findUserRoles(userId);

            //gerekli izinleri tespit et
            const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(METADATA_NAME_PERMISSIONS, [
                context.getHandler(),
                context.getClass()
            ]);

            //izin kısıtlaması yoksa bırak erişebilsin
            if (requiredPermissions.length == 0) {
                return true;
            }

            //kullanıcının izinlerini veritabanından çek
            const assignedPermissions = await this.roleService.findUserPermissions(userId);

            //gerekli izinlerin tamamına sahip mi
            const hasPermission = requiredPermissions.every((permission) => {
                return assignedPermissions.includes(permission);
            });

            //izni yoksa erişemesin
            if (!hasPermission) {
                return false;
            }

            //uygulamanın kalanında kullanılabilin diye kullanıcının bilgilerini request'e koyuyorum
            request['user'] = {
                id: userId,
                roles: assignedRoles,
                permissions: assignedPermissions
            }

            //tüm kontrollerden geçtiyse izin ver erişsin
            return true;
        } catch (e) {   
            throw new UnauthorizedException('Token geçersiz veya güvenlik kontrolü esnasında hata oluştu');
        }
        return false;
    }
}