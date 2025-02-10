import { IsString, IsNumber } from 'class-validator';

export class UpdateSpendingDto {
  @IsString()
  date: string;

  @IsString()
  category: string;

  @IsString()
  itemName: string;

  @IsNumber()
  amount: number;
}
