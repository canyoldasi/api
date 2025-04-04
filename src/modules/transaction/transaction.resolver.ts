import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { TransactionService } from './transaction.service';
import { Transaction } from '../../entities/transaction.entity';
import { CreateUpdateTransactionDTO } from './dto/create-update-transaction.dto';
import { GetTransactionsDTO } from './dto/get-transactions.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Permissions } from '../../providers/permissions.decorator';
import { PERMISSIONS } from '../../types/constants';
import { Paginated, PaginatedResult } from '../../types/paginated';
import { Account } from '../../entities/account.entity';
import { User } from '../../entities/user.entity';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { TransactionProduct } from '../../entities/transaction-product.entity';
import { TransactionType } from '../../entities/transaction-type.entity';
import { Channel } from '../../entities/channel.entity';
import { Currency } from '../../entities/currency.entity';

const PaginatedTransaction = Paginated(Transaction);

@Resolver(() => Transaction)
@UseGuards(AuthGuard)
export class TransactionResolver {
    constructor(private readonly transactionService: TransactionService) {}

    @Query(() => Transaction)
    @Permissions(PERMISSIONS.TransactionRead)
    async getTransaction(@Args('id') id: string): Promise<Transaction> {
        return this.transactionService.getOne(id);
    }

    @Query(() => PaginatedTransaction)
    @Permissions(PERMISSIONS.TransactionRead)
    async getTransactions(@Args('input') input: GetTransactionsDTO): Promise<PaginatedResult<Transaction>> {
        return this.transactionService.getTransactionsByFilters(input);
    }

    @Query(() => [TransactionStatus])
    async getTransactionStatusesLookup(): Promise<TransactionStatus[]> {
        return this.transactionService.getTransactionStatuses();
    }

    @Query(() => [TransactionType])
    @Permissions(PERMISSIONS.TransactionRead)
    async getTransactionTypesLookup(): Promise<TransactionType[]> {
        return this.transactionService.getTransactionTypesLookup();
    }

    @Query(() => [Channel])
    @Permissions(PERMISSIONS.TransactionRead)
    async getChannelsLookup(): Promise<Channel[]> {
        return this.transactionService.getChannelsLookup();
    }

    @Query(() => [Currency])
    @Permissions(PERMISSIONS.TransactionRead)
    async getCurrenciesLookup(): Promise<Currency[]> {
        return this.transactionService.getCurrenciesLookup();
    }

    @Mutation(() => Transaction)
    @Permissions(PERMISSIONS.TransactionCreate)
    async createTransaction(@Args('input') input: CreateUpdateTransactionDTO): Promise<Transaction> {
        return this.transactionService.create(input);
    }

    @Mutation(() => Transaction)
    @Permissions(PERMISSIONS.TransactionUpdate)
    async updateTransaction(@Args('input') input: CreateUpdateTransactionDTO): Promise<Transaction> {
        return this.transactionService.update(input);
    }

    @Mutation(() => Boolean)
    @Permissions(PERMISSIONS.TransactionDelete)
    async deleteTransaction(@Args('id') id: string): Promise<boolean> {
        return this.transactionService.delete(id);
    }

    @ResolveField('account', () => Account, { nullable: true })
    async getAccountOfTransaction(@Parent() transaction: Transaction) {
        if (transaction.account) {
            return transaction.account;
        }
        return null;
    }

    @ResolveField('assignedUser', () => User, { nullable: true })
    async getAssignedUserOfTransaction(@Parent() transaction: Transaction) {
        if (transaction.assignedUser) {
            return transaction.assignedUser;
        }
        return null;
    }

    @ResolveField('status', () => TransactionStatus, { nullable: true })
    async getStatusOfTransaction(@Parent() transaction: Transaction) {
        if (transaction.status) {
            return transaction.status;
        }
        return null;
    }

    @ResolveField('transactionProducts', () => [TransactionProduct], { nullable: true })
    async getTransactionProductsOfTransaction(@Parent() transaction: Transaction) {
        if (transaction.transactionProducts) {
            return transaction.transactionProducts;
        }
        return [];
    }

    @ResolveField('currency', () => Currency, { nullable: true })
    async getCurrencyOfTransaction(@Parent() transaction: Transaction) {
        if (transaction.currency) {
            return transaction.currency;
        }
        return null;
    }
}
