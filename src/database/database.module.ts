import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export const POSTGRES_CLIENT = 'POSTGRES_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL') ||
          `postgresql://${configService.get<string>('DB_USER', 'postgres')}:${configService.get<string>('DB_PASSWORD', 'postgres')}@${configService.get<string>('DB_HOST', 'localhost')}:${configService.get<string>('DB_PORT', '5432')}/${configService.get<string>('DB_NAME', 'invoice_reconciliation')}`;
        
        return postgres(connectionString, { max: 1 });
      },
    },
    {
      provide: DATABASE_CONNECTION,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: postgres.Sql) => {
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION, POSTGRES_CLIENT],
})
export class DatabaseModule {}

