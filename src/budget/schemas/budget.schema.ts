import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BudgetDocument = Budget & Document;

interface SpendingItem {
  uid: string;
  date: string;
  itemName: string;
  amount: number;
}

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
  diaper: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  sanitary: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  feeding: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  skincare: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  food: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  toys: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  bedding: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  fashion: SpendingItem[];

  @Prop({
    type: [{ date: String, itemName: String, amount: Number, uid: String }],
    default: [],
  })
  other: SpendingItem[];
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
export { SpendingItem }; // Export for use in service
