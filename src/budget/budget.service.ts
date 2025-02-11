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
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateSpendingDto } from './dto/create-spending.dto';
import { UpdateSpendingDto } from './dto/update-spending.dto';
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

  // ✅ 사용자 예산 설정 (업데이트 또는 생성)
  async createBudget(createBudgetDto: CreateBudgetDto, googleId: string) {
    const totalBudget = Object.values(createBudgetDto).reduce(
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

    if (budget) {
      // ✅ 기존 예산이 있다면 업데이트
      Object.assign(budget, createBudgetDto);
      budget.totalBudget = totalBudget;
      return budget.save();
    } else {
      // ✅ 기존 예산이 없으면 새로 생성
      const newBudget = new this.budgetModel({
        googleId,
        ...createBudgetDto,
        totalBudget,
        totalSpent: 0,
      });
      return newBudget.save();
    }
  }

  // ✅ 사용자 예산 조회 (지출 내역 제외)
  async getBudget(googleId: string): Promise<Partial<Budget>> {
    const budget = await this.budgetModel
      .findOne({ googleId })
      .select(
        '-spending -totalSpent -diaper -sanitary -feeding -skincare -food -toys -bedding -fashion -other',
      ) // ❌ 지출 내역 & 총 지출 제외
      .exec();

    if (!budget) {
      throw new NotFoundException('Budget not found for user');
    }

    return budget;
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

    // ✅ UID에 해당하는 지출 항목 찾기
    const spendingCategory = budget[category];
    const spendingIndex = spendingCategory.findIndex(
      (spending) => spending.uid === uid,
    );

    if (spendingIndex === -1) {
      throw new NotFoundException(`Spending record with UID ${uid} not found.`);
    }

    // ✅ 기존 금액 차감 후 새로운 값 반영
    budget.totalSpent -= spendingCategory[spendingIndex].amount; // 기존 금액 차감
    spendingCategory[spendingIndex] = { uid, date, itemName, amount }; // 새 값으로 업데이트
    budget.totalSpent += amount; // 새로운 금액 반영

    await budget.save();

    // ✅ 수정된 지출 내역만 반환
    return spendingCategory[spendingIndex];
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
}
