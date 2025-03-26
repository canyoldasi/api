import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Account } from './account.entity';
import { BaseEntity } from './base.entity';
import { TransactionStatus } from './transaction-status.entity';
import { TransactionProduct } from './transaction-product.entity';
import { User } from './user.entity';
import { TransactionType } from './transaction-type.entity';
import { City } from './city.entity';
import { Country } from './country.entity';
import { County } from './county.entity';
import { District } from './district.entity';
import { Channel } from './channel.entity';

@ObjectType()
@Entity()
export class Transaction extends BaseEntity {
    @Column({ nullable: true })
    @Field({ nullable: true })
    externalReferenceId?: string;

    @ManyToOne(() => Channel, (channel) => channel.transactions, { nullable: true })
    @Field(() => Channel, { nullable: true })
    channel?: Channel;

    @ManyToOne(() => Account, (account) => account.transactions, { nullable: true })
    @Field(() => Account, { nullable: true })
    account?: Account;

    @ManyToOne(() => TransactionType, (type) => type.transactions, { nullable: true })
    @Field(() => TransactionType, { nullable: true })
    type?: TransactionType;

    @ManyToOne(() => TransactionStatus)
    @Field(() => TransactionStatus, { nullable: true })
    status?: TransactionStatus;

    @ManyToOne(() => User, (user) => user.assignedTransactions, { nullable: true })
    @Field(() => User, { nullable: true })
    assignedUser?: User;

    @OneToMany(() => TransactionProduct, (transactionProduct) => transactionProduct.transaction)
    @Field(() => [TransactionProduct], { nullable: true })
    transactionProducts?: TransactionProduct[];

    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
    @Field({ nullable: true })
    amount?: number;

    @Column({ type: 'timestamp', nullable: true })
    @Field({ nullable: true })
    transactionDate?: Date;

    @ManyToOne(() => Country)
    @Field(() => Country, { nullable: true })
    country?: Country;

    @ManyToOne(() => City)
    @Field(() => City, { nullable: true })
    city?: City;

    @ManyToOne(() => County)
    @Field(() => County, { nullable: true })
    county?: County;

    @ManyToOne(() => District)
    @Field(() => District, { nullable: true })
    district?: District;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    postalCode?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    no?: string;

    @Column({ type: 'timestamp', nullable: true })
    @Field({ nullable: true })
    successDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    @Field({ nullable: true })
    cancelDate?: Date;

    @Column({ nullable: true })
    @Field({ nullable: true })
    cancelNote?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    successNote?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    note?: string;
}
