import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface PaginatedResult<T> {
    items: T[];
    itemCount: number;
    pageCount: number;
}

export function Paginated<T>(classRef: Type<T>): Type<any> {
    @ObjectType({ isAbstract: true })
    abstract class PaginatedType {
        @Field(() => [classRef])
        items: T[];

        @Field(() => Int)
        itemCount: number;

        @Field(() => Int)
        pageCount: number;
    }

    return PaginatedType as Type<any>;
}
