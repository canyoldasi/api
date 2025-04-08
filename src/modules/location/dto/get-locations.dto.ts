import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class GetLocationsDTO {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    text?: string;
}
