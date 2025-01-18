import { Resolver, ResolveField, Args, Query, Int, Parent} from '@nestjs/graphql'
import { UserService } from "./user.service";
import { RoleService } from "src/modules/role/role.service";
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';

@Resolver(() => User)
export class UserResolver {
    constructor (
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => User, {nullable: true})
    async user(@Args('id', {type: () => Int}) id: number) {
        return this.userService.getOneById(id)
    }

    @ResolveField('roles', () => [Role], {nullable: true})
    async getUserRoles(@Parent() user: User): Promise<Role[]> {
        return this.roleService.findRolesOfUser(user)
    }
}