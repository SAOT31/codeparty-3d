import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { SalasModule } from './salas/salas.module';
import { AiModule } from './ai/ai.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    SalasModule,
    AiModule,
    GatewayModule,
  ],
})
export class AppModule {}