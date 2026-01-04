import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { InvoicesModule } from './invoices/invoices.module';
import { BankTransactionsModule } from './bank-transactions/bank-transactions.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      // Apollo Server 5 uses Apollo Studio Explorer instead of Playground
      introspection: true,
    }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    InvoicesModule,
    BankTransactionsModule,
    ReconciliationModule,
  ],
})
export class AppModule {}

