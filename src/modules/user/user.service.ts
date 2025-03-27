import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUpdateUserDto } from './dto/create-update-user.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetUsersDTO } from './dto/get-users.dto';
import { PaginatedResult } from '../../types/paginated';

@Injectable()
export class UserService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async create(dto: CreateUpdateUserDto): Promise<User> {
        let ret: User;
        await this.entityManager.transaction(async (manager) => {
            ret = await manager.save(User, {
                isActive: dto.isActive,
                username: dto.username,
                fullName: dto.fullName,
                password: await bcrypt.hash(dto.password, parseInt(process.env.PASSWORD_SALT)),
                role: {
                    id: dto.roleId,
                },
            });
        });
        return ret;
    }

    async update(dto: CreateUpdateUserDto): Promise<User> {
        let ret: User;

        const existingUser = await this.entityManager.findOneBy(User, {
            id: dto.id,
        });

        await this.entityManager.transaction(async (manager) => {
            ret = await manager.save(User, {
                id: dto.id,
                isActive: dto.isActive,
                username: dto.username,
                fullName: dto.fullName,
                password: dto.password
                    ? await bcrypt.hash(dto.password, parseInt(process.env.PASSWORD_SALT))
                    : existingUser.password,
                role: {
                    id: dto.roleId,
                },
            });
            this.logger.log(`User updated: ${ret}`);
        });

        return ret;
    }

    async deleteOneById(id: string): Promise<void> {
        await this.entityManager.delete(User, {
            id: id,
        });
    }

    async getOne(id: string): Promise<User> {
        return await this.entityManager.findOne(User, {
            where: {
                id: id,
            },
            relations: ['role', 'role.rolePermissions'],
        });
    }

    async getOneByUsername(username: string): Promise<User | undefined> {
        return await this.entityManager.findOne(User, {
            where: {
                username: username,
            },
        });
    }

    async getUsersByFilters(filters: GetUsersDTO): Promise<PaginatedResult<User>> {
        const queryBuilder = this.entityManager.createQueryBuilder(User, 'user').leftJoinAndSelect('user.role', 'role');

        queryBuilder.where('user.deletedAt IS NULL');

        if (filters.id) {
            queryBuilder.andWhere('(user.id = :id)', {
                id: filters.id,
            });
        }

        if (filters.text) {
            queryBuilder.andWhere('(user.username ILIKE :text OR user.fullName ILIKE :text)', {
                text: `%${filters.text}%`,
            });
        }

        if (filters.createdAtStart) {
            queryBuilder.andWhere('user.createdAt >= :createdAtStart', {
                createdAtStart: filters.createdAtStart,
            });
        }

        if (filters.createdAtEnd) {
            queryBuilder.andWhere('user.createdAt <= :createdAtEnd', {
                createdAtEnd: filters.createdAtEnd,
            });
        }

        if (filters.isActive !== undefined) {
            queryBuilder.andWhere('user.isActive = :isActive', {
                isActive: filters.isActive,
            });
        }

        if (filters.roleIds && filters.roleIds.length > 0) {
            queryBuilder.andWhere('role.id IN (:...roleIds)', {
                roleIds: filters.roleIds,
            });
        }

        // Get total count before applying pagination
        const itemCount = await queryBuilder.getCount();

        // Calculate page count
        const pageSize = filters.pageSize || itemCount; // If no pageSize, assume all items on one page
        const pageCount = pageSize > 0 ? Math.ceil(itemCount / pageSize) : 0;

        queryBuilder.orderBy(`user.${filters.orderBy || 'fullName'}`, filters.orderDirection);

        if (filters.pageSize) {
            queryBuilder.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        const items = await queryBuilder.getMany();
        console.log('getUsersByFilters SQL:', queryBuilder.getSql());
        return { items, itemCount, pageCount };
    }
}
