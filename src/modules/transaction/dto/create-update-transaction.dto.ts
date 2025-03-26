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
    details?: string;

    @Field({ nullable: true })
    no?: string;

    @Field({ nullable: true })
    closedDate?: Date;

    @Field({ nullable: true })
    cancelNote?: string;

    @Field({ nullable: true })
    successNote?: string;

    @Field({ nullable: true })
    note?: string;

    @Field(() => [CreateUpdateTransactionProductDTO], { nullable: true })
    products?: CreateUpdateTransactionProductDTO[];
}
