import { Controller, Post, Body } from '@nestjs/common';
import { AiService, PreguntaResponse } from './ai.service';

class GenerarPreguntaDto {
  tema: string;
  habilidad: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('pregunta')
  async generarPregunta(@Body() body: GenerarPreguntaDto): Promise<PreguntaResponse> {
    const tema = body.tema || 'Angular';
    const habilidad = body.habilidad || 'boost';
    return this.aiService.generarPregunta(tema, habilidad);
  }
}