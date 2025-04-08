import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Country } from './country.entity';
import { City } from './city.entity';
import { County } from './county.entity';
import { District } from './district.entity';

@ObjectType()
@Entity()
export class Location extends BaseEntity {
    @Column()
    @Field()
    name: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    @Field({ nullable: true })
    note?: string;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @Column({ nullable: true })
    @Field({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    postalCode?: string;

    @Column({ type: 'varchar', nullable: true })
    @Field({ nullable: true })
    latitude?: string;

    @Column({ type: 'varchar', nullable: true })
    @Field({ nullable: true })
    longitude?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    phone?: string;

    @ManyToOne(() => Country, { nullable: true })
    @Field(() => Country, { nullable: true })
    country?: Country;

    @ManyToOne(() => City, { nullable: true })
    @Field(() => City, { nullable: true })
    city?: City;

    @ManyToOne(() => County, { nullable: true })
    @Field(() => County, { nullable: true })
    county?: County;

    @ManyToOne(() => District, { nullable: true })
    @Field(() => District, { nullable: true })
    district?: District;
} 