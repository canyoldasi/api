import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { UserRole } from "src/entities/user-role.entity";
import { User } from "src/models/user.model";
import { EntityManager } from "typeorm";

@Injectable()
export class RoleService {
    constructor (
        @InjectEntityManager()
        private entityManager: EntityManager
    ) {}
    async findAll(user: User): Promise<UserRole[]> {
        return this.entityManager.findBy(UserRole, {
            user: {
                id: user.id
            }
        })
    }
}