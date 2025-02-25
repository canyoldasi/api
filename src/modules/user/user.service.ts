import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { EntityManager, FindOptionsWhere, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AddUpdateUserDto } from './add-update-user.dto';
import { UserRole } from '../../entities/user-role.entity';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { ManagedException } from '../../providers/managed.exception';
import { GetUsersDTO } from './get-users.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(EntityManager) private entityManager: EntityManager,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger
  ){

  }

  async add(dto: AddUpdateUserDto): Promise<User> {
    let ret: User;
    await this.entityManager.transaction(async (manager) => {
      ret = await manager.save(User, {
        username: dto.username,
        fullName: dto.fullName,
        password: await bcrypt.hash(dto.password, parseInt(process.env.PASSWORD_SALT)),
      });

      //throw new ManagedException("Bu managed hata bildirilir", true)
      //this.logger.log(`User added: ${ret}`);
      for (const x of dto.roles) {
        await manager.save(UserRole, {
          role: {
            id: x
          },
          user: {
            id: ret.id
          }
        });
        this.logger.log(`Role ${x} assigned to user.`);
      }
    });
    return ret;
  }

  async update(dto: AddUpdateUserDto): Promise<User> {
    let ret: User;
 
    const existingUser = await this.entityManager.findOneBy(User, { id: dto.id });

    await this.entityManager.transaction(async (manager) => {

      ret = await manager.save(User, {
        id: dto.id,  // Update user by id
        username: dto.username,
        fullName: dto.fullName,
        password: dto.password ? await bcrypt.hash(dto.password, parseInt(process.env.PASSWORD_SALT)) : existingUser.password,
      });
      this.logger.log(`User updated: ${ret}`);

      // Remove existing roles
      await manager.delete(UserRole, { user: { id: dto.id } });

      // Assign new roles
      for (const x of dto.roles) {
        await manager.save(UserRole, {
          role: { id: x },
          user: { id: ret.id },
        });
        this.logger.log(`Role ${x} assigned to user.`);
      }
    });

    return ret;
  }

  async removeOneById(id: string): Promise<void> {
    await this.entityManager.delete(User, {
      id: id
    })
  }

  async getOneById(id: string): Promise<User> {
    return await this.entityManager.findOneBy(User, {
      id: id
    })
  }

  async getOneByUsername(username: string): Promise<User | undefined> {
    return await this.entityManager.findOne(User, {
      where: {
        username: username
      }
    })
  }

  async getUsersByFilters(filters: GetUsersDTO): Promise<User[] | undefined> {
    const queryBuilder = this.entityManager.createQueryBuilder(User, 'user');

    queryBuilder.where('user.deletedAt IS NULL');

    if (filters.text) {
      queryBuilder.andWhere('(user.username LIKE :text OR user.fullName LIKE :text)', { text: `%${filters.text}%` });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.roleIds && filters.roleIds.length > 0) {
      queryBuilder.andWhere('user.id IN (SELECT user_role.userId FROM user_role WHERE user_role.roleId IN (:...roleIds))', { roleIds: filters.roleIds });
    }

    queryBuilder.orderBy(filters.orderBy || 'user.fullName', filters.orderDirection);

    queryBuilder.skip(filters.pageIndex * filters.pageSize).take(filters.pageSize);

    const r = await queryBuilder.getMany();
    return r;
  }
}
