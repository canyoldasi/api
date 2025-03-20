import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface PaginatedResult<T> {
    items: T[];
    itemCount: number;
    pageCount: number;
}

export function Paginated<T>(classRef: Type<T>): Type<any> {
    // Get the name of the class being paginated
    const typeName = classRef.name;

    // Create a unique name for this paginated type
    @ObjectType(`Paginated${typeName}`)
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
