import { Field, InputType } from '@nestjs/graphql';
import { Permission } from 'src/types/constants';

@InputType()
export class AddUpdateRoleDto {
    @Field({ nullable: true })
    id?: string;

    @Field()
    name: string;

    @Field()
    roleTypeId: string;

    @Field(() => [String])
    permissions: Permission[];
}
