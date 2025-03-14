import { Module, Global, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from '../../entities/log.entity';
import { LogService } from './log.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    providers: [LogService],
    exports: [LogService],
})
export class LogModule {
    static forRoot(): DynamicModule {
        return {
            module: LogModule,
            imports: [TypeOrmModule.forFeature([Log])],
            global: true,
            providers: [LogService],
            exports: [LogService],
        };
    }
}
