import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { EntityManager, In, IsNull } from 'typeorm';
import { Permission } from 'src/constants';
import { RolePermission } from 'src/entities/role-permission.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectEntityManager()
        private entityManager: EntityManager
    ) {}

    async getRoles(): Promise<Role[]> {
        const r = await this.entityManager.find(Role, {
            where: {
                deletedAt: IsNull(),
            },
        });
        return r;
    }

    async getRolesByUser(userId: string): Promise<Role[]> {
        const userRoles = await this.entityManager.find(UserRole, {
            where: {
                user: {
                    id: userId,
                },
            },
            relations: {
                role: true,
            },
        });
        return userRoles.map((x) => x.role);
    }

    async getOneById(id: string): Promise<Role> {
        const r = await this.entityManager.findOne(Role, {
            where: {
                id: id,
            },
            relations: {
                rolePermissions: true,
            },
        });
        return r;
    }

    async findUserPermissions(userId: string): Promise<Permission[]> {
        const roles = await this.getRolesByUser(userId);
        const roleIds = roles.map((x) => {
            return x.id;
        });

        const permissions = await this.entityManager.findBy(RolePermission, {
            role: {
                id: In(roleIds),
            },
        });

        const permissionCodes = permissions.map((x) => {
            return x.permission;
        });

        return permissionCodes;
    }

    async removeByUserId(id: string) {
        await this.entityManager.delete(UserRole, {
            user: {
                id: id,
            },
        });
    }
}
