import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class PaginationBaseDTO {
    @Field({nullable: true})
    pageIndex?: number = 0;

    @Field({nullable: true})
    pageSize?: number = 10;

    @Field({nullable: true})
    orderBy?: string;

    @Field({nullable: true})
    orderDirection?: 'ASC' | 'DESC' = 'ASC';
}