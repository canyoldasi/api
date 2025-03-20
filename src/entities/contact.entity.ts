import { Entity, Column, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Account } from './account.entity';
import { BaseEntity } from './base.entity';

@Entity()
@ObjectType()
export class Contact extends BaseEntity {
    @Column()
    @Field()
    firstName: string;

    @Column()
    @Field()
    lastName: string;

    @Column()
    @Field()
    email: string;

    @Column()
    @Field()
    mobilePhone: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    alternativePhone?: string;

    @Column()
    @Field()
    role: string; // Örn: "Satın Alma Müdürü", "Muhasebe Yetkilisi"

    @Column({ default: true })
    @Field()
    isPrimary: boolean; // Ana iletişim kişisi mi?

    @ManyToOne(() => Account, (account) => account.contacts)
    @Field(() => Account)
    account: Account;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;
}
