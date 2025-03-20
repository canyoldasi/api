import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Product } from './product.entity';

@Entity()
@ObjectType()
export class TransactionProduct {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => String)
    id: string;

    @ManyToOne(() => Transaction, (transaction) => transaction.transactionProducts)
    @Field(() => Transaction)
    transaction: Transaction;

    @ManyToOne(() => Product, (product) => product.transactionProducts)
    @Field(() => Product)
    product: Product;

    @Column({ type: 'integer', default: 1 })
    @Field(() => Int)
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    @Field(() => Float, { nullable: true })
    unitPrice?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    @Field(() => Float, { nullable: true })
    totalPrice?: number;
}
