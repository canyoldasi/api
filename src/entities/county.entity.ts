import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { City } from './city.entity';
import { AccountLocation } from './account-location.entity';
import { District } from './district.entity';

@Entity()
@ObjectType()
export class County {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @Column()
    @Field()
    name: string;

    @ManyToOne(() => City, (city) => city.counties)
    @Field(() => City)
    city: City;

    @Column()
    @Field()
    cityId: string;

    @Field(() => [District], { nullable: true })
    @OneToMany(() => District, (district) => district.county)
    districts?: District[];

    @OneToMany(() => AccountLocation, (area) => area.county)
    @Field(() => [AccountLocation], { nullable: true })
    accountLocations?: AccountLocation[];
}
