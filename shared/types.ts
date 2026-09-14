export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  color: string;
  position: Vector3D;
  rotation: { y: number };
  health: number;
  score: number;
  shield: boolean;
  boostActive: boolean;
  connected: boolean;
}

export interface GameState {
  salaId: string;
  codigo: string;
  tema: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Record<string, PlayerState>;
  hostId: string;
  winnerId?: string;
}

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
  dificultad: 'facil' | 'media' | 'dificil';
}

export type Habilidad = 'boost' | 'attack' | 'shield';

export const DRONE_COLORS = [
  '#00f5ff',
  '#bf00ff',
  '#ff003c',
  '#00ff88',
];
