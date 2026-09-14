import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SCENARIO_DEFS, ScenarioId } from '../../arena/scenarios/scenario.factory';

@Component({
  selector: 'app-scenario-vote',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scenario-vote">
      <h2 class="sv-title">🗺️ Voten el Escenario</h2>

      <div class="sv-timer-row">
        <div class="sv-timer" [class.critical]="timeLeft <= 5">{{ timeLeft }}s</div>
        <div class="sv-timer-track">
          <div class="sv-timer-fill" [style.width.%]="(timeLeft / 15) * 100" [class.critical]="timeLeft <= 5"></div>
        </div>
      </div>

      <p class="sv-sub">El escenario con más votos gana — empate = aleatorio</p>

      <div class="sv-cards">
        <div
          class="sv-card"
          *ngFor="let def of defs"
          [class.sv-selected]="myVote === def.id"
          [class.sv-winning]="currentWinner === def.id"
          (click)="vote(def.id)"
          [id]="'vote-' + def.id"
        >
          <div class="sv-vote-bar" [style.width.%]="getVotePercent(def.id)"></div>

          <div class="sv-card-content">
            <div class="sv-emoji">{{ def.emoji }}</div>
            <div class="sv-name">{{ def.name }}</div>
            <div class="sv-desc">{{ def.description }}</div>

            <div class="sv-votes-count">
              <span class="sv-vote-num">{{ getVoteCount(def.id) }}</span>
              <span class="sv-vote-lbl"> voto{{ getVoteCount(def.id) !== 1 ? 's' : '' }}</span>
              <span class="sv-winner-badge" *ngIf="currentWinner === def.id"> 🏆 Ganando</span>
            </div>

            <div class="sv-my-vote" *ngIf="myVote === def.id">✅ Tu voto</div>
          </div>
        </div>
      </div>

      <div class="sv-result" *ngIf="timeLeft === 0">
        <span>{{ getWinnerDef()?.emoji }} <strong>{{ getWinnerDef()?.name }}</strong> ganó la votación</span>
      </div>
    </div>
  `,
  styles: [`
    .scenario-vote {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 0 8px;
      width: 100%;
    }

    .sv-title {
      font-family: var(--font-title);
      font-size: 1.8rem;
      color: #ffffff;
      margin: 0;
      text-align: center;
    }

    .sv-sub {
      color: rgba(255, 255, 255, 0.55);
      font-size: 0.82rem;
      margin: 0;
      text-align: center;
    }

    .sv-timer-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      max-width: 320px;
    }

    .sv-timer {
      font-family: var(--font-cyber);
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-primary);
      min-width: 38px;

      &.critical {
        color: var(--color-danger);
        animation: pulse-glow 0.5s infinite;
      }
    }

    .sv-timer-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .sv-timer-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
      border-radius: 4px;
      transition: width 1s linear;

      &.critical {
        background: var(--color-danger);
      }
    }

    .sv-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 16px;
      width: 100%;
      max-width: 900px;
    }

    @media (max-width: 640px) {
      .sv-cards {
        grid-template-columns: 1fr;
      }
    }

    .sv-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 16px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: translateY(-4px) scale(1.02);
        border-color: var(--color-primary);
      }

      &.sv-selected {
        border-color: var(--color-primary);
        background: rgba(0, 245, 255, 0.08);
        box-shadow: 0 0 20px rgba(0, 245, 255, 0.3);
      }

      &.sv-winning {
        border-color: #FFD700;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      }
    }

    .sv-vote-bar {
      position: absolute;
      bottom: 0; left: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
      transition: width 0.4s ease;
      border-radius: 2px;
    }

    .sv-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
    }

    .sv-emoji { font-size: 2.4rem; }

    .sv-name {
      font-family: var(--font-title);
      font-size: 1rem;
      font-weight: 800;
      color: #ffffff;
    }

    .sv-desc {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.5);
      line-height: 1.3;
    }

    .sv-votes-count {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.7);
      font-weight: 600;
    }

    .sv-vote-num {
      font-family: var(--font-cyber);
      font-size: 1.1rem;
      color: var(--color-primary);
    }

    .sv-winner-badge {
      color: var(--color-primary);
      font-weight: 800;
    }

    .sv-my-vote {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(68,207,108,0.2);
      color: var(--color-success);
      border: 1px solid rgba(68,207,108,0.4);
    }

    .sv-result {
      font-family: var(--font-title);
      font-size: 1.1rem;
      color: var(--color-primary);
      text-align: center;
      padding: 10px 20px;
      background: rgba(255,215,0,0.1);
      border-radius: 12px;
      border: 1.5px solid rgba(255,215,0,0.3);
    }
  `],
})
export class ScenarioVoteComponent implements OnInit, OnDestroy {
  @Input() myPlayerId: string = '';
  @Input() voteCounts: Record<string, number> = {};
  @Input() currentWinner: ScenarioId = 'isla';
  @Output() voted = new EventEmitter<ScenarioId>();
  @Output() voteFinished = new EventEmitter<ScenarioId>();

  defs = SCENARIO_DEFS;
  myVote: ScenarioId | null = null;
  timeLeft = 15;
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.intervalId);
        if (!this.myVote) {
          this.myVote = this.currentWinner;
        }
        this.voteFinished.emit(this.currentWinner);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  vote(id: ScenarioId) {
    if (this.timeLeft <= 0) return;
    this.myVote = id;
    this.voted.emit(id);
  }

  getVoteCount(id: ScenarioId): number {
    return this.voteCounts[id] || 0;
  }

  getVotePercent(id: ScenarioId): number {
    const total = Object.values(this.voteCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    return ((this.voteCounts[id] || 0) / total) * 100;
  }

  getWinnerDef() {
    return SCENARIO_DEFS.find(d => d.id === this.currentWinner);
  }
}