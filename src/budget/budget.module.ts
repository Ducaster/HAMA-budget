import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }]),
    RedisModule,
  ],
  providers: [BudgetService],
  controllers: [BudgetController],
})
export class BudgetModule {}
