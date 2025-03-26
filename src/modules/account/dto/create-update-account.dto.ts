import { Field, InputType } from '@nestjs/graphql';
import { Gender, PersonType } from '../../../constants';
import { CreateUpdateAccountLocationDTO } from 'src/modules/account/dto/create-update-account-location.dto';

@InputType()
export class CreateUpdateAccountDTO {
    @Field({ nullable: true })
    id?: string;

    @Field(() => String, { nullable: true })
    personType?: PersonType;

    @Field(() => [String], { nullable: true })
    accountTypeIds?: string[];

    @Field(() => String, { nullable: true })
    channelId?: string;

    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    firstName?: string;

    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: true })
    email?: string;

    @Field({ nullable: true })
    phone?: string;

    @Field({ nullable: true })
    phone2?: string;

    @Field(() => String, { nullable: true })
    gender?: Gender;

    @Field({ nullable: true })
    taxNumber?: string;

    @Field({ nullable: true })
    taxOffice?: string;

    @Field({ nullable: true })
    nationalId?: string;

    @Field({ nullable: true })
    countryId?: string;

    @Field({ nullable: true })
    cityId?: string;

    @Field({ nullable: true })
    countyId?: string;

    @Field({ nullable: true })
    districtId?: string;

    @Field({ nullable: true })
    address?: string;

    @Field({ nullable: true })
    postalCode?: string;

    @Field({ nullable: true })
    note?: string;

    @Field({ nullable: true })
    assignedUserId?: string;

    @Field(() => [String], { nullable: true })
    segmentIds?: string[];

    @Field(() => [CreateUpdateAccountLocationDTO], { nullable: true })
    locations?: CreateUpdateAccountLocationDTO[];
}
