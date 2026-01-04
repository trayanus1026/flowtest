import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class CreateTenantInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

