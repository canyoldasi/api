import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { TestModule } from '../../../test/test.module';
import { AddUpdateUserDto } from './add-update-user.dto';
import { RoleEnum } from '../../providers/role.enum';

describe('UserService (Integration)', () => {
  let service: UserService;
  let mockDto: AddUpdateUserDto;
  let addResp: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    await module.init();

    service = module.get<UserService>(UserService);
  });

  it('should add user', async () => {
    mockDto = {
      username: Math.random().toString(),
      fullName: Math.random().toString(),
      password: Math.random().toString(),
      isActive: true,
      roles: [RoleEnum.Admin]
    }
    addResp = await service.add(mockDto);
    expect(addResp).toBeDefined();
    expect(addResp).toMatchObject({
      id: expect.any(String),
      username: expect.any(String)
    });
  });

  it('should fetch user', async () => {
    const fetched = await service.getOneById(addResp.id);

    expect(fetched).toMatchObject({
      id: expect.any(String),
      username: expect.any(String)
    })

    expect(fetched.username).toBe(mockDto.username);
  });
});