import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Account } from './account.entity';
import { OpportunityStatus } from './opportunity-status.entity';
import { Product } from './product.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity()
@ObjectType()
export class Opportunity extends BaseEntity {
    @ManyToOne(() => OpportunityStatus)
    @Field(() => OpportunityStatus)
    status: OpportunityStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    @Field(() => Float)
    amount: number;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @Column({ type: 'date', nullable: true })
    @Field({ nullable: true })
    expectedCloseDate?: Date;

    @Column({ type: 'date', nullable: true })
    @Field({ nullable: true })
    closedDate?: Date;

    @ManyToMany(() => Product)
    @JoinTable({ name: 'opportunity_product' })
    @Field(() => [Product])
    products: Product[];

    @ManyToOne(() => Account, (account) => account.opportunities)
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => User, { nullable: true })
    @Field(() => User, { nullable: true })
    assignedTo?: User;
}
