import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// ✅ 개별 지출 항목을 위한 서브 문서
class Expense {
  @Prop({ required: true })
  date: string; // YYYY-MM-DD 형식

  @Prop({ required: true })
  itemName: string; // 상품명

  @Prop({ required: true })
  amount: number; // 가격
}

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ required: true, unique: true })
  googleId: string; // JWT의 googleId

  // ✅ 예산 설정
  @Prop({ required: true }) diaperBudget: number;
  @Prop({ required: true }) sanitaryBudget: number;
  @Prop({ required: true }) feedingBudget: number;
  @Prop({ required: true }) skincareBudget: number;
  @Prop({ required: true }) foodBudget: number;
  @Prop({ required: true }) toysBudget: number;
  @Prop({ required: true }) beddingBudget: number;
  @Prop({ required: true }) fashionBudget: number;
  @Prop({ required: true }) otherBudget: number;
  @Prop({ required: true }) totalBudget: number;

  // ✅ 카테고리별 개별 지출 내역 (배열)
  @Prop({ type: [Expense], default: [] }) diaper: Expense[];
  @Prop({ type: [Expense], default: [] }) sanitary: Expense[];
  @Prop({ type: [Expense], default: [] }) feeding: Expense[];
  @Prop({ type: [Expense], default: [] }) skincare: Expense[];
  @Prop({ type: [Expense], default: [] }) food: Expense[];
  @Prop({ type: [Expense], default: [] }) toys: Expense[];
  @Prop({ type: [Expense], default: [] }) bedding: Expense[];
  @Prop({ type: [Expense], default: [] }) fashion: Expense[];
  @Prop({ type: [Expense], default: [] }) other: Expense[];

  // ✅ 총 사용된 금액
  @Prop({ default: 0 }) totalSpent: number;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
