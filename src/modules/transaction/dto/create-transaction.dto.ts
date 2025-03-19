import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionType } from '../../../constants';

@InputType()
export class CreateTransactionDto {
    @Field(() => String)
    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @Field(() => String)
    @IsUUID()
    @IsNotEmpty()
    statusId: string;

    @Field()
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @Field({ nullable: true })
    @IsUUID()
    @IsOptional()
    accountId?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    details?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    referenceNumber?: string;

    @Field({ nullable: true })
    @IsOptional()
    scheduledDate?: Date;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    cancelReason?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    notes?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    campaignId?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    routeId?: string;

    @Field({ nullable: true })
    @IsNumber()
    @IsOptional()
    passengerCount?: number;
}
