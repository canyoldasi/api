import { Entity, Column, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { PersonType } from '../constants';
import { Contact } from './contact.entity';
import { Opportunity } from './opportunity.entity';
import { AccountType } from './account-type.entity';
import { BaseEntity } from './base.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { AccountLocation } from './account-location.entity';

@Entity()
@ObjectType()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    @Field(() => String)
    type: PersonType;

    @ManyToMany(() => AccountType)
    @JoinTable({
        name: 'account_account_type',
    })
    @Field(() => [AccountType], { nullable: true })
    accountTypes?: AccountType[];

    // Temel Bilgiler - Hem bireysel hem kurumsal için
    @Column()
    @Field()
    name: string;

    @Column({ unique: true })
    @Field()
    email: string;

    @Column({ unique: true })
    @Field()
    phone: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    alternativePhone?: string;

    // Kurumsal müşteri bilgileri
    @Column({ nullable: true })
    @Field({ nullable: true })
    taxNumber?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    taxOffice?: string;

    // Bireysel müşteri bilgileri
    @Column({ unique: true, nullable: true })
    @Field({ nullable: true })
    nationalId?: string;

    // İletişim Bilgileri
    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    address?: string;

    @ManyToOne(() => City)
    @Field(() => City, { nullable: true })
    addressCity?: City;

    @ManyToOne(() => County)
    @Field(() => County, { nullable: true })
    addressCounty?: County;

    @Column({ nullable: true })
    @Field({ nullable: true })
    postalCode?: string;

    // Ek Bilgiler
    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    notes?: string;

    // İlişkiler
    @OneToMany(() => Contact, (contact) => contact.account)
    @Field(() => [Contact], { nullable: true })
    contacts?: Contact[];

    @OneToMany(() => Opportunity, (opportunity) => opportunity.account)
    @Field(() => [Opportunity], { nullable: true })
    opportunities?: Opportunity[];

    @Column({ nullable: true })
    @Field({ nullable: true })
    assignedTo?: string;

    // İstatistikler
    @Column({ type: 'int', default: 0 })
    @Field()
    totalOrders: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    @Field()
    totalRevenue: number;

    @Column({ type: 'timestamp', nullable: true })
    @Field({ nullable: true })
    lastOrderDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    @Field({ nullable: true })
    lastContactDate?: Date;

    // Hizmet Alanları
    @OneToMany(() => AccountLocation, (area) => area.account)
    @Field(() => [AccountLocation], { nullable: true })
    areas?: AccountLocation[];
}
