import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { Role } from '../../entities/role.entity';
import { AddUpdateRoleDto } from './dto/add-update-role.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Permissions } from 'src/providers/permissions.decorator';
import { GetRolesDTO } from './dto/get-roles.dto';
import { Permission } from 'src/constants';

@Resolver(() => Role)
@UseGuards(AuthGuard)
export class RoleResolver {
    constructor(private roleService: RoleService) {}

    @Query(() => Role, { nullable: true })
    @Permissions('RoleRead')
    async getRole(@Args('id', { type: () => String }) id: string): Promise<Role | null> {
        return this.roleService.getOneById(id);
    }

    @Query(() => [Role], { nullable: true })
    @Permissions('RoleRead')
    async getRoles(
        @Args('input', { type: () => GetRolesDTO, nullable: true })
        filters: GetRolesDTO
    ): Promise<Partial<Role>[]> {
        return this.roleService.getRolesByFilters(filters);
    }

    @Mutation(() => String)
    @Permissions('RoleCreate')
    async createRole(@Args('input') dto: AddUpdateRoleDto): Promise<string> {
        const r = await this.roleService.create(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Permissions('RoleUpdate')
    async updateRole(@Args('input') dto: AddUpdateRoleDto): Promise<string> {
        const r = await this.roleService.update(dto);
        return r?.id;
    }

    @Mutation(() => Boolean)
    @Permissions('RoleDelete')
    async deleteRole(@Args('id', { type: () => String }) id: string) {
        await this.roleService.deleteOneById(id);
        return true;
    }

    @Query(() => [String])
    getPermissions(): Permission[] {
        return this.roleService.getPermissions();
    }
}
