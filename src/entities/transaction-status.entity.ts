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

    @Column({ type: 'int' })
    @Field()
    sequence: number;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @Column({ default: false })
    @Field()
    isSuccess: boolean;

    @Column({ default: false })
    @Field()
    isCancel: boolean;

    @OneToMany(() => Transaction, (transaction) => transaction.status)
    transactions: Transaction[];
}
