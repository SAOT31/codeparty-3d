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
  stars?: number;
  shield: boolean;
  boostActive: boolean;
  connected: boolean;
  tileIndex?: number;
  characterType?: string;
  isBot?: boolean;
}

export type TileType = 'blue' | 'red' | 'trivia' | 'power' | 'star';

export interface BoardTile {
  index: number;
  position: Vector3D;
  type: TileType;
  label?: string;
}

export interface GameState {
  salaId: string;
  codigo: string;
  tema: string;
  scenarioId?: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Record<string, PlayerState>;
  hostId: string;
  winnerId?: string;
  currentTurnPlayerId?: string;
  currentRound?: number;
  roundNumber?: number;
  totalRounds?: number;
  targetStars?: number;
  targetPoints?: number;
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