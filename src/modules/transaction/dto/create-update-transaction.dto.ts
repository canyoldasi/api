import { Field, InputType } from '@nestjs/graphql';
import { TransactionType } from '../../../constants';

@InputType()
export class CreateUpdateTransactionDTO {
    @Field({ nullable: true })
    id?: string;

    @Field(() => String)
    type: TransactionType;

    @Field()
    statusId: string;

    @Field({ nullable: true })
    accountId?: string;

    @Field({ nullable: true })
    assignedUserId?: string;

    @Field()
    amount: number;

    @Field({ nullable: true })
    details?: string;

    @Field({ nullable: true })
    referenceNumber?: string;

    @Field({ nullable: true })
    closedDate?: Date;

    @Field({ nullable: true })
    cancelNote?: string;

    @Field({ nullable: true })
    successNote?: string;

    @Field({ nullable: true })
    note?: string;

    @Field({ nullable: true })
    campaignId?: string;

    @Field({ nullable: true })
    routeId?: string;

    @Field({ nullable: true })
    passengerCount?: number;
}
