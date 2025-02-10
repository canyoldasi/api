import { Resolver, ResolveField, Args, Query, Int, Parent, Mutation} from '@nestjs/graphql'
import { UserService } from "./user.service";
import { RoleService } from "./role.service";
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AddUpdateUserDto } from './add-update-user.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards } from '@nestjs/common';
import { RoleEnum } from '../../providers/role.enum';
import { Roles } from '../../providers/roles.decorator';
import { ManagedException } from 'src/providers/managed.exception';
import { Permissions } from 'src/providers/permissions.decorator';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UserResolver {
    constructor (
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => User, {nullable: true})
    @Roles(RoleEnum.User, RoleEnum.Admin)
    @Permissions('UserView')
    async getUser(@Args('id', {type: () => String}) id: string): Promise<User | null> {
        return this.userService.getOneById(id);
    }

    @ResolveField('roles', () => [Role], {nullable: true})
    async getUserRoles(@Parent() user: Partial<User>): Promise<Role[]> {
        return this.roleService.findUserRoles(user.id)
    }

    @Mutation(() => String)
    @Roles(RoleEnum.Admin)
    async addUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        //throw new ManagedException("Başlamadım bile!")
        const r = await this.userService.add(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Roles(RoleEnum.Admin)
    async updateUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        const r = await this.userService.update(dto);
        return r?.id;
    }

    @Mutation(() => Boolean)
    @Roles(RoleEnum.Admin)
    async removeUser(@Args('id', {type: () => String}) id: string) {
        this.userService.removeOneById(id);
        return true
    }
}