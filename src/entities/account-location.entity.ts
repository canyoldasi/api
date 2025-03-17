import { Entity, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { Country } from './country.entity';

@Entity()
@ObjectType()
export class AccountLocation extends BaseEntity {
    @ManyToOne(() => Account, (account) => account.locations)
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => Country, (country) => country.accountLocations)
    @Field(() => Country)
    country: Country;

    @ManyToOne(() => City, (city) => city.accountLocations, { nullable: true })
    @Field(() => City, { nullable: true })
    city?: City;

    @ManyToOne(() => County, (county) => county.accountLocations, { nullable: true })
    @Field(() => County, { nullable: true })
    county?: County;
}
