import { Module } from '@nestjs/common';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          // 비밀번호 제거
          // password: process.env.REDIS_PASSWORD, // 비밀번호가 없으므로 주석 처리
          tls: {}, // AWS MemoryDB는 TLS를 사용하므로 추가
        });
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
