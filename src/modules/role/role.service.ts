import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../entities/role.entity';
import { EntityManager } from 'typeorm';
import { Permission, PERMISSIONS } from 'src/types/constants';
import { RolePermission } from 'src/entities/role-permission.entity';
import { AddUpdateRoleDto } from './dto/add-update-role.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetRolesDTO } from './dto/get-roles.dto';

@Injectable()
export class RoleService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

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

    async create(dto: AddUpdateRoleDto): Promise<Role> {
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

    async deleteOneById(id: string): Promise<void> {
        await this.entityManager.update(
            Role,
            { id: id },
            {
                deletedAt: new Date(),
            }
        );
    }

    async getRolesByFilters(filters: GetRolesDTO): Promise<Role[] | undefined> {
        const queryBuilder = this.entityManager
            .createQueryBuilder(Role, 'role')
            .leftJoinAndSelect('role.rolePermissions', 'rp');

        queryBuilder.where('role.deletedAt IS NULL');

        if (filters.text) {
            queryBuilder.andWhere('role.name ILIKE :text', {
                text: `%${filters.text}%`,
            });
        }
        ///TODO: Bu kısımda hata var.
        /*
        if (filters.permissions && filters.permissions.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM role_permission rp2 WHERE rp2.role_id = role.id AND rp2.permission IN (:...permissions))',
                { permissions: filters.permissions }
            );
        }
        */

        queryBuilder.orderBy(`role.${filters.orderBy || 'name'}`, filters.orderDirection || 'ASC');

        if (filters.pageSize) {
            queryBuilder.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        return await queryBuilder.getMany();
    }

    getPermissions(): Permission[] {
        return Object.values(PERMISSIONS);
    }
}
