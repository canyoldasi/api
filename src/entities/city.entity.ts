import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { County } from './county.entity';
import { AccountLocation } from './account-location.entity';
import { Country } from './country.entity';

@Entity()
@ObjectType()
export class City {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @Column()
    @Field()
    name: string;

    @Column({ length: 2, unique: true, nullable: true })
    @Field()
    code?: string;

    @OneToMany(() => County, (county) => county.city)
    @Field(() => [County], { nullable: true })
    counties?: County[];

    @OneToMany(() => AccountLocation, (area) => area.city)
    @Field(() => [AccountLocation], { nullable: true })
    accountAreas?: AccountLocation[];

    @Field(() => Country)
    @ManyToOne(() => Country, (country) => country.cities)
    country: Country;

    @Field()
    @Column()
    countryId: string;
}
