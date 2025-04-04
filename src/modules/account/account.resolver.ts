import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AccountService } from './account.service';
import { Account } from '../../entities/account.entity';
import { CreateUpdateAccountDTO } from './dto/create-update-account.dto';
import { GetAccountsDTO } from './dto/get-accounts.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Permissions } from '../../providers/permissions.decorator';
import { PERMISSIONS } from '../../types/constants';
import { Segment } from '../../entities/segment.entity';
import { AccountType } from '../../entities/account-type.entity';
import { Paginated, PaginatedResult } from '../../types/paginated';
import { Contact } from '../../entities/contact.entity';
import { Transaction } from '../../entities/transaction.entity';

const PaginatedAccount = Paginated(Account);

@Resolver(() => Account)
@UseGuards(AuthGuard)
export class AccountResolver {
    constructor(private readonly accountService: AccountService) {}

    @Query(() => Account)
    @Permissions(PERMISSIONS.AccountRead)
    async getAccount(@Args('id') id: string): Promise<Account> {
        return this.accountService.getOne(id);
    }

    @Query(() => PaginatedAccount)
    @Permissions(PERMISSIONS.AccountRead)
    async getAccounts(@Args('input') input: GetAccountsDTO): Promise<PaginatedResult<Account>> {
        return this.accountService.getAccountsByFilters(input);
    }

    @Query(() => [AccountType])
    async getAccountTypesLookup(): Promise<AccountType[]> {
        return this.accountService.getAccountTypesLookup();
    }

    @Query(() => [Segment])
    async getSegmentsLookup(): Promise<Segment[]> {
        return this.accountService.getSegmentsLookup();
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

    @ResolveField('segments', () => [Segment], { nullable: true })
    async getSegmentsOfAccount(@Parent() account: Account) {
        if (account.segments) {
            return account.segments.map((as) => as.segment);
        }
        return [];
    }

    @ResolveField('accountTypes', () => [AccountType], { nullable: true })
    async getAccountTypesOfAccount(@Parent() account: Account) {
        if (account.accountAccountTypes) {
            return account.accountAccountTypes.map((aat) => aat.accountType);
        }
        return [];
    }

    @ResolveField('contacts', () => [Contact], { nullable: true })
    async getContactsOfAccount(@Parent() account: Account) {
        if (account.contacts) {
            return account.contacts;
        }
        return [];
    }

    @ResolveField('transactions', () => [Transaction], { nullable: true })
    async getTransactionsOfAccount(@Parent() account: Account) {
        if (account.transactions) {
            return account.transactions;
        }
        return [];
    }
}
