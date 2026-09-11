import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { customAlphabet } from 'nanoid';
import * as os from 'os';

const generarCodigo = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export interface SalaActivaInfo {
  id: string;
  codigo: string;
  tema: string;
  estado: string;
  jugadoresCount: number;
  maxJugadores: number;
  created_at: string;
}

export interface SalaData {
  id: string;
  codigo: string;
  tema: string;
  estado: 'WAITING' | 'PLAYING' | 'FINISHED';
  capacidad_maxima: number;
  created_at: string;
  targetStars?: number;
  targetPoints?: number;
}

export interface JugadorData {
  id: string;
  sala_id: string;
  nickname: string;
  conectado: boolean;
  puntaje: number;
  color: string;
}

@Injectable()
export class SalasService {
  private salasMemoria = new Map<string, SalaData>();
  private jugadoresMemoria = new Map<string, JugadorData[]>();

  constructor(private readonly supabaseService: SupabaseService) {}

  async crearSala(tema: string, targetStars: number = 2, targetPoints: number = 100): Promise<SalaData> {
    const codigo = generarCodigo();
    const pool = this.supabaseService.getPool();

    if (pool) {
      try {
        const res = await pool.query(
          'INSERT INTO salas(codigo, tema, estado, capacidad_maxima) VALUES ($1, $2, $3, $4) RETURNING *',
          [codigo, tema || 'Angular', 'WAITING', 4]
        );
        if (res.rows[0]) {
          const s = { ...res.rows[0], targetStars, targetPoints } as SalaData;
          this.salasMemoria.set(codigo, s);
          this.jugadoresMemoria.set(s.id, []);
          return s;
        }
      } catch {}
    }

    const nuevaSala: SalaData = {
      id: 'sala_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      codigo,
      tema: tema || 'Angular',
      estado: 'WAITING',
      capacidad_maxima: 4,
      created_at: new Date().toISOString(),
      targetStars,
      targetPoints,
    };
    this.salasMemoria.set(codigo, nuevaSala);
    this.jugadoresMemoria.set(nuevaSala.id, []);
    return nuevaSala;
  }

  async obtenerPorCodigo(codigo: string): Promise<{ sala: SalaData; jugadores: JugadorData[] }> {
    const codigoUpper = codigo.toUpperCase();
    const pool = this.supabaseService.getPool();

    if (pool) {
      try {
        const resSala = await pool.query('SELECT * FROM salas WHERE codigo = $1', [codigoUpper]);
        if (resSala.rows[0]) {
          const s = resSala.rows[0] as SalaData;
          const resJ = await pool.query('SELECT * FROM jugadores WHERE sala_id = $1', [s.id]);
          return {
            sala: s,
            jugadores: (resJ.rows as JugadorData[]) || [],
          };
        }
      } catch {}
    }

    const salaMem = this.salasMemoria.get(codigoUpper);
    if (!salaMem) {
      throw new NotFoundException(`La sala con codigo "${codigoUpper}" no existe.`);
    }

    const jugadores = this.jugadoresMemoria.get(salaMem.id) || [];
    return { sala: salaMem, jugadores };
  }

  async unirseSala(codigo: string, nickname: string, color: string): Promise<{ sala: SalaData; jugador: JugadorData }> {
    const { sala, jugadores } = await this.obtenerPorCodigo(codigo);

    if (sala.estado !== 'WAITING') {
      throw new BadRequestException('La partida ya comenzo o ha finalizado.');
    }

    const pool = this.supabaseService.getPool();
    if (pool) {
      try {
        const resRpc = await pool.query(
          'SELECT * FROM unirse_sala_concurrente($1, $2, $3)',
          [sala.id, nickname, color || '#00f5ff']
        );
        if (resRpc.rows[0]) {
          return { sala, jugador: resRpc.rows[0] as JugadorData };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('SALA_LLENA')) {
          throw new BadRequestException('SALA_LLENA: La sala ha alcanzado su capacidad maxima de 4 jugadores.');
        }
      }
    }

    const jugadoresActivos = jugadores.filter(j => j.conectado);
    if (jugadoresActivos.length >= 4) {
      throw new BadRequestException('SALA_LLENA: La sala ha alcanzado su capacidad maxima de 4 jugadores.');
    }

    const lista = this.jugadoresMemoria.get(sala.id) || [];
    if (lista.filter(j => j.conectado).length >= 4) {
      throw new BadRequestException('SALA_LLENA: La sala ha alcanzado su capacidad maxima de 4 jugadores.');
    }

    const jugadorLocal: JugadorData = {
      id: 'jugador_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sala_id: sala.id,
      nickname,
      conectado: true,
      puntaje: 0,
      color: color || '#00f5ff',
    };

    lista.push(jugadorLocal);
    this.jugadoresMemoria.set(sala.id, lista);
    return { sala, jugador: jugadorLocal };
  }

