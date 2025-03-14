import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { Role } from '../../entities/role.entity';
import { AddUpdateRoleDto } from './add-update-role.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Permissions } from 'src/providers/permissions.decorator';
import { GetRolesDTO } from './get-roles.dto';

@Resolver(() => Role)
@UseGuards(AuthGuard)
export class RoleResolver {
    constructor(private roleService: RoleService) {}

    @Query(() => Role, { nullable: true })
    @Permissions('RoleView')
    async getRole(@Args('id', { type: () => String }) id: string): Promise<Role | null> {
        return this.roleService.getOneById(id);
    }

    @Query(() => [Role], { nullable: true })
    @Permissions('RoleView')
    async getRoles(
        @Args('dto', { type: () => GetRolesDTO, nullable: true })
        filters: GetRolesDTO
    ): Promise<Partial<Role>[]> {
        return this.roleService.getRolesByFilters(filters);
    }

    @Mutation(() => String)
    @Permissions('RoleMutation')
    async addRole(@Args('dto') dto: AddUpdateRoleDto): Promise<string> {
        const r = await this.roleService.add(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Permissions('RoleMutation')
    async updateRole(@Args('dto') dto: AddUpdateRoleDto): Promise<string> {
        const r = await this.roleService.update(dto);
        return r?.id;
    }

    @Mutation(() => Boolean)
    @Permissions('RoleMutation')
    async removeRole(@Args('id', { type: () => String }) id: string) {
        await this.roleService.removeOneById(id);
        return true;
    }
}
