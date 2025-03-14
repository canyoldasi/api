import { Field, InputType } from '@nestjs/graphql';
import { Permission } from 'src/constants';

@InputType()
export class AddUpdateRoleDto {
    @Field({ nullable: true })
    id?: string;

    @Field()
    name: string;

    @Field(() => [String])
    permissions: Permission[];
}
