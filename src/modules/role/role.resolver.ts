import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/entities/role.entity';
import { RoleService } from './role.service';

@Resolver(() => Role)
export class RoleResolver {
    constructor(private readonly roleService: RoleService) {}

    @Query(() => Role)
    async getRole(@Args('id') id: string) {
        return this.roleService.getOneById(id);
    }

    @Query(() => [Role])
    async getRoles() {
        return this.roleService.getRoles();
    }
}
