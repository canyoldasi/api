import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreateUpdateTransactionProductDTO {
    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    id?: string;

    @Field(() => String)
    @IsUUID()
    productId: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    unitPrice?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    totalPrice?: number;
}
