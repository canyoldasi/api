import { Mutation, Resolver } from '@nestjs/graphql';
import { BookingInboxService } from './booking-inbox.service';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class BookingInboxResponse {
    @Field()
    success: boolean;

    @Field()
    message: string;
}

@Resolver()
export class BookingInboxResolver {
    constructor(private readonly bookingInboxService: BookingInboxService) {}

    @Mutation(() => BookingInboxResponse)
    async manualCheckEmails(): Promise<BookingInboxResponse> {
        return this.bookingInboxService.startManuel();
    }
}
