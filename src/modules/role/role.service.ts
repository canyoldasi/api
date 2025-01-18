import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { UserRole } from "src/entities/user-role.entity";
import { User } from "src/entities/user.entity";
import { EntityManager } from "typeorm";

@Injectable()
export class RoleService {
    constructor (
        @InjectEntityManager()
        private entityManager: EntityManager
    ) {}
    async findRolesOfUser(user: User): Promise<Role[]> {
        const userRoles = await this.entityManager.find(UserRole, {
            where: {
                user: {
                    id: user.id
                }
            },
            relations: {
                role: true
            }
        });
        return userRoles.map(x => x.role)
    }
}