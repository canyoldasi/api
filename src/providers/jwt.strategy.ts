import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import FastifyRequestCustom from './fastify-request-custom';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: any, request: FastifyRequestCustom) {
        request.user = {
            user: { userId: payload.sub, username: payload.username },
            roles: payload.roles || [],
            permissions: payload.permissions || []
        };
        return request.user;
    }
}
