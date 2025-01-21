import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { TestModule } from '../../../test/test.module';
import { AddUpdateUserDto } from './add-update-user.dto';
import { RoleEnum } from '../../providers/role.enum';

describe('UserService (Integration)', () => {
  let service: UserService;
  let mockDto: AddUpdateUserDto;
  let resp: any;
  let fetched: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    await module.init();

    service = module.get<UserService>(UserService);
  });

  it('add, getOneById', async () => {
    mockDto = {
      username: Math.random().toString(),
      fullName: Math.random().toString(),
      password: Math.random().toString(),
      isActive: true,
      roles: [RoleEnum.Admin]
    }
    resp = await service.add(mockDto);
    expect(resp).toBeDefined();
    expect(resp).toMatchObject({
      id: expect.any(String),
      username: expect.any(String)
    });

    fetched = await service.getOneById(resp.id);

    expect(fetched).toMatchObject({
      id: expect.any(String),
      username: expect.any(String)
    })

    expect(fetched.username).toBe(mockDto.username);
  });

  it('update', async () => {
    mockDto = {
      id: resp.id,
      username: Math.random().toString(),
      fullName: Math.random().toString(),
      password: Math.random().toString(),
      isActive: true,
      roles: [RoleEnum.Admin]
    }
    resp = await service.update(mockDto);

    fetched = await service.getOneById(resp.id);

    expect(fetched).toMatchObject({
      id: expect.any(String),
      username: expect.any(String)
    })

    expect(fetched.username).toBe(mockDto.username);
  })

  it('removeOneById', async () =>{
    await service.removeOneById(resp.id);

    fetched = await service.getOneById(resp.id);
    expect(fetched).toBeNull();
  })
});
