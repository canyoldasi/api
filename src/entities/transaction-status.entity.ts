import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@ObjectType()
@Entity()
export class TransactionStatus {
    @PrimaryGeneratedColumn('uuid')
    @Field()
    id: string;

    @Column()
    @Field()
    name: string;

    @Column({ nullable: true, unique: true })
    @Field({ nullable: true })
    code?: string;

    @OneToMany(() => Transaction, (transaction) => transaction.status)
    transactions: Transaction[];
}
