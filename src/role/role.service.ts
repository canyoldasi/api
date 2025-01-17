import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { EntityManager } from "typeorm";

@Injectable()
export class RoleService {
    constructor (
        @InjectEntityManager()
        private entityManager: EntityManager
    ) {}
    async findAll(): Promise<Role[]> {
        return [
            { id: 1, name: 'Admin', code: '' },
            { id: 2, name: 'User', code: '' },
          ];
    }
}