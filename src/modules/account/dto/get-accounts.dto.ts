import { Field, InputType } from '@nestjs/graphql';
import { PaginationBaseDTO } from 'src/providers/pagination-base.dto';
import { Gender, PersonType } from '../../../constants';

@InputType()
export class GetAccountsDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => String, { nullable: true })
    type?: PersonType;

    @Field(() => String, { nullable: true })
    gender?: Gender;

    @Field(() => String, { nullable: true })
    assignedUserId?: string;

    @Field(() => String, { nullable: true })
    countryId?: string;

    @Field(() => String, { nullable: true })
    cityId?: string;

    @Field(() => String, { nullable: true })
    countyId?: string;

    @Field(() => String, { nullable: true })
    districtId?: string;

    @Field(() => [String], { nullable: true })
    accountTypeIds?: string[];

    @Field(() => [String], { nullable: true })
    segmentIds?: string[];

    @Field(() => String, { nullable: true })
    createdAtStart?: string;

    @Field(() => String, { nullable: true })
    createdAtEnd?: string;
}
