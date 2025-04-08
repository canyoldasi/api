import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Account } from './account.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { Country } from './country.entity';
import { District } from './district.entity';
import { Location } from './location.entity';

@Entity()
@ObjectType()
export class AccountLocation {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    code?: string;

    @ManyToOne(() => Account, (account) => account.locations)
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => Location, { nullable: true })
    @Field(() => Location, { nullable: true })
    location?: Location;

    @ManyToOne(() => Country, (country) => country.accountLocations)
    @Field(() => Country)
    country: Country;

    @ManyToOne(() => City, (city) => city.accountLocations, { nullable: true })
    @Field(() => City, { nullable: true })
    city?: City;

    @ManyToOne(() => County, (county) => county.accountLocations, { nullable: true })
    @Field(() => County, { nullable: true })
    county?: County;

    @ManyToOne(() => District, (x) => x.accountLocations, { nullable: true })
    @Field(() => District, { nullable: true })
    district?: District;

    @Column({ nullable: true })
    @Field({ nullable: true })
    postalCode?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    address?: string;

    @Column({ type: 'varchar', nullable: true })
    @Field({ nullable: true })
    latitude?: string;

    @Column({ type: 'varchar', nullable: true })
    @Field({ nullable: true })
    longitude?: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;
}
