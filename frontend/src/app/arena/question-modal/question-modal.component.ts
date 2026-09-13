import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pregunta, Habilidad } from '../../models/game.models';

@Component({
  selector: 'app-question-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop">
      <div class="corner-overlay" style="animation: bounce-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both;">
        <div class="corner-card glass-panel">
          <div class="corner-header">
            <div class="skill-badge" [class]="habilidad">
              <span class="skill-icon">💡</span>
              <span>TRIVIA DE CÓDIGO</span>
            </div>
            <div class="timer" [class.critical]="timeLeft <= 5">
              ⏱️ {{ timeLeft }}s
            </div>
          </div>

          <div class="timer-bar-track">
            <div
              class="timer-bar-fill"
              [style.width.%]="(timeLeft / 20) * 100"
              [class.critical]="timeLeft <= 5"
            ></div>
          </div>

          <div class="question-body">
            <p class="question-text">{{ pregunta.enunciado }}</p>
          </div>

          <div class="options-grid">
            <button
              class="option-btn"
              *ngFor="let op of pregunta.opciones; let i = index"
              [class.selected]="selectedOption === i"
              [class.correct-btn]="answered && i === pregunta.correcta"
              [class.wrong-btn]="answered && selectedOption === i && !isCorrect"
              [disabled]="answered"
              (click)="selectOption(i)"
              [id]="'opt-' + i"
            >
              <span class="option-letter">{{ ['A', 'B', 'C', 'D'][i] }}</span>
              <span class="option-text">{{ op }}</span>
            </button>
          </div>

          <div class="result-message" *ngIf="answered">
            <span *ngIf="isCorrect" class="neon-green">✨ ¡CORRECTO! ¡+10 Puntos & Poder Activado!</span>
            <span *ngIf="!isCorrect" class="neon-red">❌ ¡Fallaste! La respuesta correcta era: {{ ['A', 'B', 'C', 'D'][pregunta.correcta] }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 20, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .corner-overlay {
      width: 480px;
      max-width: 92vw;
      pointer-events: auto;
      font-family: var(--font-text);
    }

    .corner-card {
      background: rgba(14, 20, 42, 0.95);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(0, 245, 255, 0.4);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 245, 255, 0.25);
    }

    .corner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .skill-badge {
      font-family: var(--font-cyber);
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(0, 245, 255, 0.15);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;

      &.attack {
        color: #FF4757;
        border-color: #FF4757;
        background: rgba(255, 71, 87, 0.15);
      }
      &.shield {
        color: #00F5FF;
        border-color: #00F5FF;
        background: rgba(0, 245, 255, 0.15);
      }
      &.boost {
        color: #FFD700;
        border-color: #FFD700;
        background: rgba(255, 215, 0, 0.15);
      }
    }

    .timer {
      font-family: var(--font-cyber);
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--color-primary);

      &.critical {
        color: #FF4757;
        animation: pulse-glow 0.6s infinite;
      }
    }

    .timer-bar-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .timer-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
      border-radius: 2px;
      transition: width 1s linear;

      &.critical {
        background: #FF4757;
      }
    }

    .question-body {
      margin-bottom: 12px;
    }

    .question-text {
      font-size: 0.92rem;
      line-height: 1.35;
      font-weight: 600;
      color: #F8FAFC;
      margin: 0;
    }

    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .option-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      text-align: left;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: rgba(0, 245, 255, 0.15);
        border-color: var(--color-primary);
        transform: translateX(4px);
      }

      &.selected {
        background: rgba(0, 245, 255, 0.25);
        border-color: var(--color-primary);
      }

      &.correct-btn {
        background: rgba(46, 213, 115, 0.3) !important;
        border-color: #2ED573 !important;
        color: #2ED573 !important;
      }

      &.wrong-btn {
        background: rgba(255, 71, 87, 0.3) !important;
        border-color: #FF4757 !important;
        color: #FF4757 !important;
      }
    }

    .option-letter {
      font-family: var(--font-cyber);
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--color-primary);
      width: 18px;
      flex-shrink: 0;
    }

    .option-text {
      flex: 1;
      font-size: 0.85rem;
    }

    .result-message {
      margin-top: 10px;
      text-align: center;
      font-size: 0.82rem;
      font-weight: 800;
      font-family: var(--font-cyber);
    }

    .neon-green { color: #2ED573; text-shadow: 0 0 8px rgba(46, 213, 115, 0.6); }
    .neon-red { color: #FF4757; text-shadow: 0 0 8px rgba(255, 71, 87, 0.6); }

    @keyframes slideInCorner {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `],
})
export class QuestionModalComponent implements OnInit, OnDestroy {
  @Input() habilidad: Habilidad = 'boost';
  @Input() pregunta!: Pregunta;
  @Output() answeredEvent = new EventEmitter<number>();

  selectedOption: number | null = null;
  answered = false;
  isCorrect = false;
  timeLeft = 20;
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.intervalId);
        if (!this.answered) {
          this.submitAnswer(-1);
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getSkillIcon(): string {
    switch (this.habilidad) {
      case 'boost': return '🚀';
      case 'attack': return '💥';
      case 'shield': return '🛡️';
      default: return '⚡';
    }
  }

  selectOption(index: number) {
    if (this.answered) return;
    this.selectedOption = index;
    this.submitAnswer(index);
  }

  private submitAnswer(index: number) {
    this.answered = true;
    clearInterval(this.intervalId);
    this.isCorrect = index === this.pregunta.correcta;

    setTimeout(() => {
      this.answeredEvent.emit(index);
    }, 1000);
  }
}