import { Inject, Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { UserRole } from "src/entities/user-role.entity";
import { EntityManager } from "typeorm";

@Injectable()
export class RoleService {
    constructor (
        @InjectEntityManager()
        private entityManager: EntityManager
    ) {}

    async findUserRoles(userId: string): Promise<Role[]> {
        const userRoles = await this.entityManager.find(UserRole, {
            where: {
                user: {
                    id: userId
                }
            },
            relations: {
                role: true
            }
        });
        return userRoles.map(x => x.role)
    }

    async removeByUserId(id: string) {
        await this.entityManager.delete(UserRole, {
            user: {
                id: id
            }
        })
    }
    
}