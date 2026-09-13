import * as THREE from 'three';
import { IslaArcoirisScenario } from './isla-arcoiris';
import { VolcanCodigoScenario } from './volcan-codigo';
import { GalaxiaPixelScenario } from './galaxia-pixel';

import { SugarKingdomScenario } from './sugar-kingdom';

export type ScenarioId = 'isla' | 'volcan' | 'galaxia' | 'sugar';

export interface ScenarioDef {
  id: ScenarioId;
  name: string;
  emoji: string;
  description: string;
  previewColor: string;
}

export const SCENARIO_DEFS: ScenarioDef[] = [
  {
    id: 'isla',
    name: 'Isla Tropical',
    emoji: '🏝️',
    description: 'Tablero flotante en el océano con palmeras y casillas de césped brillante.',
    previewColor: '#87CEEB',
  },
  {
    id: 'sugar',
    name: 'Reino Dulce',
    emoji: '🍰',
    description: 'Tablero pastel de galleta y chocolate con paletas gigantes.',
    previewColor: '#ffd1dc',
  },
  {
    id: 'galaxia',
    name: 'Galaxia Pixel',
    emoji: '🌌',
    description: 'Parque espacial con estrellas titilantes y rieles cósmicos.',
    previewColor: '#020818',
  },
  {
    id: 'volcan',
    name: 'Volcán del Código',
    emoji: '🌋',
    description: 'Circuito de roca volcánica con lava brillante y fuegos de neón.',
    previewColor: '#1a0800',
  },
];

export class ScenarioFactory {
  static build(scene: THREE.Scene, scenarioId: ScenarioId): void {
    switch (scenarioId) {
      case 'isla':    IslaArcoirisScenario.build(scene); break;
      case 'volcan':  VolcanCodigoScenario.build(scene); break;
      case 'galaxia': GalaxiaPixelScenario.build(scene); break;
      case 'sugar':   SugarKingdomScenario.build(scene); break;
      default:        IslaArcoirisScenario.build(scene); break;
    }
  }

  static getDef(id: ScenarioId): ScenarioDef {
    return SCENARIO_DEFS.find(s => s.id === id) || SCENARIO_DEFS[0];
  }
}