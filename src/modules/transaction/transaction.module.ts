import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionResolver } from './transaction.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { TransactionProduct } from '../../entities/transaction-product.entity';
import { User } from '../../entities/user.entity';
import { Account } from '../../entities/account.entity';
import { UserService } from '../user/user.service';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, TransactionStatus, TransactionProduct, User, Account])],
    providers: [TransactionService, TransactionResolver, UserService],
    exports: [TransactionService],
})
export class TransactionModule {}
