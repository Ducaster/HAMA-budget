import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ required: true })
  googleId: string; // JWT의 googleId

  @Prop({
    type: [{ year: Number, month: Number, categories: Object }],
    default: [],
  })
  budgets: {
    year: number;
    month: number;
    categories: Record<string, number>;
  }[]; // ✅ 년/월별 카테고리별 예산 저장

  @Prop({ required: true, default: 0 })
  totalSpent: number; // 총 지출

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  diaper: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  sanitary: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  feeding: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  skincare: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  food: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  toys: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  bedding: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  fashion: any[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  other: any[];
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
