import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from 'src/entities/role-permission.entity';
import { Role } from 'src/entities/role.entity';
import { RoleResolver } from './role.resolver';
import { UserModule } from '../user/user.module';

@Module({
    controllers: [],
    providers: [RoleService, RoleResolver],
    exports: [RoleService],
    imports: [TypeOrmModule.forFeature([Role, RolePermission]), UserModule],
})
export class RoleModule {}
