import { Field, InputType } from '@nestjs/graphql';
import { Permission } from 'src/types/constants';

@InputType()
export class AddUpdateRoleDto {
    @Field({ nullable: true })
    id?: string;

    @Field()
    name: string;

    @Field({ nullable: true })
    homepage?: string;

    @Field()
    roleTypeId: string;

    @Field(() => [String])
    permissions: Permission[];
}
