import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SCENARIO_DEFS, ScenarioId } from '../../arena/scenarios/scenario.factory';

@Component({
  selector: 'app-scenario-vote',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scenario-vote.component.html',
  styleUrl: './scenario-vote.component.scss',
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