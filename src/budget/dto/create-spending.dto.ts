import { IsString, IsNumber } from 'class-validator';

export class CreateSpendingDto {
  @IsString()
  date: string; // YYYY-MM-DD 형식

  @IsString()
  category: string; // 카테고리

  @IsString()
  itemName: string; // 지출 항목명

  @IsNumber()
  amount: number; // 금액
}
