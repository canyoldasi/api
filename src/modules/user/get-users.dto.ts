import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetUsersDTO {
    @Field({nullable: true})
    text?: string;

    @Field({nullable: true})
    isActive?: boolean;

    @Field(() => [String], {nullable: true})
    roleIds?: string[]
}