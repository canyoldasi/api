import { Field, InputType } from "@nestjs/graphql";
import { PaginationBaseDTO } from "src/providers/pagination-base.dto";

@InputType()
export class GetUsersDTO extends PaginationBaseDTO {
    @Field({nullable: true})
    text?: string;

    @Field({nullable: true})
    isActive?: boolean;

    @Field(() => [String], {nullable: true})
    roleIds?: string[]
}