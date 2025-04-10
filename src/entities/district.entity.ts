import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { County } from './county.entity';
import { AccountLocation } from './account-location.entity';

@ObjectType()
@Entity()
export class District {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    name: string;

    @Field(() => County)
    @ManyToOne(() => County, (county) => county.districts)
    county: County;

    @Field()
    @Column()
    countyId: string;

    @OneToMany(() => AccountLocation, (x) => x.district)
    @Field(() => [AccountLocation], { nullable: true })
    accountLocations?: AccountLocation[];
}
