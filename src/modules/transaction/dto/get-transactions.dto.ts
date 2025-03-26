import { Field, InputType } from '@nestjs/graphql';
import { PaginationBaseDTO } from 'src/providers/pagination-base.dto';

@InputType()
export class GetTransactionsDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => String, { nullable: true })
    typeId?: string;

    @Field(() => String, { nullable: true })
    statusId?: string;

    @Field(() => String, { nullable: true })
    accountId?: string;

    @Field(() => String, { nullable: true })
    assignedUserId?: string;

    @Field(() => String, { nullable: true })
    countryId?: string;

    @Field(() => String, { nullable: true })
    createdAtStart?: string;

    @Field(() => String, { nullable: true })
    createdAtEnd?: string;

    @Field(() => String, { nullable: true })
    successDateStart?: string;

    @Field(() => String, { nullable: true })
    successDateEnd?: string;

    @Field(() => String, { nullable: true })
    cancelDateStart?: string;

    @Field(() => String, { nullable: true })
    cancelDateEnd?: string;
}
