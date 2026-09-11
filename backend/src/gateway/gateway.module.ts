import { Module } from '@nestjs/common';
import { ArenaGateway } from './arena.gateway';
import { SalasModule } from '../salas/salas.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SalasModule, AiModule],
  providers: [ArenaGateway],
})
export class GatewayModule {}