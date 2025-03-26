import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { Transaction } from './transaction.entity';

@ObjectType()
@Entity()
export class Channel extends BaseEntity {
    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    code: string;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @OneToMany(() => Account, (account) => account.channel)
    @Field(() => [Account], { nullable: true })
    accounts?: Account[];

    @OneToMany(() => Transaction, (transaction) => transaction.channel)
    @Field(() => [Transaction], { nullable: true })
    transactions?: Transaction[];
}
