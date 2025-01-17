import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Role } from './role.model';

@ObjectType()
export class User {
    @Field(type => Int, {nullable: false})
    id: number;

    @Field({nullable: false})
    username: string;

    @Field({nullable: false})
    password: string

    @Field({nullable: true})
    fullName: string;

    @Field({nullable: true, defaultValue: true})
    isActive: boolean;

    @Field(type => [Role], {nullable: true})
    roles?: Role[];
}