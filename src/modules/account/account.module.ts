import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../entities/account.entity';
import { AccountType } from '../../entities/account-type.entity';
import { Segment } from '../../entities/segment.entity';
import { User } from '../../entities/user.entity';
import { Country } from '../../entities/country.entity';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { Contact } from '../../entities/contact.entity';
import { AccountLocation } from '../../entities/account-location.entity';
import { AccountResolver } from './account.resolver';
import { UserService } from '../user/user.service';

@Module({
    controllers: [],
    providers: [AccountService, AccountResolver, UserService],
    exports: [AccountService, TypeOrmModule],
    imports: [
        TypeOrmModule.forFeature([
            Account,
            AccountType,
            Segment,
            User,
            Country,
            City,
            County,
            District,
            Contact,
            AccountLocation,
        ]),
    ],
})
export class AccountModule {}
