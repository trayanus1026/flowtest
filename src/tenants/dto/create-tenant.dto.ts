import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

