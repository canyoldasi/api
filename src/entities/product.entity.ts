import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field, Float } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { TransactionProduct } from './transaction-product.entity';

@Entity()
@ObjectType()
export class Product extends BaseEntity {
    @Column()
    @Field()
    name: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @OneToMany(() => TransactionProduct, (transactionProduct) => transactionProduct.product)
    @Field(() => [TransactionProduct], { nullable: true })
    transactionProducts?: TransactionProduct[];

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    @Field(() => Float)
    price: number;

    @Column({ default: true })
    @Field()
    isActive: boolean;
}