  async cambiarEstado(salaId: string, nuevoEstado: 'WAITING' | 'PLAYING' | 'FINISHED'): Promise<void> {
    const pool = this.supabaseService.getPool();
    if (pool) {
      try {
        await pool.query('UPDATE salas SET estado = $1 WHERE id = $2', [nuevoEstado, salaId]);
      } catch {}
    }

    for (const sala of this.salasMemoria.values()) {
      if (sala.id === salaId) {
        sala.estado = nuevoEstado;
        break;
      }
    }
  }

  async actualizarPuntaje(jugadorId: string, puntos: number): Promise<void> {
    const pool = this.supabaseService.getPool();
    if (pool) {
      try {
        await pool.query('UPDATE jugadores SET puntaje = $1 WHERE id = $2', [puntos, jugadorId]);
      } catch {}
    }

    for (const jugadores of this.jugadoresMemoria.values()) {
      const j = jugadores.find(item => item.id === jugadorId);
      if (j) {
        j.puntaje = puntos;
        break;
      }
    }
  }

  async marcarDesconectado(jugadorId: string): Promise<void> {
    const pool = this.supabaseService.getPool();
    if (pool) {
      try {
        await pool.query('UPDATE jugadores SET conectado = false WHERE id = $1', [jugadorId]);
      } catch {}
    }

    for (const jugadores of this.jugadoresMemoria.values()) {
      const j = jugadores.find(item => item.id === jugadorId);
      if (j) {
        j.conectado = false;
        break;
      }
    }
  }

  getLocalIp(requestHost?: string): string {
    if (process.env.HOST_IP && !process.env.HOST_IP.startsWith('172.')) {
      return process.env.HOST_IP;
    }
    if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1' && !requestHost.startsWith('172.')) {
      return requestHost;
    }
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (!iface.internal && (iface.family === 'IPv4' || (iface as any).family === 4)) {
            const addr = iface.address;
            if (!addr.startsWith('127.') && !addr.startsWith('172.')) {
              return addr;
            }
          }
        }
      }
    } catch {}
    return (requestHost && !requestHost.startsWith('172.')) ? requestHost : 'localhost';
  }

  async listarSalasActivas(requestHost?: string): Promise<{ hostIp: string; salas: SalaActivaInfo[] }> {
    const hostIp = this.getLocalIp(requestHost);
    const pool = this.supabaseService.getPool();

    if (pool) {
      try {
        await pool.query(`
          UPDATE salas
          SET estado = 'FINISHED'
          WHERE estado = 'WAITING'
            AND (
              created_at < NOW() - INTERVAL '30 minutes'
              OR id NOT IN (SELECT DISTINCT sala_id FROM jugadores WHERE conectado = true)
            )
        `);

        const res = await pool.query(`
          SELECT s.id, s.codigo, s.tema, s.estado, s.capacidad_maxima, s.created_at,
                 COUNT(j.id) as jugadores_count
          FROM salas s
          INNER JOIN jugadores j ON j.sala_id = s.id AND j.conectado = true
          WHERE s.estado = 'WAITING'
            AND s.created_at >= NOW() - INTERVAL '30 minutes'
          GROUP BY s.id, s.codigo, s.tema, s.estado, s.capacidad_maxima, s.created_at
          HAVING COUNT(j.id) > 0
          ORDER BY s.created_at DESC
          LIMIT 12
        `);

        return {
          hostIp,
          salas: res.rows.map(r => ({
            id: r.id,
            codigo: r.codigo,
            tema: r.tema,
            estado: r.estado,
            jugadoresCount: Number(r.jugadores_count) || 0,
            maxJugadores: r.capacidad_maxima || 4,
            created_at: r.created_at,
          })),
        };
      } catch {}
    }

    const salasResult: SalaActivaInfo[] = [];
    for (const sala of this.salasMemoria.values()) {
      if (sala.estado === 'WAITING') {
        const jList = (this.jugadoresMemoria.get(sala.id) || []).filter(j => j.conectado);
        if (jList.length > 0) {
          salasResult.push({
            id: sala.id,
            codigo: sala.codigo,
            tema: sala.tema,
            estado: sala.estado,
            jugadoresCount: jList.length,
            maxJugadores: sala.capacidad_maxima || 4,
            created_at: sala.created_at,
          });
        } else {
          sala.estado = 'FINISHED';
        }
      }
    }

    return { hostIp, salas: salasResult };
  }
}