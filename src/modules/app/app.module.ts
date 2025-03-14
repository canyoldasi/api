import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../providers/jwt.strategy';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from '../user/user.module';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from 'src/providers/logger.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/providers/global.exception-filter';
import { ExecutionTimeInterceptor } from 'src/providers/execution-time.intercepter';
import { RequestMiddleware } from 'src/providers/request.middleware';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { RoleModule } from '../role/role.module';
import FastifyRequestCustom from '../../providers/fastify-request-custom';
import { AuthGuard } from '../../providers/auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
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
            entities: [User, Role, UserRole, RolePermission],
            //namingStrategy: new SnakeNamingStrategy()
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            sortSchema: true,
            playground: process.env.NODE_ENV === 'development',
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
    ],
    controllers: [AppController],
    providers: [
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        /*{
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ExecutionTimeInterceptor,
        },*/
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestMiddleware).forRoutes('*');
    }
}
