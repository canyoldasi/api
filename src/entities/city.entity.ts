import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { County } from './county.entity';
import { AccountArea } from './account-area.entity';

@Entity()
@ObjectType()
export class City {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @Column()
    @Field()
    name: string;

    @Column({ length: 2, unique: true })
    @Field()
    code: string;

    @OneToMany(() => County, (county) => county.city)
    @Field(() => [County], { nullable: true })
    counties?: County[];

    @OneToMany(() => AccountArea, (area) => area.city)
    @Field(() => [AccountArea], { nullable: true })
    accountAreas?: AccountArea[];
}
