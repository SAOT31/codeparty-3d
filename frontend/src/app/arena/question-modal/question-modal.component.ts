import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pregunta, Habilidad } from '../../models/game.models';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-question-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-modal.component.html',
  styleUrl: './question-modal.component.scss',
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

  constructor(private soundService: SoundService) {}

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

    if (this.isCorrect) {
      this.soundService.playCorrectAnswer();
    } else {
      this.soundService.playWrongAnswer();
    }

    setTimeout(() => {
      this.answeredEvent.emit(index);
    }, 1000);
  }
}