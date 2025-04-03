import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUpdateAccountLocationDTO {
    @Field({ nullable: true })
    id?: string;

    @Field()
    countryId: string;

    @Field({ nullable: true })
    cityId?: string;

    @Field({ nullable: true })
    countyId?: string;

    @Field({ nullable: true })
    districtId?: string;

    @Field({ nullable: true })
    postalCode?: string;

    @Field({ nullable: true })
    address?: string;

    @Field({ nullable: true })
    latitude?: string;

    @Field({ nullable: true })
    longitude?: string;

    @Field({ nullable: true })
    note?: string;

    @Field({ nullable: true })
    code?: string;
}
