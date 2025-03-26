import { Module } from '@nestjs/common';
import { BookingInboxService } from './booking-inbox.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Channel } from '../../entities/channel.entity';
import { BookingInboxResolver } from './booking-inbox.resolver';
import { TransactionService } from '../transaction/transaction.service';
@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Transaction, Channel])],
    providers: [BookingInboxService, BookingInboxResolver, TransactionService],
    exports: [BookingInboxService],
})
export class BookingInboxModule {}
