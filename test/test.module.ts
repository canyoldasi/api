import { Module, Global, OnModuleInit, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../src/entities/user.entity';
import { UserRole } from '../src/entities/user-role.entity';
import { UserService } from '../src/modules/user/user.service';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../src/providers/role.enum';
import { Role } from '../src/entities/role.entity';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { WinstonModule } from 'nest-winston';

@Injectable()
export class TestService {
  public username = Math.random().toString();
  public password = Math.random().toString();
}

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({}),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [User, UserRole, Role],
    }),
    TypeOrmModule.forFeature([User, UserRole, Role]),
  ],
  providers: [UserService, TestService, AuthService, JwtService],
  exports: [TypeOrmModule, TestService],
})
export class TestModule implements OnModuleInit {
  constructor(private readonly entityManager: EntityManager, private testService: TestService) {}

  async onModuleInit() {
    //const testService = new TestService();

    const adminRole = await this.entityManager.save(this.entityManager.create(Role, {
        id: RoleEnum.Admin,
        name: 'Admin'
    }));

    const simpleUserRole = await this.entityManager.save(this.entityManager.create(Role, {
        id: RoleEnum.User,
        name: 'Kullanıcı'
    }));

    const savedUser = await this.entityManager.save(this.entityManager.create(User, {
        username: this.testService.username,
        fullName: 'Admin User',
        password: await bcrypt.hash(this.testService.password, parseInt(process.env.PASSWORD_SALT)),
    }));

    const assignedAdminRole = await this.entityManager.save(this.entityManager.create(UserRole, {
        user: savedUser,
        role: adminRole,
    }));
    const assignedSimpleUserRole = await this.entityManager.save(this.entityManager.create(UserRole, {
        user: savedUser,
        role: simpleUserRole,
    }));

    console.log('Database seeded successfully');
  }
}