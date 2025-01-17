import {ObjectType, Field, Int} from '@nestjs/graphql';

@ObjectType()
export class Role {
    @Field(type => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    code: string;
}