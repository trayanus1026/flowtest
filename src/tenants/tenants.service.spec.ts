import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NotFoundException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: '1', name: 'Test Tenant' }]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([{ id: '1', name: 'Test Tenant' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a tenant', async () => {
    const result = await service.create('Test Tenant');
    expect(result).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should find all tenants', async () => {
    const result = await service.findAll();
    expect(result).toBeDefined();
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('should throw NotFoundException when tenant not found', async () => {
    mockDb.where.mockResolvedValue([]);
    await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
  });
});

