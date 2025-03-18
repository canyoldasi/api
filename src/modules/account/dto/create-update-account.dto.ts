import { Field, InputType } from '@nestjs/graphql';
import { Gender, PersonType } from '../../../constants';
import { CreateUpdateAccountLocationDTO } from 'src/modules/account/dto/create-update-account-location.dto';

@InputType()
export class CreateUpdateAccountDTO {
    @Field({ nullable: true })
    id?: string;

    @Field(() => String)
    personType: PersonType;

    @Field(() => [String], { nullable: true })
    accountTypeIds?: string[];

    @Field()
    name: string;

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    email: string;

    @Field()
    phone: string;

    @Field()
    phone2: string;

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
