import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { tenants } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: any,
  ) {}

  async create(name: string) {
    const [tenant] = await this.db.insert(tenants).values({ name }).returning();
    return tenant;
  }

  async findAll() {
    return this.db.select().from(tenants);
  }

  async findOne(id: string) {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id));
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }
}

