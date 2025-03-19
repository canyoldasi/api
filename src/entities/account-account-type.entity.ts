import { Field, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { AccountType } from './account-type.entity';

@ObjectType()
@Entity()
export class AccountAccountType {
    @PrimaryGeneratedColumn('uuid')
    @Field()
    id: string;

    @ManyToOne(() => Account, (account) => account.accountAccountTypes, {
        onDelete: 'CASCADE',
    })
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => AccountType, (accountType) => accountType.accountAccountTypes, {
        onDelete: 'CASCADE',
    })
    @Field(() => AccountType)
    accountType: AccountType;
}
