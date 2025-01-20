import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AddUpdateUserDto } from './add-update-user.dto';
import { UserRole } from '../../entities/user-role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
  ){

  }

  async add(dto: AddUpdateUserDto): Promise<User> {
    let ret: User;
    await this.entityManager.transaction(async (manager) => {
      ret = await manager.save(User, {
        username: dto.username,
        fullName: dto.fullName,
        password: await bcrypt.hash(dto.password, 1),
        
      });
      console.log("User added:", ret);
      for (const x of dto.roles) {
        await manager.save(UserRole, {
          role: {
            id: x
          },
          user: {
            id: ret.id
          }
        });
        console.log(`Role ${x} assigned to user.`);
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
        password: dto.password ? await bcrypt.hash(dto.password, 1) : existingUser.password,
      });
      console.log("User updated:", ret);

      // Remove existing roles
      await manager.delete(UserRole, { user: { id: dto.id } });

      // Assign new roles
      for (const x of dto.roles) {
        await manager.save(UserRole, {
          role: { id: x },
          user: { id: ret.id },
        });
        console.log(`Role ${x} assigned to user.`);
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

  async getAll(): Promise<User[] | undefined> {
    return this.entityManager.find(User, {
      where: {
        isActive: true
      },
      relations: {
        roles: true
      }
    })
  }
}
