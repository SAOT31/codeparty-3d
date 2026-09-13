import { BaseCharacter } from './base.character';
import { StarCharacter } from './star.character';
import { MushroomCharacter } from './mushroom.character';
import { CrystalCharacter } from './crystal.character';
import { RocketCharacter } from './rocket.character';

export type CharacterType = 'star' | 'mushroom' | 'crystal' | 'rocket';

export interface CharacterDef {
  type: CharacterType;
  name: string;
  emoji: string;
  description: string;
  color: string;
  playerColor?: string;
}

export const CHARACTER_DEFS: CharacterDef[] = [
  {
    type: 'star',
    name: 'Estrellita',
    emoji: '⭐',
    description: 'Ágil y brillante. Sus destellos confunden a los rivales.',
    color: '#FFD700',
  },
  {
    type: 'mushroom',
    name: 'Hongito',
    emoji: '🍄',
    description: 'Robusto y alegre. Su sombrero absorbe parte del daño.',
    color: '#FF4757',
  },
  {
    type: 'crystal',
    name: 'Cristalín',
    emoji: '💎',
    description: 'Misterioso y frío. Brilla con luz propia y confunde al enemigo.',
    color: '#4ECDC4',
  },
  {
    type: 'rocket',
    name: 'Cohete',
    emoji: '🚀',
    description: 'Veloz y explosivo. Sus llamas asustan a los oponentes.',
    color: '#FF6B35',
  },
];

export class CharacterFactory {
  static create(type: CharacterType, colorHex?: string): BaseCharacter {
    const def = CHARACTER_DEFS.find(d => d.type === type);
    const color = colorHex || def?.color || '#FFD700';

    switch (type) {
      case 'star':     return new StarCharacter(color);
      case 'mushroom': return new MushroomCharacter(color);
      case 'crystal':  return new CrystalCharacter(color);
      case 'rocket':   return new RocketCharacter(color);
      default:         return new StarCharacter(color);
    }
  }

  static getRandomType(exclude: CharacterType[] = []): CharacterType {
    const all: CharacterType[] = ['star', 'mushroom', 'crystal', 'rocket'];
    const available = all.filter(t => !exclude.includes(t));
    return available[Math.floor(Math.random() * available.length)] || 'star';
  }
}