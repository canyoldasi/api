import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { City } from './city.entity';
import { AccountArea } from './account-area.entity';

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

    @OneToMany(() => AccountArea, (area) => area.county)
    @Field(() => [AccountArea], { nullable: true })
    accountAreas?: AccountArea[];
}
