import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ImportTransactionDto } from './import-transaction.dto';

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTransactionDto)
  transactions: ImportTransactionDto[];

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

