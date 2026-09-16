import * as THREE from 'three';
import { IslaArcoirisScenario } from './isla-arcoiris';
import { SugarKingdomScenario } from './sugar-kingdom';
import { ParqueDiversionesScenario } from './parque-diversiones';
import { BosqueEncantadoScenario } from './bosque-encantado';

export type ScenarioId = 'isla' | 'sugar' | 'parque' | 'bosque';

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
    id: 'parque',
    name: 'Parque Mágico',
    emoji: '🎪',
    description: 'Feria festiva con carpas de circo, ruedas de la fortuna y globos aerostáticos.',
    previewColor: '#ffe082',
  },
  {
    id: 'bosque',
    name: 'Bosque Encantado',
    emoji: '🍄',
    description: 'Valle mágico con casas de hongos, flores gigantes y luciérnagas brillantes.',
    previewColor: '#52b788',
  },
];

export class ScenarioFactory {
  static build(scene: THREE.Scene, scenarioId: ScenarioId): void {
    switch (scenarioId) {
      case 'isla':   IslaArcoirisScenario.build(scene); break;
      case 'sugar':  SugarKingdomScenario.build(scene); break;
      case 'parque': ParqueDiversionesScenario.build(scene); break;
      case 'bosque': BosqueEncantadoScenario.build(scene); break;
      default:       IslaArcoirisScenario.build(scene); break;
    }
  }

  static getDef(id: ScenarioId): ScenarioDef {
    return SCENARIO_DEFS.find(s => s.id === id) || SCENARIO_DEFS[0];
  }
}