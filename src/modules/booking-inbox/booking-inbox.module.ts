import { Module } from '@nestjs/common';
import { BookingInboxService } from './booking-inbox.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { BookingInboxResolver } from './booking-inbox.resolver';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Transaction])],
    providers: [BookingInboxService, BookingInboxResolver],
    exports: [BookingInboxService],
})
export class BookingInboxModule {}
