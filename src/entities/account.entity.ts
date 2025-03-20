import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Gender, PersonType } from '../constants';
import { Contact } from './contact.entity';
import { BaseEntity } from './base.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { AccountLocation } from './account-location.entity';
import { Country } from './country.entity';
import { District } from './district.entity';
import { User } from './user.entity';
import { AccountSegment } from './account-segment.entity';
import { AccountAccountType } from './account-account-type.entity';
import { Transaction } from './transaction.entity';

@Entity()
@ObjectType()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    @Field(() => String)
    personType: PersonType;

    @OneToMany(() => AccountAccountType, (accountAccountType) => accountAccountType.account)
    @Field(() => [AccountAccountType], { nullable: true })
    accountAccountTypes?: AccountAccountType[];

    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    firstName: string;

    @Column()
    @Field()
    lastName: string;

    @Column({ unique: true })
    @Field()
    email: string;

    @Column({ unique: true })
    @Field()
    phone: string;

    @Column()
    @Field()
    phone2: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    gender?: Gender;

    @Column({ nullable: true })
    @Field({ nullable: true })
    taxNumber?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    taxOffice?: string;

    @Column({ unique: true, nullable: true })
    @Field({ nullable: true })
    nationalId?: string;

    @ManyToOne(() => Country)
    @Field(() => Country, { nullable: true })
    country?: Country;

    @ManyToOne(() => City)
    @Field(() => City, { nullable: true })
    city?: City;

    @ManyToOne(() => County)
    @Field(() => County, { nullable: true })
    county?: County;

    @ManyToOne(() => District)
    @Field(() => District, { nullable: true })
    district?: District;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    postalCode?: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @OneToMany(() => Contact, (x) => x.account)
    @Field(() => [Contact], { nullable: true })
    contacts?: Contact[];

    @ManyToOne(() => User, { nullable: true })
    @Field(() => User, { nullable: true })
    assignedUser?: User;

    @OneToMany(() => AccountLocation, (x) => x.account)
    @Field(() => [AccountLocation], { nullable: true })
    locations?: AccountLocation[];

    @OneToMany(() => AccountSegment, (accountSegment) => accountSegment.account)
    @Field(() => [AccountSegment], { nullable: true })
    segments?: AccountSegment[];

    @OneToMany(() => Transaction, (transaction) => transaction.account)
    @Field(() => [Transaction], { nullable: true })
    transactions?: Transaction[];
}
