import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity()
@ObjectType()
export class TransactionType {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => String)
    id: string;

    @Column({ unique: true })
    @Field(() => String)
    code: string;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @Column({ type: 'int', default: 0, nullable: true })
    @Field({ nullable: true, defaultValue: 0 })
    sequence: number;

    @Column()
    @Field(() => String)
    name: string;

    @Column({ nullable: true })
    @Field(() => String, { nullable: true })
    note?: string;

    @OneToMany(() => Transaction, (transaction) => transaction.type)
    @Field(() => [Transaction])
    transactions: Transaction[];
}
