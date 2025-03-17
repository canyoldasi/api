import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { City } from './city.entity';
import { AccountLocation } from './account-location.entity';

@ObjectType()
@Entity()
export class Country {
    @Field()
    @PrimaryColumn()
    id: string;

    @Field()
    @Column()
    name: string;

    @Field(() => [City], { nullable: true })
    @OneToMany(() => City, (city) => city.country)
    cities?: City[];

    @Field(() => [AccountLocation], { nullable: true })
    @OneToMany(() => AccountLocation, (location) => location.country)
    accountLocations?: AccountLocation[];
}
