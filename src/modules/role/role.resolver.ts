import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/entities/role.entity';
import { RoleService } from './role.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Permissions } from 'src/providers/permissions.decorator';
import { PERMISSIONS } from 'src/constants';

@Resolver(() => Role)
@UseGuards(AuthGuard)
export class RoleResolver {
    constructor(private readonly roleService: RoleService) {}

    @Query(() => Role, { nullable: true })
    @Permissions(PERMISSIONS.RoleView)
    async getRole(@Args('id', { type: () => String }) id: string): Promise<Role | null> {
        return this.roleService.getOneById(id);
    }

    @Query(() => [Role], { nullable: true })
    @Permissions(PERMISSIONS.RoleView)
    async getRoles(): Promise<Role[]> {
        return this.roleService.getRoles();
    }
}
