import { Field, InputType, Float } from '@nestjs/graphql';
import { PaginationBaseDTO } from 'src/providers/pagination-base.dto';

@InputType()
export class GetTransactionsDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => [String], { nullable: true })
    typeIds?: string[];

    @Field(() => [String], { nullable: true })
    statusIds?: string[];

    @Field(() => [String], { nullable: true })
    channelIds?: string[];

    @Field(() => String, { nullable: true })
    accountId?: string;

    @Field(() => [String], { nullable: true })
    assignedUserIds?: string[];

    @Field(() => String, { nullable: true })
    countryId?: string;

    @Field(() => [String], { nullable: true })
    cityIds?: string[];

    @Field(() => Float, { nullable: true })
    amountStart?: number;

    @Field(() => Float, { nullable: true })
    amountEnd?: number;

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

    @Field(() => [String], { nullable: true })
    productIds?: string[];
}
