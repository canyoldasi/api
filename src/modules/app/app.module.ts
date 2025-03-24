import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
//import { JwtStrategy } from '../../providers/jwt.strategy';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from '../user/user.module';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from 'src/providers/logger.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/providers/global.exception-filter';
import { RequestMiddleware } from 'src/providers/request.middleware';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { RoleModule } from '../role/role.module';
import { AuthGuard } from '../../providers/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { Log } from 'src/entities/log.entity';
import { LogModule } from '../log/log.module';
import { LoggingInterceptor } from 'src/providers/logging.interceptor';
import { Account } from 'src/entities/account.entity';
import { Contact } from 'src/entities/contact.entity';
import { Product } from 'src/entities/product.entity';
import { AccountType } from 'src/entities/account-type.entity';
import { AccountLocation } from 'src/entities/account-location.entity';
import { City } from 'src/entities/city.entity';
import { County } from 'src/entities/county.entity';
import { LocationModule } from '../location/location.module';
import { Country } from 'src/entities/country.entity';
import { District } from 'src/entities/district.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Segment } from 'src/entities/segment.entity';
import { AccountModule } from '../account/account.module';
import { AccountSegment } from 'src/entities/account-segment.entity';
import { AccountAccountType } from 'src/entities/account-account-type.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionStatus } from 'src/entities/transaction-status.entity';
import { TransactionProduct } from 'src/entities/transaction-product.entity';
import { AppResolver } from './app.resolver';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { TransactionModule } from '../transaction/transaction.module';
@Module({
    imports: [
        ConfigModule.forRoot(),
        WinstonModule.forRoot(loggerConfig),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT),
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            synchronize: Boolean(process.env.DATABASE_SYNC),
            autoLoadEntities: false,
            entities: [
                User,
                Role,
                RolePermission,
                Log,
                Account,
                Contact,
                Product,
                AccountType,
                Country,
                City,
                County,
                District,
                AccountLocation,
                Segment,
                AccountSegment,
                AccountAccountType,
                Transaction,
                TransactionStatus,
                TransactionProduct,
            ],
            namingStrategy: new SnakeNamingStrategy(),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            sortSchema: true,
            playground: true, // Always enable playground for API testing
            introspection: true,
            context: (context) => {
                return {
                    req: context,
                    user: context?.raw?.user,
                };
            },
        }),
        UserModule,
        AuthModule,
        RoleModule,
        LogModule.forRoot(),
        LocationModule,
        AccountModule,
        EmailModule,
        TransactionModule,
    ],
    controllers: [],
    providers: [
        AppResolver,
        //TODO: JwtStrategy geliştirilecek ve request.user içine kullanıcı bilgileri eklenecek.
        //JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestMiddleware).forRoutes('*');
    }
}
