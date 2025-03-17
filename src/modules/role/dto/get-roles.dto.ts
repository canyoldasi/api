import { Field, InputType } from '@nestjs/graphql';
import { PaginationBaseDTO } from '../../../providers/pagination-base.dto';
import { Permission } from 'src/constants';

@InputType()
export class GetRolesDTO extends PaginationBaseDTO {
    @Field({ nullable: true })
    text?: string;

    @Field(() => [String], { nullable: true })
    permissions?: Permission[];
}
