import { Entity, Column, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Gender, PersonType } from '../constants';
import { Contact } from './contact.entity';
import { Opportunity } from './opportunity.entity';
import { AccountType } from './account-type.entity';
import { BaseEntity } from './base.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { AccountLocation } from './account-location.entity';
import { Segment } from './segment.entity';
import { Country } from './country.entity';
import { District } from './district.entity';
import { User } from './user.entity';

@Entity()
@ObjectType()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    @Field(() => String)
    personType: PersonType;

    @ManyToMany(() => AccountType)
    @JoinTable({
        name: 'account_account_type',
    })
    @Field(() => [AccountType], { nullable: true })
    accountTypes?: AccountType[];

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

    @Column({ unique: true })
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

    @OneToMany(() => Opportunity, (x) => x.account)
    @Field(() => [Opportunity], { nullable: true })
    opportunities?: Opportunity[];

    @ManyToOne(() => User, { nullable: true })
    @Field(() => User, { nullable: true })
    assignedTo?: User;

    @OneToMany(() => AccountLocation, (x) => x.account)
    @Field(() => [AccountLocation], { nullable: true })
    locations?: AccountLocation[];

    @ManyToMany(() => Segment, (segment) => segment.accounts)
    @JoinTable({
        name: 'account_segment',
    })
    @Field(() => [Segment], { nullable: true })
    segments?: Segment[];
}
