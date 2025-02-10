import { IsNumber } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber() diaperBudget: number;
  @IsNumber() sanitaryBudget: number;
  @IsNumber() feedingBudget: number;
  @IsNumber() skincareBudget: number;
  @IsNumber() foodBudget: number;
  @IsNumber() toysBudget: number;
  @IsNumber() beddingBudget: number;
  @IsNumber() fashionBudget: number;
  @IsNumber() otherBudget: number;
}
