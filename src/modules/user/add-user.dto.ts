import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class AddUserDto {
    @Field()
    username: string;
    
    @Field()
    fullName: string;

    @Field()
    password: string;

    @Field()
    isActive: boolean;

    @Field(() => [String])
    roles: string[];
}