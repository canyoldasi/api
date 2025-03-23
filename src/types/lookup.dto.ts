import { Field, InputType } from '@nestjs/graphql';

/**
 * Lookup sorguları için kullanılan ortak giriş DTO'su
 */
@InputType()
export class GetLookupDTO {
    @Field(() => String, { nullable: true })
    id?: string;

    @Field(() => String, { nullable: true })
    text?: string;

    @Field(() => Boolean, { nullable: true })
    isActive?: boolean;

    @Field({ nullable: true })
    pageIndex?: number = 0;

    @Field({ nullable: true })
    pageSize?: number = 10;
}
