import { Module } from '@nestjs/common';
import { BookingInboxService } from './booking-inbox.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Channel } from '../../entities/channel.entity';
import { BookingInboxResolver } from './booking-inbox.resolver';
import { TransactionService } from '../transaction/transaction.service';
import { AccountModule } from '../account/account.module';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Transaction, Channel]), AccountModule],
    providers: [BookingInboxService, BookingInboxResolver, TransactionService],
    exports: [BookingInboxService],
})
export class BookingInboxModule {}
