import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

@InputType()
export class ImportTransactionInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  externalId?: string;

  @Field()
  @IsDateString()
  postedAt: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}

