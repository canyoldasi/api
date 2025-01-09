import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly users: User[] ;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource
  ){

  }

  async findOne(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: {
        username: username
      }
    })
  }
}
