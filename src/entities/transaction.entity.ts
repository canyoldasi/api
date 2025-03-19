import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Account } from './account.entity';
import { TransactionType } from '../constants';
import { BaseEntity } from './base.entity';
import { TransactionStatus } from './transaction-status.entity';

@ObjectType()
@Entity()
export class Transaction extends BaseEntity {
    @ManyToOne(() => Account, (account) => account.transactions, { nullable: true })
    @Field(() => Account, { nullable: true })
    account?: Account;

    @Column()
    @Field(() => String)
    type: TransactionType;

    @ManyToOne(() => TransactionStatus)
    @Field(() => TransactionStatus)
    status: TransactionStatus;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    @Field()
    amount: number;

    @Column({ nullable: true })
    @Field({ nullable: true })
    details?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    referenceNumber?: string;

    @Column({ type: 'timestamptz', nullable: true })
    @Field({ nullable: true })
    scheduledDate?: Date;

    @Column({ nullable: true })
    @Field({ nullable: true })
    cancelReason?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    notes?: string;

    // STK'ya özel alanlar
    @Column({ nullable: true })
    @Field({ nullable: true })
    campaignId?: string;

    // Taşımacılığa özel alanlar
    @Column({ nullable: true })
    @Field({ nullable: true })
    routeId?: string;

    @Column({ nullable: true, type: 'int' })
    @Field({ nullable: true })
    passengerCount?: number;
}
