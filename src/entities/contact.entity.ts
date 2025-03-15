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
    phone: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    alternativePhone?: string;

    @Column()
    @Field()
    role: string; // Örn: "Satın Alma Müdürü", "Muhasebe Yetkilisi"

    @Column({ default: false })
    @Field()
    isPrimary: boolean; // Ana iletişim kişisi mi?

    // İlişkiler
    @ManyToOne(() => Account, (account) => account.contacts)
    @Field(() => Account)
    account: Account;

    // Ek Bilgiler
    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    notes?: string;
}
