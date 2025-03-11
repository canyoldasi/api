import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { UserResolver } from './user.resolver';
import { RoleService } from '../role/role.service';

@Module({
    controllers: [],
    providers: [UserService, UserResolver, RoleService],
    exports: [UserService, TypeOrmModule, RoleService],
    imports: [TypeOrmModule.forFeature([User, Role, UserRole])],
})
export class UserModule {}
