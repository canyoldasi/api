import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../../entities/log.entity';
import { LogLevel } from 'src/constants';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class LogService {
    constructor(
        @InjectRepository(Log)
        private readonly logRepository: Repository<Log>,
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly fileLogger: Logger
    ) {}

    async log(data: {
        level: LogLevel;
        module: string;
        action: string;
        message: string;
        details?: any;
        stackTrace?: string;
        customerId?: string;
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        requestId?: string;
        entity?: string;
        entityType?: string;
    }): Promise<string> {
        this.fileLogger.log({
            level: data.level.toLowerCase(),
            message: data.message,
            module: data.module,
            action: data.action,
            details: data.details ? JSON.stringify(data.details) : undefined,
            stackTrace: data.stackTrace,
            customerId: data.customerId,
            userId: data.userId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            requestId: data.requestId,
            entity: data.entity,
            entityType: data.entityType,
            timestamp: new Date(),
        });

        const log = await this.logRepository.save({
            level: data.level,
            module: data.module,
            action: data.action,
            message: data.message,
            details: data.details ? JSON.stringify(data.details) : null,
            stackTrace: data.stackTrace,
            customerId: data.customerId,
            userId: data.userId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            requestId: data.requestId,
            entity: data.entity,
            entityType: data.entityType,
        });
        return log.id;
    }

    async getLogs(filters: {
        level?: LogLevel;
        module?: string;
        action?: string;
        customerId?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        entity?: string;
        entityType?: string;
    }) {
        const query = this.logRepository.createQueryBuilder('log');

        if (filters.level) {
            query.andWhere('log.level = :level', { level: filters.level });
        }
        if (filters.module) {
            query.andWhere('log.module = :module', { module: filters.module });
        }
        if (filters.action) {
            query.andWhere('log.action = :action', { action: filters.action });
        }
        if (filters.customerId) {
            query.andWhere('log.customer_id = :customerId', { customerId: filters.customerId });
        }
        if (filters.userId) {
            query.andWhere('log.user_id = :userId', { userId: filters.userId });
        }
        if (filters.entity) {
            query.andWhere('log.entity = :entity', { entity: filters.entity });
        }
        if (filters.entityType) {
            query.andWhere('log.entity_type = :entityType', { entityType: filters.entityType });
        }
        if (filters.startDate) {
            query.andWhere('log.created_at >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            query.andWhere('log.created_at <= :endDate', { endDate: filters.endDate });
        }

        query.orderBy('log.created_at', 'DESC');

        return await query.getMany();
    }
}
