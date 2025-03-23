import { Field, InputType } from '@nestjs/graphql';
import { PaginationBaseDTO } from 'src/providers/pagination-base.dto';

@InputType()
export class GetUsersDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => String, { nullable: true })
    id?: string;

    @Field({ nullable: true })
    isActive?: boolean;

    @Field(() => String, { nullable: true })
    createdAtStart?: string;

    @Field(() => String, { nullable: true })
    createdAtEnd?: string;

    @Field(() => [String], { nullable: true })
    roleIds?: string[];
}
