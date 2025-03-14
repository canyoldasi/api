import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { EntityManager, In, IsNull } from 'typeorm';
import { Permission } from 'src/constants';
import { RolePermission } from 'src/entities/role-permission.entity';
import { AddUpdateRoleDto } from './add-update-role.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetRolesDTO } from './get-roles.dto';

@Injectable()
export class RoleService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

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

    async add(dto: AddUpdateRoleDto): Promise<Role> {
        let ret: Role;
        await this.entityManager.transaction(async (manager) => {
            ret = await manager.save(Role, {
                name: dto.name,
            });

            for (const permission of dto.permissions) {
                await manager.save(RolePermission, {
                    role: {
                        id: ret.id,
                    },
                    permission: permission,
                });
                this.logger.log(`Permission ${permission} assigned to role.`);
            }
        });
        return ret;
    }

    async update(dto: AddUpdateRoleDto): Promise<Role> {
        let ret: Role;

        await this.entityManager.transaction(async (manager) => {
            ret = await manager.save(Role, {
                id: dto.id,
                name: dto.name,
            });
            this.logger.log(`Role updated: ${ret}`);

            // Remove existing permissions
            await manager.delete(RolePermission, { role: { id: dto.id } });

            // Assign new permissions
            for (const permission of dto.permissions) {
                await manager.save(RolePermission, {
                    role: { id: ret.id },
                    permission: permission,
                });
                this.logger.log(`Permission ${permission} assigned to role.`);
            }
        });

        return ret;
    }

    async removeOneById(id: string): Promise<void> {
        await this.entityManager.update(
            Role,
            { id: id },
            {
                deletedAt: new Date(),
            }
        );
    }

    async getRolesByFilters(filters: GetRolesDTO): Promise<Role[] | undefined> {
        const queryBuilder = this.entityManager.createQueryBuilder(Role, 'role');

        queryBuilder.leftJoinAndSelect('role.rolePermissions', 'rolePermissions');
        queryBuilder.where('role.deletedAt IS NULL');

        if (filters.text) {
            queryBuilder.andWhere('role.name ILIKE :text', {
                text: `%${filters.text}%`,
            });
        }

        if (filters.permissions && filters.permissions.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM role_permission rp WHERE rp."roleId" = role.id AND rp.permission IN (:...permissions))',
                { permissions: filters.permissions }
            );
        }

        queryBuilder.orderBy(filters.orderBy || 'role.name', filters.orderDirection || 'ASC');
        queryBuilder.skip(filters.pageIndex * filters.pageSize).take(filters.pageSize);

        return await queryBuilder.getMany();
    }
}
