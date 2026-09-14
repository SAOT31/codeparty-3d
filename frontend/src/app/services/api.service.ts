import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalaResponse {
  id: string;
  codigo: string;
  tema: string;
  estado: 'WAITING' | 'PLAYING' | 'FINISHED';
  capacidad_maxima: number;
}

export interface UnirseResponse {
  sala: SalaResponse;
  jugador: {
    id: string;
    sala_id: string;
    nickname: string;
    conectado: boolean;
    puntaje: number;
    color: string;
  };
}

export interface SalaActivaItem {
  id: string;
  codigo: string;
  tema: string;
  estado: string;
  jugadoresCount: number;
  maxJugadores: number;
  created_at: string;
}

export interface SalasActivasResponse {
  hostIp: string;
  salas: SalaActivaItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = typeof window !== 'undefined'
    ? ((window as any).__CODEARENA_SERVER_URL__ || `http://${window.location.hostname || 'localhost'}:3000`)
    : 'http://localhost:3000';

  constructor(private readonly http: HttpClient) {}

  crearSala(tema: string, dificultad: string = 'basico', targetStars: number = 2, targetPoints: number = 100): Observable<SalaResponse> {
    return this.http.post<SalaResponse>(`${this.baseUrl}/salas`, { tema, dificultad, targetStars, targetPoints });
  }

  unirseSala(codigo: string, nickname: string, color: string): Observable<UnirseResponse> {
    return this.http.post<UnirseResponse>(`${this.baseUrl}/salas/${codigo}/unirse`, {
      nickname,
      color,
    });
  }

  obtenerSala(codigo: string): Observable<{ sala: SalaResponse; jugadores: any[] }> {
    return this.http.get<{ sala: SalaResponse; jugadores: any[] }>(`${this.baseUrl}/salas/${codigo}`);
  }

  obtenerSalasActivas(): Observable<SalasActivasResponse> {
    return this.http.get<SalasActivasResponse>(`${this.baseUrl}/salas/activas`);
  }

  obtenerPregunta(tema: string = 'Angular', habilidad: string = 'trivia'): Observable<{ enunciado: string; opciones: string[]; correcta: number; dificultad: string }> {
    return this.http.post<{ enunciado: string; opciones: string[]; correcta: number; dificultad: string }>(`${this.baseUrl}/ai/pregunta`, {
      tema,
      habilidad,
    });
  }
}