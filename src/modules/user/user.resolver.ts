import { Resolver, ResolveField, Args, Query, Parent, Mutation, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AddUpdateUserDto } from './add-update-user.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Permissions } from 'src/providers/permissions.decorator';
import { GetUsersDTO } from './get-users.dto';
import { UserResponseDTO } from './get-user-response.dto';
@Resolver(() => User)
@UseGuards(AuthGuard)
export class UserResolver {
    constructor(
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => UserResponseDTO, { nullable: true })
    async me(@Context() context): Promise<User | null> {
        return context.req.user;
    }

    @Query(() => User, { nullable: true })
    @Permissions('UserView')
    async getUser(@Args('id', { type: () => String }) id: string): Promise<User | null> {
        return this.userService.getOneById(id);
    }

    @Query(() => [User], { nullable: true })
    @Permissions('UserView')
    async getUsers(
        @Args('filters', { type: () => GetUsersDTO, nullable: true })
        filters: GetUsersDTO
    ): Promise<Partial<User>[]> {
        const r = this.userService.getUsersByFilters(filters);
        return r;
    }

    @ResolveField('roles', () => [Role], { nullable: true })
    async getUserRoles(@Parent() user: Partial<User>): Promise<Role[]> {
        return this.roleService.findUserRoles(user.id);
    }

    @Mutation(() => String)
    @Permissions('UserMutation')
    async addUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        //throw new ManagedException("Başlamadım bile!")
        const r = await this.userService.add(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Permissions('UserMutation')
    async updateUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        const r = await this.userService.update(dto);
        return r?.id;
    }

    @Mutation(() => Boolean)
    @Permissions('UserMutation')
    async removeUser(@Args('id', { type: () => String }) id: string) {
        this.userService.removeOneById(id);
        return true;
    }
}
