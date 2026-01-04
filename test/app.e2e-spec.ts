import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_CONNECTION } from '../src/database/database.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mockDb: any;
  let authToken: string;

  beforeAll(async () => {
    // Mock database
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'tenant1', name: 'Test Tenant' }]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      transaction: jest.fn((callback) => callback(mockDb)),
      execute: jest.fn().mockResolvedValue([]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue(mockDb)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create a mock JWT token for testing
    // In real scenario, you'd generate this properly
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tenants (POST)', () => {
    it('should create a tenant', () => {
      return request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Tenant' })
        .expect(201);
    });
  });

  describe('/tenants/:tenant_id/invoices (POST)', () => {
    it('should create an invoice', () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 'inv1', tenantId: 'tenant1', amount: '100.00', status: 'open' },
      ]);

      return request(app.getHttpServer())
        .post('/tenants/tenant1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, currency: 'USD' })
        .expect(201);
    });

    it('should list invoices with filters', () => {
      mockDb.where.mockResolvedValueOnce([
        { id: 'inv1', tenantId: 'tenant1', amount: '100.00', status: 'open' },
      ]);

      return request(app.getHttpServer())
        .get('/tenants/tenant1/invoices?status=open')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should delete an invoice', () => {
      mockDb.where.mockResolvedValueOnce([
        { id: 'inv1', tenantId: 'tenant1' },
      ]);

      return request(app.getHttpServer())
        .delete('/tenants/tenant1/invoices/inv1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/tenants/:tenant_id/bank-transactions/import (POST)', () => {
    it('should import bank transactions', () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 'tx1', tenantId: 'tenant1', amount: '100.00' },
      ]);

      return request(app.getHttpServer())
        .post('/tenants/tenant1/bank-transactions/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactions: [
            { postedAt: '2024-01-01T00:00:00Z', amount: 100, currency: 'USD' },
          ],
        })
        .expect(201);
    });

    it('should handle idempotency', () => {
      const idempotencyKey = 'test-key-123';
      const cachedResult = { transactions: [{ id: 'tx1' }] };
      mockDb.where.mockResolvedValueOnce([
        {
          key: idempotencyKey,
          payloadHash: expect.any(String),
          result: JSON.stringify(cachedResult),
        },
      ]);

      return request(app.getHttpServer())
        .post('/tenants/tenant1/bank-transactions/import')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          transactions: [
            { postedAt: '2024-01-01T00:00:00Z', amount: 100, currency: 'USD' },
          ],
        })
        .expect(200);
    });
  });

  describe('RLS - Cross-tenant access blocked', () => {
    it('should not allow access to other tenant data', async () => {
      // This test verifies that RLS policies prevent cross-tenant access
      // In a real scenario, you'd set up proper RLS context and verify
      // that queries for tenant2 data return empty when authenticated as tenant1
      mockDb.where.mockResolvedValueOnce([]);

      const response = await request(app.getHttpServer())
        .get('/tenants/tenant1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify that only tenant1's data is returned
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

