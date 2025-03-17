import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { UserResolver } from './user.resolver';
import { RoleService } from '../role/role.service';

@Module({
    controllers: [],
    providers: [UserService, UserResolver, RoleService, UserService],
    exports: [UserService, TypeOrmModule, RoleService],
    imports: [TypeOrmModule.forFeature([User, Role])],
})
export class UserModule {}
