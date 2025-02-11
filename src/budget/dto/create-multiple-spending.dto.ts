import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSpendingDto } from './create-spending.dto';

export class CreateMultipleSpendingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSpendingDto)
  spendings: CreateSpendingDto[];
}
