import { Resolver, ResolveField, Args, Query, Parent, Mutation } from '@nestjs/graphql';
import { UserService } from './user.service';
import { RoleService } from '../role/role.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { CreateUpdateUserDto } from './dto/create-update-user.dto';
import { AuthGuard } from '../../providers/auth.guard';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { Permissions } from 'src/providers/permissions.decorator';
import { GetUsersDTO } from './dto/get-users.dto';
import { Paginated, PaginatedResult } from '../../types/paginated';
import { GetLookupDTO } from '../../types/lookup.dto';

const PaginatedUser = Paginated(User);

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
        return this.userService.getOne(id);
    }

    @Query(() => PaginatedUser, { nullable: true })
    @Permissions('UserRead')
    async getUsers(
        @Args('input', { type: () => GetUsersDTO, nullable: true })
        filters: GetUsersDTO
    ): Promise<PaginatedResult<User>> {
        return this.userService.getUsersByFilters(filters);
    }

    //TODO: Login olmayan kullanıcılar erişemeyecek. @Permissions('') olabilir örneğin.
    @Query(() => PaginatedUser, { nullable: true })
    async getUsersLookup(
        @Args('input', { type: () => GetLookupDTO, nullable: true })
        filters: GetLookupDTO
    ): Promise<PaginatedResult<User>> {
        return this.userService.getUsersByFilters({
            ...(filters?.id && { id: filters.id }),
            ...(filters?.text && { text: filters.text }),
            ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
            pageSize: filters?.pageSize || 10000,
            pageIndex: filters?.pageIndex || 0,
        });
    }

    @ResolveField('role', () => Role, { nullable: true })
    async getUserRole(@Parent() user: Partial<User>): Promise<Role> {
        return this.roleService.getOneById(user.role.id);
    }

    @Mutation(() => String)
    @Permissions('UserCreate')
    async createUser(@Args('input') dto: CreateUpdateUserDto): Promise<string> {
        // Validate that password is provided for create operation
        if (!dto.password) {
            throw new BadRequestException('Password is required for user creation');
        }

        const r = await this.userService.create(dto);
        return r?.id;
    }

    @Mutation(() => String)
    @Permissions('UserUpdate')
    async updateUser(@Args('input') dto: CreateUpdateUserDto): Promise<string> {
        // For update, password is optional
        // If not provided, the service will keep the existing password
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
