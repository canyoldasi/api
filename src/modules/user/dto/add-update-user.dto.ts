import { Field, InputType } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class AddUpdateUserDto {
    @Field({ nullable: true })
    id?: string;

    @Field()
    @MinLength(3)
    username: string;

    @Field()
    fullName: string;

    @Field()
    password: string;

    @Field()
    isActive?: boolean = true;

    @Field()
    roleId: string;
}
