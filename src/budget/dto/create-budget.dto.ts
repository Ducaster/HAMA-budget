import { IsNumber, IsNotEmpty, IsObject } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  @IsNotEmpty()
  year: number; // ✅ 년도 추가

  @IsNumber()
  @IsNotEmpty()
  month: number; // ✅ 월 추가

  @IsObject()
  @IsNotEmpty()
  categories: Record<string, number>; // ✅ 카테고리별 예산 객체
}
