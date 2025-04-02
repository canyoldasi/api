import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity()
export class Currency {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ length: 50 })
    name: string;

    @Field()
    @Column({ length: 3 })
    code: string;

    @Field()
    @Column({ length: 5 })
    symbol: string;

    @Field(() => [Transaction], { nullable: true })
    @OneToMany(() => Transaction, (transaction) => transaction.currency)
    transactions: Transaction[];
}
