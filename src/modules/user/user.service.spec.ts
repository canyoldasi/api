import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { EntityManager } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

// Mocking the EntityManager
const mockEntityManager = {
  transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
  save: jest.fn(),
  delete: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('should add a user and assign roles', async () => {
      const userDto = {
        username: 'testuser',
        fullName: 'Test User',
        password: 'password123',
        roles: ['1', '2'],
      };

      const mockUser = {
        id: '123',
        username: userDto.username,
        fullName: userDto.fullName,
        password: await bcrypt.hash(userDto.password, 1),
      };

      mockEntityManager.save.mockResolvedValueOnce(mockUser);

      const result = await service.add(userDto);

      expect(result).toEqual(mockUser);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).toHaveBeenCalledWith(User, expect.objectContaining({
        username: userDto.username,
        fullName: userDto.fullName,
        password: expect.any(String),
      }));
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2); // For each role save
    });
  });

  describe('removeOneById', () => {
    it('should remove a user by id', async () => {
      const userId = '123';

      await service.removeOneById(userId);

      expect(mockEntityManager.delete).toHaveBeenCalledWith(User, { id: userId });
    });
  });

  describe('getOneById', () => {
    it('should return a user by id', async () => {
      const userId = '123';
      const mockUser = { id: userId, username: 'testuser' };

      mockEntityManager.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getOneById(userId);

      expect(result).toEqual(mockUser);
      expect(mockEntityManager.findOneBy).toHaveBeenCalledWith(User, { id: userId });
    });
  });

  describe('getOneByUsername', () => {
    it('should return a user by username', async () => {
      const username = 'testuser';
      const mockUser = { id: '123', username: username };

      mockEntityManager.findOne.mockResolvedValue(mockUser);

      const result = await service.getOneByUsername(username);

      expect(result).toEqual(mockUser);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { username: username },
      });
    });
  });

  describe('getAll', () => {
    it('should return a list of active users', async () => {
      const mockUsers = [
        { id: '123', username: 'user1', isActive: true },
        { id: '124', username: 'user2', isActive: true },
      ];

      mockEntityManager.find.mockResolvedValue(mockUsers);

      const result = await service.getAll();

      expect(result).toEqual(mockUsers);
      expect(mockEntityManager.find).toHaveBeenCalledWith(User, {
        where: { isActive: true },
        relations: { roles: true },
      });
    });
  });
});
