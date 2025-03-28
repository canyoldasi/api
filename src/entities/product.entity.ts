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

    @Column()
    @Field({ nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @OneToMany(() => TransactionProduct, (transactionProduct) => transactionProduct.product)
    @Field(() => [TransactionProduct], { nullable: true })
    transactionProducts?: TransactionProduct[];

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    @Field(() => Float, { nullable: true })
    price?: number;

    @Column({ default: true })
    @Field({ nullable: true })
    isActive?: boolean;

    @Column({ type: 'int', default: 0, nullable: true })
    @Field({ nullable: true, defaultValue: 0 })
    sequence: number;
}
