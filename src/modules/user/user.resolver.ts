import { Resolver, ResolveField, Args, Query, Parent, Mutation } from '@nestjs/graphql';
import { UserService } from './user.service';
import { RoleService } from '../role/role.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AddUpdateUserDto } from './add-update-user.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Permissions } from 'src/providers/permissions.decorator';
import { GetUsersDTO } from './get-users.dto';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UserResolver {
    constructor(
        private userService: UserService,
        private roleService: RoleService
    ) {}

    @Query(() => User, { nullable: true })
    @Permissions('UserRead')
    async getUser(@Args('id') id: string): Promise<User> {
        return this.userService.getOneById(id);
    }

    @Query(() => [User], { nullable: true })
    @Permissions('UserRead')
    async getUsers(
        @Args('dto', { type: () => GetUsersDTO, nullable: true })
        filters: GetUsersDTO
    ): Promise<Partial<User>[]> {
        return this.userService.getUsersByFilters(filters);
    }

    @ResolveField('roles', () => [Role], { nullable: true })
    async getUserRoles(@Parent() user: Partial<User>): Promise<Role[]> {
        return this.roleService.getRolesByUser(user.id);
    }

    @Mutation(() => String)
    @Permissions('UserCreate')
    async createUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        const r = await this.userService.create(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Permissions('UserUpdate')
    async updateUser(@Args('dto') dto: AddUpdateUserDto): Promise<string> {
        const r = await this.userService.update(dto);
        return r?.id;
    }

    @Mutation(() => Boolean)
    @Permissions('UserDelete')
    async deleteUser(@Args('id', { type: () => String }) id: string) {
        this.userService.deleteOneById(id);
        return true;
    }
}
