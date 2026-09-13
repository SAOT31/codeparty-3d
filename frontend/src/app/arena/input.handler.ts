export type InputMode = 'lan' | 'local';
export type PlayerSlot = 1 | 2 | 3;

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  skill1: boolean;
  skill2: boolean;
  skill3: boolean;
}

export class InputHandler {
  private keys: Set<string> = new Set();
  private mode: InputMode;
  private slot: PlayerSlot;

  private readonly KEY_MAPS = {
    lan: {
      forward: ['KeyW', 'ArrowUp'],
      backward: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      up: ['KeyE'],
      down: ['KeyQ'],
      shoot: ['Space', 'KeyF'],
      skill1: ['Digit1'],
      skill2: ['Digit2'],
      skill3: ['Digit3'],
    },
    local_1: {
      forward: ['KeyW'],
      backward: ['KeyS'],
      left: ['KeyA'],
      right: ['KeyD'],
      up: ['KeyE'],
      down: ['KeyQ'],
      shoot: ['Space', 'KeyF'],
      skill1: ['Digit1'],
      skill2: ['Digit2'],
      skill3: ['Digit3'],
    },
    local_2: {
      forward: ['KeyI'],
      backward: ['KeyK'],
      left: ['KeyJ'],
      right: ['KeyL'],
      up: ['KeyY'],
      down: ['KeyH'],
      shoot: ['Enter', 'KeyG'],
      skill1: ['Digit7'],
      skill2: ['Digit8'],
      skill3: ['Digit9'],
    },
    local_3: {
      forward: ['ArrowUp'],
      backward: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      up: ['PageUp'],
      down: ['PageDown'],
      shoot: ['ShiftRight', 'Numpad0'],
      skill1: ['Numpad1'],
      skill2: ['Numpad2'],
      skill3: ['Numpad3'],
    },
  };

  constructor(mode: InputMode = 'lan', slot: PlayerSlot = 1) {
    this.mode = mode;
    this.slot = slot;
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  private getMap(): Record<string, string[]> {
    if (this.mode === 'lan') return this.KEY_MAPS.lan;
    return this.KEY_MAPS[`local_${this.slot}` as 'local_1' | 'local_2' | 'local_3'] || this.KEY_MAPS.local_1;
  }

  private isPressed(action: string): boolean {
    const map = this.getMap();
    const keys = map[action] || [];
    return keys.some(k => this.keys.has(k));
  }

  getState(): InputState {
    return {
      forward:  this.isPressed('forward'),
      backward: this.isPressed('backward'),
      left:     this.isPressed('left'),
      right:    this.isPressed('right'),
      up:       this.isPressed('up'),
      down:     this.isPressed('down'),
      shoot:    this.isPressed('shoot'),
      skill1:   this.isPressed('skill1'),
      skill2:   this.isPressed('skill2'),
      skill3:   this.isPressed('skill3'),
    };
  }

  destroy() {
    window.removeEventListener('keydown', (e) => this.keys.delete(e.code));
    window.removeEventListener('keyup', (e) => this.keys.delete(e.code));
    this.keys.clear();
  }
}