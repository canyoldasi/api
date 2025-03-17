import { Entity, Column, ManyToMany } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { AccountTypeCode } from '../constants';
@Entity()
@ObjectType()
export class AccountType extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    @Field(() => String)
    code: AccountTypeCode;

    @Column()
    @Field()
    name: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @ManyToMany(() => Account, (account) => account.accountTypes)
    @Field(() => [Account], { nullable: true })
    accounts?: Account[];
}
