import { Controller, Post, Get, Param, Body, Req } from '@nestjs/common';
import { SalasService, SalaData, JugadorData } from './salas.service';
import { Request } from 'express';

class CrearSalaDto {
  tema: string;
  targetStars?: number;
  targetPoints?: number;
}

class UnirseSalaDto {
  nickname: string;
  color?: string;
}

@Controller('salas')
export class SalasController {
  constructor(private readonly salasService: SalasService) {}

  @Post()
  async crear(@Body() body: CrearSalaDto): Promise<SalaData> {
    return this.salasService.crearSala(body.tema, body.targetStars, body.targetPoints);
  }

  @Get('activas')
  async listarActivas(@Req() req: Request) {
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers['host']) as string;
    const reqHost = typeof hostHeader === 'string' ? hostHeader.split(':')[0] : undefined;
    return this.salasService.listarSalasActivas(reqHost);
  }

  @Get()
  async listar(@Req() req: Request) {
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers['host']) as string;
    const reqHost = typeof hostHeader === 'string' ? hostHeader.split(':')[0] : undefined;
    return this.salasService.listarSalasActivas(reqHost);
  }

  @Get(':codigo')
  async obtener(@Param('codigo') codigo: string): Promise<{ sala: SalaData; jugadores: JugadorData[] }> {
    return this.salasService.obtenerPorCodigo(codigo);
  }

  @Post(':codigo/unirse')
  async unirse(
    @Param('codigo') codigo: string,
    @Body() body: UnirseSalaDto,
  ): Promise<{ sala: SalaData; jugador: JugadorData }> {
    return this.salasService.unirseSala(codigo, body.nickname, body.color || '#00f5ff');
  }
}