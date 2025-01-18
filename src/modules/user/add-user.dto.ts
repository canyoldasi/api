import { Field, InputType } from "@nestjs/graphql";
import { RoleEnum } from "src/providers/role.enum";

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

    @Field(() => [Number])
    roles: number[];
}

/*
@Args({name: 'username', type: () => String}) username: string,
@Args({name: 'password', type: () => String}) password: string,
@Args({name: 'fullName', type: () => String, nullable: true}) fullName: string,
@Args({name: 'isActive', type: () => Boolean, nullable: true, defaultValue: true}) isActive: boolean,
@Args({name: 'roles', type: () => [Int], nullable: true, defaultValue: [RoleEnum.User]}) roles: number[]
*/
