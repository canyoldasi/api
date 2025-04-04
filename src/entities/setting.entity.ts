import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Setting {
    @Field(() => String)
    @PrimaryColumn()
    key: string;

    @Field(() => String)
    @Column({ type: 'text' })
    value: string;

    @Field(() => String, { nullable: true })
    @Column({ type: 'text', nullable: true })
    previousValue?: string;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date;
}
