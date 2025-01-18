import { Resolver, ResolveField, Args, Query, Int, Parent, Mutation} from '@nestjs/graphql'
import { UserService } from "./user.service";
import { RoleService } from "src/modules/role/role.service";
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { AddUserDto } from './add-user.dto';

@Resolver(() => User)
export class UserResolver {
    constructor (
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => User, {nullable: true})
    async getUser(@Args('id', {type: () => Int}) id: number) {
        return this.userService.getOneById(id)
    }

    @ResolveField('roles', () => [Role], {nullable: true})
    async getUserRoles(@Parent() user: User): Promise<Role[]> {
        return this.roleService.findRolesOfUser(user)
    }

    @Mutation(() => User)
    async addUser(@Args('dto') dto: AddUserDto): Promise<Partial<User>> {
        const r = await this.userService.add(dto)
        return r;
    }
}