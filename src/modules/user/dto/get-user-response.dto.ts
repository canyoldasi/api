import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';

@ObjectType()
export class UserResponseDTO {
    @Field(() => User)
    user: User;

    @Field(() => [Role])
    roles?: Role[];

    @Field(() => [String])
    permissions?: string[];
}
