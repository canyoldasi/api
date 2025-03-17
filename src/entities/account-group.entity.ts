import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';

@ObjectType()
@Entity()
export class AccountGroup {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    name: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    note?: string;

    @Field(() => [Account], { nullable: true })
    @ManyToMany(() => Account, (account) => account.accountGroups)
    accounts?: Account[];
}
