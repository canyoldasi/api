import { FastifyRequest } from 'fastify';
import { User } from 'src/entities/user.entity';

export default interface FastifyRequestCustom extends FastifyRequest {
    requestId?: string;
    userId?: string;
    user?: User;
}
