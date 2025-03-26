import { Field, InputType } from '@nestjs/graphql';
import { CreateUpdateTransactionProductDTO } from './create-update-transaction-product.dto';

@InputType()
export class CreateUpdateTransactionDTO {
    @Field({ nullable: true })
    id?: string;

    @Field(() => String, { nullable: true })
    typeId?: string;

    @Field(() => String, { nullable: true })
    statusId?: string;

    @Field({ nullable: true })
    accountId?: string;

    @Field({ nullable: true })
    assignedUserId?: string;

    @Field({ nullable: true })
    amount?: number;

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
    no?: string;

    @Field({ nullable: true })
    successDate?: Date;

    @Field({ nullable: true })
    cancelDate?: Date;

    @Field({ nullable: true })
    cancelNote?: string;

    @Field({ nullable: true })
    successNote?: string;

    @Field({ nullable: true })
    note?: string;

    @Field(() => [CreateUpdateTransactionProductDTO], { nullable: true })
    products?: CreateUpdateTransactionProductDTO[];
}
