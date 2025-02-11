import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Req,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateSpendingDto } from './dto/create-spending.dto';
import { UpdateSpendingDto } from './dto/update-spending.dto';
import { CreateMultipleSpendingDto } from './dto/create-multiple-spending.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ✅ 특정 년/월의 예산 설정
  @Post()
  @UseGuards(JwtAuthGuard)
  async createBudget(@Body() createBudgetDto: CreateBudgetDto, @Req() req) {
    const googleId = req.user.googleId;
    return this.budgetService.createBudget(createBudgetDto, googleId);
  }

  // ✅ 전체 예산 조회 API
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllBudgets(@Req() req) {
    const googleId = req.user.googleId;
    return this.budgetService.getAllBudgets(googleId);
  }

  // ✅ 지출 추가
  @Post('spending')
  @UseGuards(JwtAuthGuard)
  async addSpending(@Body() createSpendingDto: CreateSpendingDto, @Req() req) {
    const googleId = req.user.googleId;
    return this.budgetService.addSpending(createSpendingDto, googleId);
  }

  // ✅ 여러 개의 지출 기록 추가 API
  @Post('spendings')
  @UseGuards(JwtAuthGuard) // JWT 인증 필수
  async addMultipleSpendings(
    @Body() createMultipleSpendingDto: CreateMultipleSpendingDto,
    @Req() req,
  ) {
    const googleId = req.user.googleId; // JWT에서 Google ID 추출
    return this.budgetService.addMultipleSpendings(
      createMultipleSpendingDto,
      googleId,
    );
  }

  // ✅ 지출 내역 조회
  @Get('spending')
  @UseGuards(JwtAuthGuard)
  async getSpending(@Req() req) {
    const googleId = req.user.googleId;
    return this.budgetService.getSpending(googleId);
  }

  // ✅ 특정 카테고리의 지출 내역 조회
  @Get('spending/:category')
  @UseGuards(JwtAuthGuard)
  async getSpendingByCategory(@Req() req, @Param('category') category: string) {
    const googleId = req.user.googleId;
    return this.budgetService.getSpendingByCategory(googleId, category);
  }

  // ✅ 지출 수정
  @Put('spending/:uid')
  @UseGuards(JwtAuthGuard)
  async updateSpending(
    @Param('uid') uid: string,
    @Body() updateSpendingDto: UpdateSpendingDto,
    @Req() req,
  ) {
    const googleId = req.user.googleId;
    return this.budgetService.updateSpending(googleId, uid, updateSpendingDto);
  }

  // ✅ 지출 삭제
  @Delete('spending/:uid')
  @UseGuards(JwtAuthGuard)
  async deleteSpending(@Param('uid') uid: string, @Req() req) {
    const googleId = req.user.googleId;
    return this.budgetService.deleteSpending(googleId, uid);
  }

  // ✅ 사용자 예산 삭제
  @Delete()
  @UseGuards(JwtAuthGuard) // JWT 인증 필수
  async deleteBudget(@Req() req) {
    const googleId = req.user.googleId; // JWT에서 Google ID 추출
    return this.budgetService.deleteBudget(googleId);
  }
}
