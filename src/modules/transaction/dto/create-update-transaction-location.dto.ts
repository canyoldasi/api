import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateUpdateTransactionLocationDTO {
    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    id?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    locationId?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    code?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    countryId?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    cityId?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    countyId?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsUUID()
    districtId?: string;

    @Field({ nullable: true })
    @IsOptional()
    postalCode?: string;

    @Field({ nullable: true })
    @IsOptional()
    address?: string;

    @Field({ nullable: true })
    @IsOptional()
    latitude?: string;

    @Field({ nullable: true })
    @IsOptional()
    longitude?: string;

    @Field({ nullable: true })
    @IsOptional()
    note?: string;

    @Field(() => Date, { nullable: true })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    plannedDate?: Date;

    @Field(() => Date, { nullable: true })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    actualDate?: Date;
}
