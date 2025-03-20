import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Account } from './account.entity';
import { TransactionType } from '../constants';
import { BaseEntity } from './base.entity';
import { TransactionStatus } from './transaction-status.entity';
import { TransactionProduct } from './transaction-product.entity';
import { User } from './user.entity';

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

    @ManyToOne(() => User, (user) => user.assignedTransactions, { nullable: true })
    @Field(() => User, { nullable: true })
    assignedUser?: User;

    @OneToMany(() => TransactionProduct, (transactionProduct) => transactionProduct.transaction)
    @Field(() => [TransactionProduct], { nullable: true })
    transactionProducts?: TransactionProduct[];

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    @Field()
    amount: number;

    @Column({ nullable: true })
    @Field({ nullable: true })
    details?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    referenceNumber?: string;

    @Column({ type: 'date', nullable: true })
    @Field({ nullable: true })
    closedDate?: Date;

    @Column({ nullable: true })
    @Field({ nullable: true })
    cancelNote?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    successNote?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    note?: string;

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
