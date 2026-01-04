import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NotFoundException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        { id: '1', tenantId: 'tenant1', amount: '100.00', status: 'open' },
      ]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an invoice', async () => {
    const dto = { amount: 100, currency: 'USD' };
    const result = await service.create('tenant1', dto);
    expect(result).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should find all invoices for tenant', async () => {
    mockDb.where.mockResolvedValue([
      { id: '1', tenantId: 'tenant1', amount: '100.00' },
    ]);
    const result = await service.findAll('tenant1');
    expect(result).toBeDefined();
  });

  it('should delete an invoice', async () => {
    mockDb.where.mockResolvedValue([
      { id: '1', tenantId: 'tenant1' },
    ]);
    const result = await service.delete('tenant1', '1');
    expect(result.success).toBe(true);
  });

  it('should throw NotFoundException when invoice not found', async () => {
    mockDb.where.mockResolvedValue([]);
    await expect(service.delete('tenant1', 'non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});

