import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Tenant {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;
}

