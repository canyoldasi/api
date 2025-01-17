import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import {ObjectType, Field, Int} from '@nestjs/graphql';

@Entity()
@ObjectType()
export class Role {
    @PrimaryColumn()
    @Field(type => Int)
    id: number;

    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    code: string;

    @OneToMany(() => User, (x) => x.roles)
    users?: User[]
}