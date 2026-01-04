import { InputType, Field } from '@nestjs/graphql';
import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ImportTransactionInput } from './import-transaction.input';

@InputType()
export class BulkImportInput {
  @Field(() => [ImportTransactionInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTransactionInput)
  transactions: ImportTransactionInput[];

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

