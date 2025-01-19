import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AddUserDto as dto } from './add-user.dto';
import { UserRole } from 'src/entities/user-role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ){

  }

  async add(user: dto): Promise<User> {
    let ret: User;
    await this.entityManager.transaction(async (manager) => {
      ret = await manager.save(User, {
        username: user.username,
        fullName: user.fullName,
        password: await bcrypt.hash(user.password, 1)
      });
      console.log("User saved:", ret);
      for (const x of user.roles) {
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

  async removeOneById(id: string): Promise<void> {
    await this.entityManager.delete(User, {
      id: id
    })
  }

  async getOneById(id: string): Promise<User> {
    return await this.userRepository.findOne({
      where: {
        id: id
      }
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
