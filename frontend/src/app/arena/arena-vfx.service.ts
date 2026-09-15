import { Injectable } from '@angular/core';
import { HapticService } from '../services/haptic.service';
import { CameraController } from './camera.controller';

@Injectable({ providedIn: 'root' })
export class ArenaVfxService {
  private cameraController: CameraController | null = null;

  constructor(private haptic: HapticService) {}

  registerCameraController(controller: CameraController) {
    this.cameraController = controller;
  }

  onDiceLanded() {
    this.haptic.diceStop();
    if (this.cameraController) {
      this.cameraController.triggerShake(0.35, 0.25);
    }
  }

  onRedTilePenalty() {
    this.haptic.error();
    if (this.cameraController) {
      this.cameraController.triggerShake(0.5, 0.35);
    }
  }

  onBlueTileReward() {
    this.haptic.lightImpact();
  }

  onStarObtained() {
    this.haptic.starCelebration();
    if (this.cameraController) {
      this.cameraController.triggerShake(0.6, 0.45);
    }
  }

  onTriviaResult(correct: boolean) {
    if (correct) {
      this.haptic.success();
    } else {
      this.haptic.error();
      if (this.cameraController) {
        this.cameraController.triggerShake(0.4, 0.3);
      }
    }
  }

  onSkillActivated() {
    this.haptic.skillUse();
    if (this.cameraController) {
      this.cameraController.triggerShake(0.45, 0.3);
    }
  }

  onGameOverVictory() {
    this.haptic.starCelebration();
    if (this.cameraController) {
      this.cameraController.triggerShake(0.7, 0.6);
    }
  }
}
