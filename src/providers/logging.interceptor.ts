import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogService } from '../modules/log/log.service';
import { LOG_LEVEL } from 'src/constants';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logService: LogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();
        const ctx = gqlContext.getContext();
        const args = gqlContext.getArgs();

        const operationType = info?.operation.operation; // 'query' veya 'mutation'
        const fieldName = info?.fieldName; // method adı
        const userId = ctx.user?.id;
        const requestId = ctx.req?.raw?.requestId;

        // İşlem başlangıcını logla
        this.logService.log({
            level: LOG_LEVEL.INFO,
            module: info?.parentType?.name,
            action: `${operationType?.toUpperCase()}_${fieldName?.toUpperCase()}_STARTED`,
            message: `${fieldName} işlemi başlatıldı`,
            userId,
            entity: info?.parentType?.name,
            entityType: operationType,
            requestId,
            details: {
                arguments: this.sanitizeArgs(args),
            },
        });

        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: (data) => {
                    //TODO: Veritabanı işlemi timeout hatası verdi ama burası "başarıyla tamamlandı" logu veriyor. Düzeltilecek.
                    // Başarılı işlem logu
                    const duration = Date.now() - startTime;
                    this.logService.log({
                        level: LOG_LEVEL.INFO,
                        module: info?.parentType.name,
                        action: `${operationType?.toUpperCase()}_${fieldName?.toUpperCase()}_COMPLETED`,
                        message: `${fieldName} işlemi başarıyla tamamlandı`,
                        userId,
                        entity: info?.parentType?.name,
                        entityType: operationType,
                        requestId,
                        details: {
                            duration,
                            hasData: !!data,
                            dataType: data ? typeof data : null,
                        },
                    });
                },
                error: (error) => {
                    // Hata logu
                    const duration = Date.now() - startTime;
                    this.logService.log({
                        level: LOG_LEVEL.ERROR,
                        module: info?.parentType?.name,
                        action: `${operationType?.toUpperCase()}_${fieldName?.toUpperCase()}_ERROR`,
                        message: `${fieldName} işleminde hata oluştu: ${error.message}`,
                        userId,
                        entity: info?.parentType?.name,
                        entityType: operationType,
                        requestId,
                        stackTrace: error.stack,
                        details: {
                            duration,
                            errorName: error.name,
                            errorMessage: error.message,
                        },
                    });
                },
            })
        );
    }

    private sanitizeArgs(args: Record<string, any>): Record<string, any> {
        // Hassas verileri temizle
        const sanitized = { ...args };
        const sensitiveFields = ['password', 'token', 'secret', 'authorization'];

        Object.keys(sanitized).forEach((key) => {
            if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
                sanitized[key] = '***HIDDEN***';
            }
        });

        return sanitized;
    }
}
