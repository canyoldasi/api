import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { UserResolver } from './user.resolver';
import { RoleService } from 'src/modules/role/role.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserResolver, RoleService],
  exports: [UserService, TypeOrmModule, RoleService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole
    ])
  ]
})
export class UserModule {}
