import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationBaseDTO } from '../../../providers/pagination-base.dto';

@InputType()
export class GetProductsDTO extends PaginationBaseDTO {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    id?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    text?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    code?: string;

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
