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
import { METADATA_NAME_PERMISSIONS, METADATA_NAME_ROLES, Permission } from 'src/constants';

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

            const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(METADATA_NAME_ROLES, [
                context.getHandler(),
                context.getClass(),
            ]);
            //Eğer resolver için bir rol kısıtlaması belirtilmemişse istemci erişebilsin
            if (!requiredRoles) {
                return true;
            }

            //kullanıcının rollerini veritabanından çek
            const assignedRoles = await this.roleService.findUserRoles(userId);
            
            //kullanıcı acaba belirtilen rollerden herhangi birine sahip mi
            const hasRole = assignedRoles.some((x) => {
                return requiredRoles.find(y => String(y) === String(x.id));
            })

            //sahip değilse izin verme
            if (!hasRole) {
                throw new UnauthorizedException('Rolünüz yeterli değil.');
            }

            const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(METADATA_NAME_PERMISSIONS, [
                context.getHandler(),
                context.getClass()
            ]);

            //izin kısıtlaması yoksa bırak erişebilsin
            if (requiredPermissions.length == 0) {
                return true;
            }

            const assignedPermissions = await this.roleService.findUserPermissions(userId);

            //izinlerin tamamına sahip olmalı
            const hasPermission = assignedPermissions.every((x) => {
                return requiredPermissions.find(y => y == x)
            })

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