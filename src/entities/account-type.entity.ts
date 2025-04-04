import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { AccountAccountType } from './account-account-type.entity';
import { AccountTypeCode } from '../types/constants';

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

    @OneToMany(() => AccountAccountType, (accountAccountType) => accountAccountType.accountType)
    @Field(() => [AccountAccountType], { nullable: true })
    accountAccountTypes?: AccountAccountType[];
}
