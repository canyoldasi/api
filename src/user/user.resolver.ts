import { User } from "src/models/user.model";
import { Resolver, ResolveField, Args, Query, Int, Parent} from '@nestjs/graphql'
import { UserService } from "./user.service";
import { RoleService } from "src/role/role.service";
import { Role } from "src/models/role.model";

@Resolver(() => User)
export class UserResolver {
    constructor (
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => User)
    async getUser(@Args('id', {type: () => Int}) id: number) {
        return this.userService.getOneById(id)
    }

    @ResolveField('roles', () => [Role])
    async getUserRoles(@Parent() user: User): Promise<Role[]> {
        return this.roleService.findAll()
    }
}