import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AccountService } from './account.service';
import { Account } from '../../entities/account.entity';
import { CreateUpdateAccountDTO } from './dto/create-update-account.dto';
import { GetAccountsDTO } from './dto/get-accounts.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Permissions } from '../../providers/permissions.decorator';
import { PERMISSIONS } from '../../constants';

@Resolver(() => Account)
@UseGuards(AuthGuard)
export class AccountResolver {
    constructor(private readonly accountService: AccountService) {}

    @Query(() => Account)
    @Permissions(PERMISSIONS.AccountRead)
    async getAccount(@Args('id') id: string): Promise<Account> {
        return this.accountService.getOne(id);
    }

    @Query(() => [Account])
    @Permissions(PERMISSIONS.AccountRead)
    async getAccounts(@Args('input') input: GetAccountsDTO): Promise<Account[]> {
        return this.accountService.getAccountsByFilters(input);
    }

    @Mutation(() => Account)
    @Permissions(PERMISSIONS.AccountCreate)
    async createAccount(@Args('input') input: CreateUpdateAccountDTO): Promise<Account> {
        return this.accountService.create(input);
    }

    @Mutation(() => Account)
    @Permissions(PERMISSIONS.AccountUpdate)
    async updateAccount(@Args('input') input: CreateUpdateAccountDTO): Promise<Account> {
        return this.accountService.update(input);
    }

    @Mutation(() => Boolean)
    @Permissions(PERMISSIONS.AccountDelete)
    async deleteAccount(@Args('id') id: string): Promise<boolean> {
        return this.accountService.delete(id);
    }
}
