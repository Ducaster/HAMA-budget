import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import { Budget, BudgetDocument, SpendingItem } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateSpendingDto } from './dto/create-spending.dto';
import { UpdateSpendingDto } from './dto/update-spending.dto';
import { CreateMultipleSpendingDto } from './dto/create-multiple-spending.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BudgetService {
  private readonly validCategories = [
    'diaper',
    'sanitary',
    'feeding',
    'skincare',
    'food',
    'toys',
    'bedding',
    'fashion',
    'other',
  ];

  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  // ✅ Valkey에서 사용자의 월 예산 가져오기
  async getUserBudget(googleId: string): Promise<number> {
    const userKey = `user:${googleId}`;

    const userData = await this.redisClient.get(userKey);

    if (!userData) {
      throw new NotFoundException('User data not found in Valkey');
    }

    const user = JSON.parse(userData);

    if (!user.monthlyBudget) {
      throw new NotFoundException(
        'User budget (monthlyBudget) not found in Valkey',
      );
    }

    return user.monthlyBudget;
  }

  // ✅ 사용자 예산 설정 (년도, 월별 카테고리 예산 추가)
  async createBudget(createBudgetDto: CreateBudgetDto, googleId: string) {
    const { year, month, categories } = createBudgetDto;

    // ✅ 총 예산 계산
    const totalBudget = Object.values(categories).reduce(
      (sum, value) => sum + value,
      0,
    );

    // ✅ Valkey에서 사용자 예산 조회
    const userBudget = await this.getUserBudget(googleId);

    // ✅ 예산 초과 여부 체크 (초과해도 저장은 진행)
    if (totalBudget > Number(userBudget)) {
      throw new ForbiddenException('Total amount exceeds user budget');
    }

    // ✅ 기존 예산이 있는지 확인
    let budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      budget = new this.budgetModel({ googleId, budgets: [], totalSpent: 0 });
    }

    // ✅ 해당 년/월 예산이 있는지 확인
    const existingBudgetIndex = budget.budgets.findIndex(
      (b) => b.year === year && b.month === month,
    );

    if (existingBudgetIndex !== -1) {
      // ✅ 기존 예산이 있다면 업데이트
      budget.budgets[existingBudgetIndex].categories = categories;
    } else {
      // ✅ 없으면 새로 추가
      budget.budgets.push({ year, month, categories });
    }

    return budget.save();
  }

  // ✅ 전체 예산 조회 (특정 년/월 없이 모든 예산 반환)
  async getAllBudgets(googleId: string) {
    const budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    return budget.budgets; // 모든 예산 데이터 반환
  }

  // ✅ 지출 기록 추가 (UID 자동 생성)
  async addSpending(createSpendingDto: CreateSpendingDto, googleId: string) {
    const { date, category, itemName, amount } = createSpendingDto;

    // ✅ 유효한 카테고리인지 확인
    if (!this.validCategories.includes(category)) {
      throw new BadRequestException('Invalid category provided.');
    }

    let budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    // ✅ 해당 카테고리에 새로운 지출 추가 (UID 포함)
    budget[category].push({
      uid: uuidv4(), // ✅ UUID 자동 생성
      date,
      itemName,
      amount,
    });

    // ✅ 총 지출 금액 계산
    budget.totalSpent += amount;

    return budget.save();
  }

  // ✅ 여러 개의 지출 추가 (배열로 입력받음)
  async addMultipleSpendings(
    createMultipleSpendingDto: CreateMultipleSpendingDto,
    googleId: string,
  ) {
    const { spendings } = createMultipleSpendingDto;

    let budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    let totalNewSpending = 0;

    // ✅ 지출 내역 추가
    for (const spending of spendings) {
      const { date, category, itemName, amount } = spending;

      // ✅ 유효한 카테고리인지 확인
      if (!this.validCategories.includes(category)) {
        throw new BadRequestException(`Invalid category: ${category}`);
      }

      // ✅ UID를 포함하여 지출 항목 추가
      const newSpending = {
        uid: uuidv4(), // ✅ UUID 자동 생성
        date,
        itemName,
        amount,
      };

      budget[category].push(newSpending);
      totalNewSpending += amount;
    }

    // ✅ 총 지출 금액 업데이트
    budget.totalSpent += totalNewSpending;
    await budget.save();

    // ✅ 추가된 지출 항목 반환
    return { message: 'Multiple spendings successfully added', spendings };
  }

  // ✅ 지출 내역 조회
  async getSpending(googleId: string) {
    const budget = await this.budgetModel.findOne({ googleId }).exec();
    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    return {
      googleId: budget.googleId,
      spending: this.validCategories.map((category) => ({
        category,
        details: budget[category],
      })),
      totalSpent: budget.totalSpent,
    };
  }

  // ✅ 특정 카테고리 지출 내역 조회
  async getSpendingByCategory(googleId: string, category: string) {
    const budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    // ✅ 유효한 카테고리인지 확인
    if (!this.validCategories.includes(category)) {
      throw new NotFoundException(`Invalid category: ${category}`);
    }

    return {
      googleId: budget.googleId,
      category,
      details: budget[category] || [], // 해당 카테고리의 지출 내역 반환
    };
  }

  // ✅ 지출 수정 (수정된 지출 내역만 반환)
  async updateSpending(
    googleId: string,
    uid: string,
    updateSpendingDto: UpdateSpendingDto,
  ) {
    const { date, category, itemName, amount } = updateSpendingDto;

    // ✅ 유효한 카테고리인지 확인
    if (!this.validCategories.includes(category)) {
      throw new BadRequestException('Invalid category provided.');
    }

    let budget = await this.budgetModel.findOne({ googleId }).exec();
    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    let existingCategory: string | null = null;
    let existingIndex: number = -1;
    let existingSpending: SpendingItem | null = null;

    // ✅ 모든 카테고리에서 해당 `uid`를 찾기
    for (const cat of this.validCategories) {
      const spendingCategory = budget[cat] as SpendingItem[]; // 타입 캐스팅 추가
      const index = spendingCategory.findIndex(
        (spending) => spending.uid === uid,
      );

      if (index !== -1) {
        existingCategory = cat;
        existingIndex = index;
        existingSpending = spendingCategory[index];
        break;
      }
    }

    if (!existingSpending) {
      throw new NotFoundException(`Spending record with UID ${uid} not found.`);
    }

    // ✅ 기존 총 지출 금액 차감
    budget.totalSpent -= existingSpending.amount;

    // ✅ 기존 카테고리에서 해당 지출 제거
    if (existingCategory) {
      budget[existingCategory] = budget[existingCategory].filter(
        (spending) => spending.uid !== uid,
      );
    }

    // ✅ 새로운 카테고리에 지출 추가
    const updatedSpending = { uid, date, itemName, amount };
    budget[category].push(updatedSpending);

    // ✅ 새로운 총 지출 금액 추가
    budget.totalSpent += amount;

    await budget.save();

    // ✅ 카테고리도 함께 반환
    return {
      category, // 변경된 카테고리
      spending: updatedSpending, // 수정된 지출 항목
    };
  }

  // ✅ 지출 삭제 (성공 메시지만 반환)
  async deleteSpending(googleId: string, uid: string) {
    let budget = await this.budgetModel.findOne({ googleId }).exec();
    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    let deletedAmount = 0;
    let categoryFound: string | null = null;

    // ✅ 모든 카테고리에서 해당 UID 찾기
    for (const category of this.validCategories) {
      const spendingCategory = budget[category];
      const spendingIndex = spendingCategory.findIndex(
        (spending) => spending.uid === uid,
      );

      if (spendingIndex !== -1) {
        deletedAmount = spendingCategory[spendingIndex].amount;
        spendingCategory.splice(spendingIndex, 1);
        categoryFound = category;
        break;
      }
    }

    if (!categoryFound) {
      throw new NotFoundException(`Spending record with UID ${uid} not found.`);
    }

    // ✅ 총 지출 금액에서 차감
    budget.totalSpent -= deletedAmount;
    await budget.save();

    // ✅ 성공 메시지만 반환
    return { message: 'Spending record successfully deleted' };
  }

  // ✅ 사용자 예산 삭제 (MongoDB에서 삭제)
  async deleteBudget(googleId: string) {
    const budget = await this.budgetModel.findOne({ googleId }).exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    await this.budgetModel.deleteOne({ googleId }).exec();

    return { message: 'User budget successfully deleted' };
  }
}
