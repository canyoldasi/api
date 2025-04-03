import { Field, InputType } from '@nestjs/graphql';
import { PaginationBaseDTO } from 'src/providers/pagination-base.dto';

@InputType()
export class GetAccountsDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => [String], { nullable: true })
    channelIds?: string[];

    @Field(() => [String], { nullable: true })
    assignedUserIds?: string[];

    @Field(() => String, { nullable: true })
    countryId?: string;

    @Field(() => [String], { nullable: true })
    cityIds?: string[];

    @Field(() => [String], { nullable: true })
    accountTypeIds?: string[];

    @Field(() => [String], { nullable: true })
    segmentIds?: string[];

    @Field(() => String, { nullable: true })
    createdAtStart?: string;

    @Field(() => String, { nullable: true })
    createdAtEnd?: string;
}
