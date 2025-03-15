import { Entity, Column, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { City } from './city.entity';
import { County } from './county.entity';

@Entity()
@ObjectType()
export class AccountArea extends BaseEntity {
    @ManyToOne(() => Account, (account) => account.areas)
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => City, (city) => city.accountAreas)
    @Field(() => City)
    city: City;

    @ManyToOne(() => County, (county) => county.accountAreas, { nullable: true })
    @Field(() => County, { nullable: true })
    county?: County;

    @Column({ default: false })
    @Field()
    isAllCounties: boolean;
}
