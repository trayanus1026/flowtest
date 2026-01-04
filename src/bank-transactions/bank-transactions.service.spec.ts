import { Test, TestingModule } from '@nestjs/testing';
import { BankTransactionsService } from './bank-transactions.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { ConflictException } from '@nestjs/common';

describe('BankTransactionsService', () => {
  let service: BankTransactionsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        { id: '1', tenantId: 'tenant1', amount: '100.00' },
      ]),
      transaction: jest.fn((callback) => callback(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankTransactionsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<BankTransactionsService>(BankTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should import transactions', async () => {
    const dto = {
      transactions: [
        { postedAt: '2024-01-01', amount: 100, currency: 'USD' },
      ],
    };
    const result = await service.bulkImport('tenant1', dto);
    expect(result).toBeDefined();
    expect(mockDb.transaction).toHaveBeenCalled();
  });

  it('should return cached result for same idempotency key', async () => {
    const dto = {
      transactions: [{ postedAt: '2024-01-01', amount: 100 }],
      idempotencyKey: 'key1',
    };
    
    // Calculate the actual hash that will be generated
    const crypto = require('crypto');
    const actualHash = crypto.createHash('sha256').update(JSON.stringify(dto.transactions)).digest('hex');
    
    const cachedResult = { transactions: [{ id: '1' }] };
    mockDb.where.mockResolvedValueOnce([
      {
        key: 'key1',
        payloadHash: actualHash, // Use the actual hash
        result: JSON.stringify(cachedResult),
      },
    ]);

    const result = await service.bulkImport('tenant1', dto);
    expect(result).toEqual(cachedResult);
  });

  it('should throw ConflictException for different payload with same key', async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        key: 'key1',
        payloadHash: 'different-hash',
        result: '{}',
      },
    ]);

    const dto = {
      transactions: [{ postedAt: '2024-01-01', amount: 100 }],
      idempotencyKey: 'key1',
    };

    await expect(service.bulkImport('tenant1', dto)).rejects.toThrow(
      ConflictException,
    );
  });
});

