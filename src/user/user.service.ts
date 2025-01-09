import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserCreateDto } from './user-create.dto';

@Injectable()
export class UserService {
  private readonly users: User[] ;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectEntityManager()
    private entityManager: EntityManager
  ){

  }

  async add(user: UserCreateDto): Promise<User> {
    const userToSave = this.entityManager.create(User, {
      username: user.username,
      fullName: user.fullName,
      password: await bcrypt.hash(user.password, 1)
    });
    await this.entityManager.save(userToSave);
    return new User()
  }

  async getOneById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: {
        id: id
      }
    })
  }

  async getOneByUsername(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: {
        username: username
      }
    })
  }

  async removeOneById(id: number): Promise<boolean> {
    await this.userRepository.delete({
      id: id
    });
    return true;
  }

  async getAll(): Promise<User[] | undefined> {
    return this.userRepository.find()
  }
}
