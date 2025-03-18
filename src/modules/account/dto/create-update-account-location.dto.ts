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
}
