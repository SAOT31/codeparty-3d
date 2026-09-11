import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase/supabase.service';
import { FALLBACK_PREGUNTAS_ANGULAR } from './fallback-questions';

export interface PreguntaResponse {
  enunciado: string;
  opciones: string[];
  correcta: number;
  dificultad: 'facil' | 'media' | 'dificil';
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly supabaseService: SupabaseService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generarPregunta(tema: string, habilidad: string): Promise<PreguntaResponse> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          Genera una pregunta basica de opcion multiple sobre "${tema}" para desbloquear la habilidad "${habilidad}" en un videojuego educativo.
          Es para nivel principiante / estudiante.
          Debes responder UNICAMENTE con un objeto JSON valido con esta estructura exacta sin bloques de codigo markdown ni comentarios:
          {"enunciado": "texto de la pregunta", "opciones": ["opcion 0", "opcion 1", "opcion 2", "opcion 3"], "correcta": 0, "dificultad": "facil"}
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        if (text.startsWith('```json')) {
          text = text.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (text.startsWith('```')) {
          text = text.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(text);

        if (this.esPreguntaValida(parsed)) {
          return {
            enunciado: parsed.enunciado,
            opciones: parsed.opciones,
            correcta: Number(parsed.correcta),
            dificultad: parsed.dificultad || 'facil',
          };
        }
      } catch {}
    }

    return this.obtenerDeBaseDeDatos(tema);
  }

  private async obtenerDeBaseDeDatos(tema: string): Promise<PreguntaResponse> {
    const pool = this.supabaseService.getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT enunciado, opciones, correcta, dificultad FROM preguntas WHERE LOWER(tema) = LOWER($1) ORDER BY RANDOM() LIMIT 1`,
          [tema]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            enunciado: row.enunciado,
            opciones: Array.isArray(row.opciones) ? row.opciones : JSON.parse(row.opciones),
            correcta: Number(row.correcta),
            dificultad: row.dificultad || 'facil',
          };
        }

        const fallbackDb = await pool.query(
          `SELECT enunciado, opciones, correcta, dificultad FROM preguntas ORDER BY RANDOM() LIMIT 1`
        );
        if (fallbackDb.rows.length > 0) {
          const row = fallbackDb.rows[0];
          return {
            enunciado: row.enunciado,
            opciones: Array.isArray(row.opciones) ? row.opciones : JSON.parse(row.opciones),
            correcta: Number(row.correcta),
            dificultad: row.dificultad || 'facil',
          };
        }
      } catch {}
    }

    return this.obtenerFallback();
  }

  private esPreguntaValida(obj: any): boolean {
    return (
      obj &&
      typeof obj.enunciado === 'string' &&
      obj.enunciado.length > 5 &&
      Array.isArray(obj.opciones) &&
      obj.opciones.length === 4 &&
      typeof obj.correcta === 'number' &&
      obj.correcta >= 0 &&
      obj.correcta <= 3 &&
      typeof obj.dificultad === 'string'
    );
  }

  private obtenerFallback(): PreguntaResponse {
    const randomIndex = Math.floor(Math.random() * FALLBACK_PREGUNTAS_ANGULAR.length);
    const item = FALLBACK_PREGUNTAS_ANGULAR[randomIndex];
    return {
      enunciado: item.enunciado,
      opciones: item.opciones,
      correcta: item.correcta,
      dificultad: item.dificultad,
    };
  }
}